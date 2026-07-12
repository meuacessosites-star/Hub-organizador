/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Status } from '../types';
import { X, Plus, Trash2, ShieldCheck, Palette, Pencil, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from '../context/ToastContext';

interface ManageStatusesModalProps {
  isOpen: boolean;
  onClose: () => void;
  statuses: Status[];
  onAddStatus: (status: Omit<Status, 'id' | 'isCustom'>) => void;
  onUpdateStatus: (id: string, updated: Partial<Status>) => void;
  onDeleteStatus: (id: string) => void;
}

const PRESET_COLORS = ['#3b82f6', '#f59e0b', '#8b5cf6', '#10b981', '#f43f5e', '#64748b', '#06b6d4', '#ec4899'];

// Helper to convert HEX to HSV for exact indicator position
const hexToHsv = (hex: string): { h: number; s: number; v: number } => {
  let r = 0, g = 0, b = 0;
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  } else {
    return { h: 0, s: 0, v: 1 };
  }

  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  
  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, v };
};

const getIndicatorCoords = (color: string, radius: number = 64) => {
  const { h, s } = hexToHsv(color);
  const angle = (h / 360) * (Math.PI * 2) - Math.PI;
  const dist = s * radius;
  return {
    x: radius + Math.cos(angle) * dist,
    y: radius + Math.sin(angle) * dist,
  };
};

export const ManageStatusesModal: React.FC<ManageStatusesModalProps> = ({
  isOpen,
  onClose,
  statuses,
  onAddStatus,
  onUpdateStatus,
  onDeleteStatus,
}) => {
  const { addToast } = useToast();
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [selectedColor, setSelectedColor] = useState('#3b82f6');
  const [colorHexInput, setColorHexInput] = useState('3b82f6');
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [deletingStatusId, setDeletingStatusId] = useState<string | null>(null);
  const [showColorWheel, setShowColorWheel] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShowColorWheel(false);
    }
  }, [isOpen, editingStatusId]);

  const colorWheelRef = useRef<HTMLCanvasElement>(null);
  const colorWheelContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showColorWheel) {
      const timer = setTimeout(() => {
        colorWheelContainerRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [showColorWheel]);

  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0, g = 0, b = 0;

    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }

    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255),
      Math.round((b + m) * 255),
    ];
  };

  useEffect(() => {
    if (!isOpen || !showColorWheel || !colorWheelRef.current) return;
    const canvas = colorWheelRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= radius) {
          let angle = Math.atan2(dy, dx) + Math.PI;
          const hue = (angle / (Math.PI * 2)) * 360;
          const sat = dist / radius;
          const val = 1.0;

          const rgb = hsvToRgb(hue, sat, val);
          const index = (y * width + x) * 4;
          data[index] = rgb[0];
          data[index + 1] = rgb[1];
          data[index + 2] = rgb[2];
          data[index + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [isOpen, showColorWheel]);

  const isDraggingRef = useRef(false);

  const handleColorSelection = (clientX: number, clientY: number) => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    try {
      const clampedX = Math.max(0, Math.min(canvas.width - 1, x * (canvas.width / rect.width)));
      const clampedY = Math.max(0, Math.min(canvas.height - 1, y * (canvas.height / rect.height)));
      
      const pixel = ctx.getImageData(clampedX, clampedY, 1, 1).data;
      if (pixel[3] > 0) {
        const hex = '#' + [pixel[0], pixel[1], pixel[2]].map(val => {
          const hexStr = val.toString(16);
          return hexStr.length === 1 ? '0' + hexStr : hexStr;
        }).join('');
        updateSelectedColor(hex);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    handleColorSelection(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      handleColorSelection(e.clientX, e.clientY);
    }
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

  const updateSelectedColor = (color: string) => {
    setSelectedColor(color);
    setColorHexInput(color.replace('#', ''));
  };

  const handleStartEdit = (status: Status) => {
    setEditingStatusId(status.id);
    setNewStatusLabel(status.label);
    updateSelectedColor(status.color);
  };

  const handleCancelEdit = () => {
    setEditingStatusId(null);
    setNewStatusLabel('');
    updateSelectedColor('#3b82f6');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusLabel.trim()) return;

    if (editingStatusId) {
      onUpdateStatus(editingStatusId, {
        label: newStatusLabel.trim(),
        color: selectedColor,
      });
      addToast(`Status "${newStatusLabel.trim()}" atualizado com sucesso! 📝`, 'success');
      setEditingStatusId(null);
    } else {
      onAddStatus({
        label: newStatusLabel.trim(),
        color: selectedColor,
      });
      addToast(`Status "${newStatusLabel.trim()}" criado com sucesso! ✨`, 'success');
    }

    setNewStatusLabel('');
    updateSelectedColor('#3b82f6');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-xl bg-white dark:bg-[#181922] rounded-2xl border border-neutral-200 dark:border-[#26283b] overflow-hidden shadow-2xl text-neutral-800 dark:text-neutral-200"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-[#26283b]/70 flex items-center justify-between bg-neutral-50 dark:bg-[#111219]/90">
          <div>
            <h2 className="font-sans font-bold text-base text-neutral-900 dark:text-white">
              Gerenciar Status de Pedido
            </h2>
            <p className="text-neutral-500 text-[10px] font-medium mt-1">
              Personalize os estados das suas compras
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 max-h-[65vh] overflow-y-auto">
          {/* Create new status form */}
          <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-neutral-200 dark:border-[#25283a] bg-neutral-50/60 dark:bg-[#13141c]/90 flex flex-col gap-3.5">
            <h3 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
              <span>{editingStatusId ? 'Editar status' : 'Novo status'}</span>
            </h3>

            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <input
                type="text"
                required
                value={newStatusLabel}
                onChange={(e) => setNewStatusLabel(e.target.value)}
                placeholder="Ex: Em separação, Aguardando, Reembolsado..."
                className="w-full sm:flex-1 h-12 px-4 rounded-lg text-sm bg-neutral-50 border border-neutral-200 text-neutral-800 placeholder-neutral-400 focus:outline-none focus:border-indigo-500 dark:bg-[#111219] dark:border-[#2a2d40] dark:text-neutral-200 dark:placeholder-neutral-500"
              />
              <div className="flex gap-2 w-full sm:w-auto shrink-0">
                <button
                  type="submit"
                  className="flex-1 sm:flex-initial h-12 px-5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm flex items-center justify-center gap-1 cursor-pointer"
                >
                  {editingStatusId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingStatusId ? 'Salvar' : 'Adicionar'}</span>
                </button>
                {editingStatusId && (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="h-12 px-3 rounded-lg border border-neutral-200 dark:border-[#2a2d40]/80 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-xs font-medium cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </div>

            {/* Color picker preset row */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-neutral-500 flex items-center gap-1">
                  <Palette className="w-3 h-3" /> Cores do Status
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {PRESET_COLORS.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => updateSelectedColor(col)}
                    className="w-6 h-6 rounded-full border border-black/40 flex items-center justify-center shadow-inner hover:scale-110 transition-all cursor-pointer shrink-0"
                    style={{ backgroundColor: col }}
                  >
                    {selectedColor === col && (
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Preview & Hex Input */}
            <div className="flex items-center gap-3 w-full max-w-xs mx-auto">
              <button
                type="button"
                onClick={() => setShowColorWheel(!showColorWheel)}
                className="w-10 h-10 rounded-xl border border-neutral-300 shadow-md flex items-center justify-center text-xs text-white dark:border-[#25283a]/80 shrink-0 hover:scale-105 active:scale-95 transition-all cursor-pointer relative group"
                style={{ backgroundColor: selectedColor }}
              >
                <Palette className="w-4.5 h-4.5 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] opacity-80 group-hover:opacity-100 transition-opacity" />
              </button>
              <div className="flex-1 flex items-center gap-0.5 bg-neutral-50 dark:bg-[#111219] border border-neutral-200 dark:border-[#2a2d40] rounded-xl px-3 h-10">
                <span className="text-xs text-neutral-500 font-mono">#</span>
                <input
                  type="text"
                  value={colorHexInput}
                  onChange={(e) => {
                    const val = e.target.value.trim().replace('#', '');
                    if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setColorHexInput(val);
                      if (val.length === 3 || val.length === 6) {
                        setSelectedColor(`#${val}`);
                      }
                    }
                  }}
                  onBlur={() => {
                    let val = colorHexInput;
                    if (val.length !== 3 && val.length !== 6) {
                      setColorHexInput(selectedColor.replace('#', ''));
                    } else {
                      setSelectedColor(`#${val}`);
                    }
                  }}
                  className="w-full bg-transparent text-xs font-mono text-neutral-800 dark:text-neutral-200 focus:outline-none uppercase"
                />
              </div>
            </div>

            {/* Color Wheel Section */}
            <AnimatePresence>
              {showColorWheel && (
                <motion.div
                  ref={colorWheelContainerRef}
                  initial={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, scale: 1, height: 'auto', marginTop: 12 }}
                  exit={{ opacity: 0, scale: 0.9, height: 0, marginTop: 0 }}
                  className="overflow-hidden flex flex-col items-center gap-4 p-4 rounded-xl border border-neutral-200 dark:border-[#25283a] bg-white dark:bg-[#14151f] w-full shadow-lg"
                >
                  <div className="relative w-32 h-32 flex items-center justify-center select-none touch-none">
                    <canvas
                      ref={colorWheelRef}
                      width={128}
                      height={128}
                      onMouseDown={handleMouseDown}
                      onMouseMove={handleMouseMove}
                      onMouseUp={handleMouseUpOrLeave}
                      onMouseLeave={handleMouseUpOrLeave}
                      className="rounded-full cursor-crosshair border border-neutral-300 shadow-md dark:border-neutral-700 touch-none z-10"
                    />
                    {(() => {
                      const coords = getIndicatorCoords(selectedColor, 64);
                      return (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                          <line x1={64} y1={64} x2={coords.x} y2={coords.y} stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                          <circle cx={coords.x} cy={coords.y} r="5" fill={selectedColor} stroke="white" strokeWidth="2" />
                        </svg>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Current list of statuses */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-500 select-none">
              Status Existentes
            </span>
            <div className="flex flex-col gap-1.5 select-text">
              {statuses.map((status) => {
                const isSystem = !status.isCustom;
                return (
                  <div
                    key={status.id}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-200 dark:border-[#2a2d40]/40 bg-neutral-50 dark:bg-[#111219]/60"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: status.color }} />
                      <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {status.label}
                      </span>
                      {isSystem && (
                        <span className="text-[8px] font-bold font-sans uppercase px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-400 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-500 dark:border-neutral-700">
                          Sistema
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {deletingStatusId === status.id ? (
                        <div className="flex items-center gap-1 bg-rose-500/10 p-0.5 rounded border border-rose-500/20">
                          <span className="text-[9px] font-bold text-rose-500 px-1">Excluir?</span>
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteStatus(status.id);
                              addToast(`Status "${status.label}" excluído com sucesso!`, 'info');
                              setDeletingStatusId(null);
                            }}
                            className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingStatusId(null)}
                            className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 text-[9px] font-semibold cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleStartEdit(status)}
                            className={`p-1.5 rounded transition-colors cursor-pointer ${
                              editingStatusId === status.id
                                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                                : 'hover:bg-neutral-200 text-neutral-500 hover:text-indigo-400 dark:hover:bg-neutral-800'
                            }`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {!isSystem && (
                            <button
                              type="button"
                              onClick={() => setDeletingStatusId(status.id)}
                              className="p-1.5 rounded hover:bg-neutral-200 text-neutral-500 hover:text-rose-400 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-[#26283b]/70 flex items-center justify-end bg-neutral-50 dark:bg-[#111219]/90 select-none">
          <button
            onClick={onClose}
            className="px-5 h-10 rounded-lg text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </div>
  );
};

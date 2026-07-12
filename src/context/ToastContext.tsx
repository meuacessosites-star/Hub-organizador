/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
  removeToast: (id: string) => void;
  toasts: Toast[];
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType = 'success', duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, toasts }}>
      {children}
      
      {/* Floating Toast Container */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 max-w-md w-[92%] sm:w-max pointer-events-none select-none items-center">
        <AnimatePresence>
          {toasts.map((toast) => {
            let bgClass = '';
            let borderClass = '';
            let textClass = '';
            let iconClass = '';
            let Icon = CheckCircle2;

            if (theme === 'light') {
              // Light theme -> Dark, semi-transparent black toast
              bgClass = 'bg-[#18181b]/75 dark:bg-[#18181b]/75 shadow-xl shadow-neutral-950/15';
              borderClass = 'border-white/10';
              textClass = 'text-white';
              
              switch (toast.type) {
                case 'success':
                  iconClass = 'text-emerald-400';
                  Icon = CheckCircle2;
                  break;
                case 'error':
                  iconClass = 'text-rose-400';
                  Icon = AlertCircle;
                  break;
                case 'warning':
                  iconClass = 'text-amber-400';
                  Icon = AlertTriangle;
                  break;
                case 'info':
                default:
                  iconClass = 'text-indigo-400';
                  Icon = Info;
                  break;
              }
            } else {
              // Dark theme -> Light, semi-transparent white toast
              bgClass = 'bg-white/75 dark:bg-white/75 shadow-xl shadow-black/25';
              borderClass = 'border-black/10';
              textClass = 'text-neutral-950';
              
              switch (toast.type) {
                case 'success':
                  iconClass = 'text-emerald-600';
                  Icon = CheckCircle2;
                  break;
                case 'error':
                  iconClass = 'text-rose-600';
                  Icon = AlertCircle;
                  break;
                case 'warning':
                  iconClass = 'text-amber-500';
                  Icon = AlertTriangle;
                  break;
                case 'info':
                default:
                  iconClass = 'text-indigo-600';
                  Icon = Info;
                  break;
              }
            }

            const closeBtnClass = theme === 'light'
              ? 'hover:bg-white/10 text-white/50 hover:text-white'
              : 'hover:bg-black/5 text-neutral-500 hover:text-neutral-955';

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 20, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className={`pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-xl border max-w-full ${bgClass} ${borderClass} ${textClass} backdrop-blur-md shadow-lg`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${iconClass}`} />
                <span className="text-xs font-bold tracking-wide font-sans leading-tight">
                  {toast.message}
                </span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className={`p-1 -mr-1 rounded-full transition-all cursor-pointer flex items-center justify-center shrink-0 ${closeBtnClass}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

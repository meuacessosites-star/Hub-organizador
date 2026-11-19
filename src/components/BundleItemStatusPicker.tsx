import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, X } from 'lucide-react';
import { orderPurchaseStatuses } from '../lib/utils';
import type { Status } from '../types';

interface BundleItemStatusPickerProps {
  itemName: string;
  currentStatus: string;
  statuses: Status[];
  onChange: (status: string) => void;
  compact?: boolean;
}

/** Evita que um toque em uma bolinha altere o recebimento de um item por engano. */
export function BundleItemStatusPicker({
  itemName, currentStatus, statuses, onChange, compact = false
}: BundleItemStatusPickerProps) {
  const [open, setOpen] = useState(false);
  const [pendingDelivered, setPendingDelivered] = useState(false);
  const ordered = orderPurchaseStatuses(statuses);
  const current = ordered.find(status => status.id === currentStatus);
  const currentLabel = current?.label || currentStatus.replace(/_/g, ' ');
  const currentColor = current?.color || '#F59E0B';

  const close = () => {
    setPendingDelivered(false);
    setOpen(false);
  };
  const choose = (status: string) => {
    if (status === currentStatus) { close(); return; }
    if (status === 'entregue' && currentStatus !== 'entregue') {
      setPendingDelivered(true);
      return;
    }
    onChange(status);
    close();
  };
  const confirmDelivered = () => {
    onChange('entregue');
    close();
  };
  return (
    <>
      <button type="button"
        onClick={event => { event.preventDefault(); event.stopPropagation(); setOpen(true); }}
        title={`Status deste item: ${currentLabel}. Toque para corrigir ou alterar`}
        aria-label={`Alterar status de ${itemName}. Atualmente: ${currentLabel}`}
        className={`inline-flex items-center justify-center shrink-0 rounded-full cursor-pointer hover:bg-indigo-500/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${compact ? 'w-5 h-5' : 'w-6 h-6'}`}
      >
        <span className={`rounded-full border-2 ${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'}`}
          style={{ borderColor: currentColor, backgroundColor: currentColor + '28' }} />
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={close}>
          <section role="dialog" aria-modal="true" aria-label="Alterar status do item"
            className="w-full max-w-sm min-w-0 max-h-[85dvh] overflow-y-auto rounded-2xl border border-indigo-500/25 bg-white dark:bg-[#121219] p-4 shadow-2xl"
            onClick={event => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Status do item</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 break-words mt-1">{itemName}</p>
              </div>
              <button type="button" onClick={close} aria-label="Fechar sem alterar"
                className="shrink-0 p-2 rounded-lg border border-neutral-200 dark:border-white/10 text-neutral-600 dark:text-neutral-300">
                <X className="w-4 h-4" />
              </button>
            </div>
            {pendingDelivered ? (
              <div className="mt-4 space-y-4">
                <div className="p-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">Você recebeu este item?</p>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-1">
                    Confirme apenas se ele realmente chegou. Isso não marca a compra inteira como entregue.
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPendingDelivered(false)}
                    className="min-h-11 rounded-xl border border-neutral-200 dark:border-white/15 text-neutral-700 dark:text-neutral-200 text-sm font-semibold inline-flex items-center justify-center gap-1">
                    <ChevronLeft className="w-4 h-4" /> Voltar
                  </button>
                  <button type="button" onClick={confirmDelivered}
                    className="min-h-11 rounded-xl bg-emerald-600 text-white text-sm font-semibold">Sim, recebi</button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 mb-3">
                  Se marcou como entregue por engano, selecione a etapa correta. O status da compra inteira não será alterado.
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {ordered.map(status => (
                    <button key={status.id} type="button" onClick={() => choose(status.id)}
                      aria-pressed={currentStatus === status.id}
                      className={`flex items-center gap-3 min-h-11 text-left rounded-xl border px-3 py-2.5 ${currentStatus === status.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-neutral-200 dark:border-white/10 hover:border-indigo-500/40'}`}>
                      <span className="w-3 h-3 shrink-0 rounded-full border-2"
                        style={{ backgroundColor: status.color + '28', borderColor: status.color }}/>
                      <span className="text-sm font-semibold flex-1 text-neutral-800 dark:text-neutral-100">{status.label}</span>
                      {currentStatus === status.id && <><Check className="w-4 h-4 text-indigo-500" /><span className="sr-only">Atual</span></>}
                    </button>
                  ))}
                </div>
                <button type="button" onClick={close}
                  className="w-full mt-3 min-h-10 rounded-xl border border-neutral-200 dark:border-white/10 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  Cancelar
                </button>
              </>
            )}
          </section>
        </div>,
        document.body
      )}
    </>
  );
}

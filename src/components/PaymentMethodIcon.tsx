import React from 'react';
import { Banknote, Barcode, CalendarDays, CreditCard, Landmark, Receipt, Wallet } from 'lucide-react';

/** Ícone vetorial simplificado para identificar a opção Pix, sem depender de imagem externa. */
function PixSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7.2 5.4 9 3.6a4.25 4.25 0 0 1 6 0l3.6 3.6a4.25 4.25 0 0 1 0 6" />
      <path d="m16.8 18.6-1.8 1.8a4.25 4.25 0 0 1-6 0l-3.6-3.6a4.25 4.25 0 0 1 0-6" />
      <path d="m5.4 10.8 3.2 3.2a4.8 4.8 0 0 0 6.8 0l3.2-3.2" />
      <path d="m7.2 5.4 1.4 1.4a4.8 4.8 0 0 0 6.8 0l1.4-1.4" />
    </svg>
  );
}

export const PAYMENT_METHOD_OPTIONS = [
  { value: '', label: 'Selecione...' },
  { value: 'Pix', label: 'Pix' },
  { value: 'cartao', label: 'Cartão de Crédito' },
  { value: 'parcelada', label: 'Compra Parcelada' },
  { value: 'Boleto Bancário', label: 'Boleto Bancário' },
  { value: 'Dinheiro', label: 'Dinheiro' },
  { value: 'conta', label: 'Conta / Saldo Bancário' },
  { value: 'Outro', label: 'Outro (Digitar)...' },
] as const;

export function getPaymentMethodLabel(method: string): string {
  return PAYMENT_METHOD_OPTIONS.find(option => option.value.toLowerCase() === method.toLowerCase())?.label || method;
}

export function PaymentMethodIcon({ method, className = 'w-4 h-4' }: { method?: string; className?: string }) {
  const normalized = (method || '').toLowerCase().trim();
  if (normalized === 'pix') return <PixSymbol className={className} />;
  if (normalized === 'cartao' || normalized === 'cartão de crédito') return <CreditCard className={className} aria-hidden="true" />;
  if (normalized === 'parcelada' || normalized === 'compra parcelada') return <CalendarDays className={className} aria-hidden="true" />;
  if (normalized === 'boleto bancário' || normalized === 'boleto') return <Barcode className={className} aria-hidden="true" />;
  if (normalized === 'dinheiro') return <Banknote className={className} aria-hidden="true" />;
  if (normalized === 'conta' || normalized === 'conta bancária') return <Landmark className={className} aria-hidden="true" />;
  if (normalized === 'outro') return <Wallet className={className} aria-hidden="true" />;
  return <Receipt className={className} aria-hidden="true" />;
}

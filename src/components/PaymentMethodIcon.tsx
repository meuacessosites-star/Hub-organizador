import React from 'react';
import { Banknote, Barcode, CalendarDays, CreditCard, Landmark, Receipt, Wallet } from 'lucide-react';

/** Símbolo Pix somente em contorno, na cor turquesa da referência.
 * Sem fundo, blocos preenchidos ou alteração dos demais meios de pagamento.
 */
function PixSymbol({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false"
      preserveAspectRatio="xMidYMid meet" fill="none" stroke="#29BBAE" strokeWidth="1.45"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.283 18.36a3.505 3.505 0 0 0 2.493-1.032l3.6-3.6a.684.684 0 0 1 .946 0l3.613 3.613a3.504 3.504 0 0 0 2.493 1.032h.71l-4.56 4.56a3.647 3.647 0 0 1-5.156 0L4.85 18.36ZM18.428 5.627a3.505 3.505 0 0 0-2.493 1.032l-3.613 3.614a.67.67 0 0 1-.946 0l-3.6-3.6A3.505 3.505 0 0 0 5.283 5.64h-.434l4.573-4.572a3.646 3.646 0 0 1 5.156 0l4.559 4.559ZM1.068 9.422 3.79 6.699h1.492a2.483 2.483 0 0 1 1.744.722l3.6 3.6a1.73 1.73 0 0 0 2.443 0l3.614-3.613a2.482 2.482 0 0 1 1.744-.723h1.767l2.737 2.737a3.646 3.646 0 0 1 0 5.156l-2.736 2.736h-1.768a2.482 2.482 0 0 1-1.744-.722l-3.613-3.613a1.77 1.77 0 0 0-2.444 0l-3.6 3.6a2.483 2.483 0 0 1-1.744.722H3.791l-2.723-2.723a3.646 3.646 0 0 1 0-5.156" />
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

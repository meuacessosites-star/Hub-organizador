export const safeParse = <T,>(value: string | null, defaultValue: T): T => {
  if (!value || value === 'undefined' || value === 'null' || value === '[object Object]') return defaultValue;
  try {
    const parsed = JSON.parse(value);
    if (parsed === null || parsed === undefined) return defaultValue;
    return parsed as T;
  } catch (e) {
    console.error("Error parsing JSON from localStorage:", e);
    return defaultValue;
  }
};

export const safeGetItem = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    console.error("Error getting localStorage:", e);
    return null;
  }
};

export const safeRemoveItem = (key: string): boolean => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error("Error removing from localStorage:", e);
    return false;
  }
};

export const safeSetItem = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error("Error setting localStorage:", e);
    return false;
  }
};

/**
 * Sanitizes and normalizes URLs to prevent XSS and ensure external links are absolute.
 */
export const safeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  const trimmedUrl = url.trim();
  const lowercaseUrl = trimmedUrl.toLowerCase();
  
  // Block dangerous protocols
  if (lowercaseUrl.startsWith('javascript:') || lowercaseUrl.startsWith('vbscript:') || lowercaseUrl.startsWith('data:')) {
    return undefined;
  }
  
  // Allow safe non-http protocols
  if (lowercaseUrl.startsWith('mailto:') || lowercaseUrl.startsWith('tel:')) {
    return trimmedUrl;
  }
  
  // If it has a protocol, verify it's http or https
  if (lowercaseUrl.includes('://')) {
    if (lowercaseUrl.startsWith('http://') || lowercaseUrl.startsWith('https://')) {
      return trimmedUrl;
    }
    return undefined; // Block other protocols
  }
  
  // If it doesn't have a protocol, assume it's an external link and add https://
  // This prevents relative URL issues (e.g. "google.com" becoming "[origin]/google.com")
  return `https://${trimmedUrl}`;
};


/** Ordem lógica do envio, independentemente da ordem em que o Firestore devolve os documentos.
 * Resultados finais são alternativas, não etapas consecutivas.
 * Status personalizados ficam entre o envio e o resultado, mantendo a ordem relativa.
 */
import type { Status } from '../types';

const PURCHASE_STAGES = ['pedido_feito', 'enviado', 'saiu_entrega'] as const;
const PURCHASE_OUTCOMES = ['entregue', 'cancelado', 'devolvido'] as const;

export function isPurchaseFinalStatus(id: string): boolean {
  return (PURCHASE_OUTCOMES as readonly string[]).includes(id);
}

export function orderPurchaseStatuses(statuses: Status[]): Status[] {
  const group = (id: string): number => {
    const normalIndex = PURCHASE_STAGES.indexOf(id as typeof PURCHASE_STAGES[number]);
    if (normalIndex >= 0) return normalIndex;
    const resultIndex = PURCHASE_OUTCOMES.indexOf(id as typeof PURCHASE_OUTCOMES[number]);
    if (resultIndex >= 0) return 100 + resultIndex;
    return 50; // etapas personalizadas, preservadas na ordem existente
  };
  return statuses.map((status, index) => ({status, index}))
    .sort((a, b) => group(a.status.id) - group(b.status.id) || a.index - b.index)
    .map(item => item.status);
}

/** Avança normalmente até Entregue. Cancelado e Devolvido só são escolhidos manualmente. */
export function nextPurchaseStatus(statuses: Status[], currentId: string): string | null {
  if (isPurchaseFinalStatus(currentId)) return null;
  const normalFlow = orderPurchaseStatuses(statuses)
    .filter(status => !isPurchaseFinalStatus(status.id) || status.id === 'entregue');
  const currentIndex = normalFlow.findIndex(status => status.id === currentId);
  return normalFlow[currentIndex + 1]?.id ?? null;
}


/**
 * Datas de calendário (YYYY-MM-DD) representam um dia escolhido pelo usuário,
 * não um instante em UTC. Evita que 25/11 apareça como 24/11 no Brasil.
 */
export function localCalendarDate(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCalendarDateBR(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  // Valores antigos em formato timestamp continuam sendo tratados como instantes.
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? value : timestamp.toLocaleDateString('pt-BR');
}

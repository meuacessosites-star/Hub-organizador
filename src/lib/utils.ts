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
 * Sanitizes URLs to prevent XSS (e.g. javascript: URIs)
 */
export const safeUrl = (url: string | undefined): string | undefined => {
  if (!url) return undefined;
  try {
    const parsed = new URL(url, window.location.origin);
    // Only allow http, https, and mailto
    if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return parsed.href;
    }
    return undefined; // Block unsafe protocols
  } catch (e) {
    // If it's a relative URL or malformed but doesn't start with javascript/vbscript/data
    const lowercaseUrl = url.toLowerCase().trim();
    if (lowercaseUrl.startsWith('javascript:') || lowercaseUrl.startsWith('vbscript:') || lowercaseUrl.startsWith('data:')) {
      return undefined;
    }
    return url;
  }
};

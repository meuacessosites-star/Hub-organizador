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

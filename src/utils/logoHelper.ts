/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Guesses or resolves a domain based on platform name or user-input URL.
 */
export function getDomainFromInput(name: string, url?: string): string {
  if (url) {
    try {
      const cleanUrl = url.trim().toLowerCase();
      const withHttp = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      const parsed = new URL(withHttp);
      const host = parsed.hostname.replace('www.', '');
      if (host && host.includes('.')) {
        return host;
      }
    } catch {
      // Fallback to name search
    }
  }

  const normalized = name.trim().toLowerCase();
  
  // Custom manual mappings for popular platforms
  const mappings: { [key: string]: string } = {
    github: 'github.com',
    nubank: 'nubank.com.br',
    netflix: 'netflix.com',
    'mercado livre': 'mercadolivre.com.br',
    spotify: 'spotify.com',
    notion: 'notion.so',
    figma: 'figma.com',
    slack: 'slack.com',
    canva: 'canva.com',
    linear: 'linear.app',
    trello: 'trello.com',
    drive: 'google.com',
    gmail: 'google.com',
    google: 'google.com',
    aws: 'amazon.com',
    amazon: 'amazon.com.br',
    disney: 'disneyplus.com',
    hbo: 'max.com',
    prime: 'primevideo.com',
    steam: 'steampowered.com',
    xbox: 'xbox.com',
    playstation: 'playstation.com',
    inter: 'bancointer.com.br',
    itau: 'itau.com.br',
    bradesco: 'bradesco.com.br',
    santander: 'santander.com.br',
    neon: 'neon.com.br',
    xp: 'xpi.com.br',
  };

  if (mappings[normalized]) {
    return mappings[normalized];
  }

  // Attempt to build a generic domain if the user typed something like "example.com"
  if (normalized.includes('.')) {
    return normalized;
  }

  // Fallback guess: only guess if name is at least 3 characters AND we have a URL hint
  // If no URL is provided, we prefer initials unless it's a known brand (checked above)
  if (!url || normalized.length < 3) {
    return '';
  }

  return `${normalized.replace(/\s+/g, '')}.com`;
}

/**
 * Extracts a readable platform name from a domain or URL
 */
export function getPlatformNameFromUrl(url: string): string {
  if (!url) return '';
  try {
    const domain = getDomainFromInput('', url);
    if (!domain) return '';
    
    // Manual overrides for domains that don't match the first part of the hostname
    const domainOverrides: { [key: string]: string } = {
      'steampowered.com': 'Steam',
      'disneyplus.com': 'Disney+',
      'primevideo.com': 'Prime Video',
      'mercadolivre.com.br': 'Mercado Livre',
      'bancointer.com.br': 'Banco Inter',
      'google.com': 'Google',
      'max.com': 'HBO Max',
    };

    if (domainOverrides[domain]) return domainOverrides[domain];

    // Common mappings for prettier names
    const prettyNames: { [key: string]: string } = {
      github: 'GitHub',
      netflix: 'Netflix',
      spotify: 'Spotify',
      youtube: 'YouTube',
      nubank: 'Nubank',
      amazon: 'Amazon',
      facebook: 'Facebook',
      instagram: 'Instagram',
      twitter: 'Twitter',
      linkedin: 'LinkedIn',
      disneyplus: 'Disney+',
      primevideo: 'Prime Video',
      gmail: 'Gmail',
      outlook: 'Outlook',
      hotmail: 'Hotmail',
      yahoo: 'Yahoo',
      aliexpress: 'AliExpress',
      shopee: 'Shopee',
      mercadolivre: 'Mercado Livre',
    };

    const parts = domain.split('.');
    const ignoredSubdomains = new Set([
      'www', 'pt', 'br', 'es', 'en', 'm', 'login', 'app', 'play', 'mail', 
      'admin', 'portal', 'account', 'accounts', 'security', 'my', 'web', 'mobile'
    ]);

    let namePart = parts[0].toLowerCase();
    
    // If first part is a common subdomain, use the second part
    if (ignoredSubdomains.has(namePart) && parts.length > 1) {
      namePart = parts[1].toLowerCase();
    }

    if (prettyNames[namePart]) {
      return prettyNames[namePart];
    }

    // Capitalize first letter of the name part
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  } catch {
    return '';
  }
}

/**
 * Gets a clean, high-quality logo URL or falls back to clearbit / devicons
 */
export function getLogoUrl(name: string, url?: string, attempt: number = 0): string {
  const domain = getDomainFromInput(name, url);
  if (!domain) return '';
  
  if (attempt === 0) {
    return `https://logo.clearbit.com/${domain}`;
  }
  return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`;
}

/**
 * Generates initials for avatar fallback (e.g., "GitHub" -> "GH")
 */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

/**
 * Generates a clean matching color for a platform based on its name
 */
export function getPlatformColor(name: string): string {
  const normalized = name.toLowerCase().trim();
  const brandColors: { [key: string]: string } = {
    github: '#181717',
    nubank: '#8a05be',
    netflix: '#e50914',
    'mercado livre': '#ffe600',
    'mercado pago': '#009ee3',
    spotify: '#1db954',
    notion: '#000000',
    figma: '#f24e1e',
    slack: '#4a154b',
    inter: '#ff7a00',
    amazon: '#ff9900',
    magalu: '#0086ff',
    shopee: '#ee4d2d',
    aliexpress: '#ff4747',
    apple: '#000000',
    google: '#4285f4',
    youtube: '#ff0000',
    facebook: '#1877f2',
    instagram: '#e4405f',
    twitter: '#1da1f2',
    linkedin: '#0077b5',
    whatsapp: '#25d366',
    telegram: '#0088cc',
    picpay: '#21c25e',
    ifood: '#ea1d2c',
    rappi: '#ff441f',
    uber: '#000000',
    steam: '#171a21',
    epic: '#313131',
    xbox: '#107c10',
    playstation: '#003791',
    disney: '#006e99',
    hbo: '#000000',
    paramount: '#0064ff',
    globo: '#ff0000',
    'globo play': '#ff0000',
    star: '#000000',
    prime: '#00a8e1',
    itau: '#ec7000',
    bradesco: '#cc092f',
    santander: '#ec0000',
    caixa: '#005ca9',
    banco: '#000000',
    safra: '#14254b',
    xp: '#000000',
    rico: '#ff4500',
    clear: '#1b262c',
    btg: '#002e5d',
  };

  if (brandColors[normalized]) return brandColors[normalized];
  
  const hash = Array.from(name).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    '#6366f1', // Indigo
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#ec4899', // Pink
    '#8b5cf6', // Violet
    '#ef4444', // Red
    '#06b6d4', // Cyan
  ];
  return colors[hash % colors.length];
}

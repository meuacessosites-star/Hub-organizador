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

  // Fallback guess: name + .com or .com.br
  return `${normalized.replace(/\s+/g, '')}.com`;
}

/**
 * Gets a clean, high-quality logo URL or falls back to clearbit / devicons
 */
export function getLogoUrl(name: string, url?: string): string {
  const domain = getDomainFromInput(name, url);
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

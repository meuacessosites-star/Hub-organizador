/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Guesses or resolves a domain based on platform name or user-input URL.
 */
export function getDomainFromInput(name: string, url?: string): string {
  const normalized = name.trim().toLowerCase();

  // Custom manual mappings for popular platforms
  const mappings: { [key: string]: string } = {
    github: 'github.com',
    nubank: 'nubank.com.br',
    netflix: 'netflix.com',
    'mercado livre': 'mercadolivre.com.br',
    mercadolivre: 'mercadolivre.com.br',
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
    shopee: 'shopee.com.br',
    aliexpress: 'aliexpress.com',
    shein: 'shein.com',
    americanas: 'americanas.com.br',
    magalu: 'magazineluiza.com.br',
    'magazine luiza': 'magazineluiza.com.br',
    'casas bahia': 'casasbahia.com.br',
    facebook: 'facebook.com',
    instagram: 'instagram.com',
    youtube: 'youtube.com',
    twitter: 'twitter.com',
    x: 'twitter.com',
    linkedin: 'linkedin.com',
    whatsapp: 'whatsapp.com',
    telegram: 'telegram.org',
    tiktok: 'tiktok.com',
    ifood: 'ifood.com.br',
    uber: 'uber.com',
  };

  // 1. Check custom manual mappings first (by substring or exact match)
  const sortedMappingKeys = Object.keys(mappings).sort((a, b) => b.length - a.length);
  for (const key of sortedMappingKeys) {
    if (normalized.includes(key)) {
      return mappings[key];
    }
  }

  // 2. Extract domain from URL if available, cleaning common subdomains
  if (url) {
    try {
      const cleanUrl = url.trim().toLowerCase();
      const withHttp = cleanUrl.startsWith('http') ? cleanUrl : `https://${cleanUrl}`;
      const parsed = new URL(withHttp);
      let host = parsed.hostname.replace('www.', '');

      const ignoredSubdomains = [
        'pt', 'br', 'es', 'en', 'm', 'login', 'app', 'play', 'mail', 
        'admin', 'portal', 'account', 'accounts', 'security', 'my', 'web', 'mobile'
      ];

      const parts = host.split('.');
      if (parts.length > 2) {
        if (ignoredSubdomains.includes(parts[0])) {
          host = parts.slice(1).join('.');
        }
      }

      if (host && host.includes('.')) {
        return host;
      }
    } catch {
      // Fallback
    }
  }

  // 3. Attempt to build a generic domain if the user typed something like "example.com"
  if (normalized.includes('.')) {
    return normalized;
  }

  // Fallback guess: only guess if name is at least 3 characters AND we have a URL hint
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
 * Generates a crisp, high-resolution SVG placeholder data URI for a brand
 */
export function getGeneratedPlaceholderLogo(name: string, url?: string): string {
  const cleanName = name || getPlatformNameFromUrl(url || '') || 'Site';
  const initials = getInitials(cleanName);
  const brandColor = getPlatformColor(cleanName);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
  <rect width="256" height="256" rx="56" fill="#f8fafc"/>
  <rect width="250" height="250" x="3" y="3" rx="53" fill="none" stroke="#e2e8f0" stroke-width="4"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" fill="${brandColor}" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, sans-serif" font-weight="800" font-size="${initials.length > 2 ? '80' : '105'}">${initials}</text>
</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Gets a clean, high-quality logo URL or falls back to clearbit / simpleicons / unavatar / generated placeholder
 */
export function getLogoUrl(name: string, url?: string, attempt: number = 0): string {
  const domain = getDomainFromInput(name, url);
  if (!domain) {
    return getGeneratedPlaceholderLogo(name, url);
  }

  const normalized = name.toLowerCase().trim();

  // Simple Icons mapping for popular brands to guarantee crisp HD vector SVG logos
  const simpleIconsSlugs: { [key: string]: string } = {
    github: 'github',
    netflix: 'netflix',
    spotify: 'spotify',
    'disney+': 'disneyplus',
    disney: 'disneyplus',
    'prime video': 'primevideo',
    prime: 'primevideo',
    youtube: 'youtube',
    nubank: 'nubank',
    'mercado livre': 'mercadolibre',
    mercadolivre: 'mercadolibre',
    'mercado pago': 'mercadopago',
    mercadopago: 'mercadopago',
    amazon: 'amazon',
    shopee: 'shopee',
    shein: 'shein',
    facebook: 'facebook',
    instagram: 'instagram',
    twitter: 'twitter',
    x: 'x',
    linkedin: 'linkedin',
    whatsapp: 'whatsapp',
    telegram: 'telegram',
    tiktok: 'tiktok',
    uber: 'uber',
    trello: 'trello',
    slack: 'slack',
    linear: 'linear',
    notion: 'notion',
    figma: 'figma',
    canva: 'canva',
    google: 'google',
    steam: 'steam',
    playstation: 'playstation',
    xbox: 'xbox',
    ifood: 'ifood',
    rappi: 'rappi',
    magalu: 'magazineluiza',
    apple: 'apple',
    inter: 'inter',
    epic: 'epicgames',
  };

  // High-precision vector SVG for AliExpress (sacolinha) icon
  const aliExpressSacolinhaSvg = `data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <clipPath id="aliClip">
      <rect width="512" height="512" rx="100" />
    </clipPath>
  </defs>
  <g clip-path="url(#aliClip)">
    <rect width="512" height="512" fill="#FF9A00" />
    <path d="M 0,60 Q 256,125 512,60 L 512,512 L 0,512 Z" fill="#E62E04" />
    <circle cx="140" cy="150" r="18" fill="#B31A00" />
    <circle cx="372" cy="150" r="18" fill="#B31A00" />
    <path d="M 140,150 C 140,300 372,300 372,150" fill="none" stroke="#FFFFFF" stroke-width="26" stroke-linecap="round" />
    <g fill="#FFFFFF" font-family="-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Arial, sans-serif" font-weight="800">
      <text x="256" y="385" font-size="76" text-anchor="middle" letter-spacing="-2">AliExpress</text>
    </g>
    <path d="M 183,308 Q 183,318 193,318 Q 183,318 183,328 Q 183,318 173,318 Q 183,318 183,308 Z" fill="#FFFFFF" />
  </g>
</svg>`)}`;

  // High quality iconic vector SVG/tile overrides for specific popular brands (e.g. AliExpress sacolinha / app tile)
  const customBrandLogos: { [key: string]: string } = {
    aliexpress: aliExpressSacolinhaSvg,
    'mercado livre': 'https://www.vectorlogo.zone/logos/mercadolibre/mercadolibre-icon.svg',
    mercadolivre: 'https://www.vectorlogo.zone/logos/mercadolibre/mercadolibre-icon.svg',
    'mercado pago': 'https://www.vectorlogo.zone/logos/mercadopago/mercadopago-icon.svg',
    mercadopago: 'https://www.vectorlogo.zone/logos/mercadopago/mercadopago-icon.svg',
  };

  // Check if we can use custom brand tile or Simple Icons vector SVG on the first attempt
  if (attempt === 0) {
    for (const key of Object.keys(customBrandLogos)) {
      if (normalized.includes(key) || domain.includes(key)) {
        return customBrandLogos[key];
      }
    }

    for (const key of Object.keys(simpleIconsSlugs)) {
      if (normalized.includes(key) || domain.includes(key)) {
        return `https://cdn.simpleicons.org/${simpleIconsSlugs[key]}`;
      }
    }
    // High-res Clearbit logo for domain
    return `https://logo.clearbit.com/${domain}`;
  }

  if (attempt === 1) {
    // 2. Unavatar (queries Twitter HD avatars, GitHub, Gravatar, Clearbit, touch icons)
    return `https://unavatar.io/${domain}?fallback=false`;
  }
  if (attempt === 2) {
    // 3. Google s2 favicons API sz=256
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=256`;
  }
  if (attempt === 3) {
    // 4. DuckDuckGo Favicon API
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  }
  if (attempt === 4) {
    // 5. Google Favicon V2 fallback
    return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=404&url=https://${domain}&size=256`;
  }

  // 6. Professional generated SVG placeholder
  return getGeneratedPlaceholderLogo(name, url);
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

import { getGeneratedPlaceholderLogo } from './logoHelper';

export const formatImageUrl = (url?: string | null): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('/api/proxy-image?url=')) {
    return trimmed;
  }

  if (trimmed.startsWith('https://corsproxy.io/?')) {
    const extracted = decodeURIComponent(trimmed.replace('https://corsproxy.io/?', ''));
    if (
      extracted &&
      (extracted.includes('amazon') ||
        extracted.includes('media-amazon') ||
        extracted.includes('ssl-images-amazon') ||
        extracted.includes('unsplash'))
    ) {
      return extracted;
    }
    return trimmed;
  }

  let rawUrl = trimmed;
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    if (rawUrl.startsWith('//')) {
      rawUrl = `https:${rawUrl}`;
    } else {
      const cleanHash = rawUrl.replace(/^\/?(file\/)?/, '');
      rawUrl = `https://down-br.img.susercontent.com/file/${cleanHash}`;
    }
  }

  // Direct URLs for Amazon, Unsplash, Google, Gravatar, and standard static images that don't need proxying
  if (
    rawUrl.includes('amazon') ||
    rawUrl.includes('media-amazon') ||
    rawUrl.includes('ssl-images-amazon') ||
    rawUrl.includes('unsplash.com') ||
    rawUrl.includes('googleusercontent') ||
    rawUrl.includes('google.com') ||
    rawUrl.includes('ggpht.com') ||
    rawUrl.includes('gravatar.com') ||
    rawUrl.includes('githubusercontent.com') ||
    rawUrl.includes('t3.gstatic.com') ||
    rawUrl.includes('logo.clearbit.com') ||
    rawUrl.includes('simpleicons.org') ||
    rawUrl.includes('unavatar.io')
  ) {
    return rawUrl;
  }

  // Proxy for Shopee and Mercado Livre CDN images
  if (
    rawUrl.includes('susercontent.com') ||
    rawUrl.includes('shopee') ||
    rawUrl.includes('mlstatic.com') ||
    rawUrl.includes('mercadolivre') ||
    rawUrl.includes('mercadolibre')
  ) {
    return `/api/proxy-image?url=${encodeURIComponent(rawUrl)}`;
  }

  return rawUrl;
};

export const getNextFallbackUrl = (currentSrc: string, originalUrl?: string): string | null => {
  if (!currentSrc) return null;

  // Extract raw URL if currentSrc is already proxied
  let raw = currentSrc;
  if (currentSrc.includes('wsrv.nl/?url=')) {
    raw = decodeURIComponent(currentSrc.split('wsrv.nl/?url=')[1] || '');
  } else if (currentSrc.includes('/api/proxy-image?url=')) {
    raw = decodeURIComponent(currentSrc.split('/api/proxy-image?url=')[1] || '');
  } else if (currentSrc.includes('corsproxy.io/?')) {
    raw = decodeURIComponent(currentSrc.split('corsproxy.io/?')[1] || '');
  }

  // 1. If vectorlogo or iconfinder fails, transition to Clearbit or Unavatar
  if (raw.includes('vectorlogo.zone') || raw.includes('iconfinder.com')) {
    try {
      if (raw.includes('aliexpress')) {
        return `https://unavatar.io/aliexpress.com?fallback=false`;
      }
      const parts = raw.split('logos/');
      const slug = parts[1]?.split('/')[0];
      if (slug) {
        return `https://logo.clearbit.com/${slug}.com`;
      }
    } catch (e) {}
  }

  // 2. If Simple Icons fails, transition to Clearbit or Unavatar
  if (raw.includes('simpleicons.org')) {
    try {
      const parts = raw.split('simpleicons.org/');
      const slug = parts[1]?.split('?')[0]?.split('/')[0];
      if (slug) {
        return `https://unavatar.io/${slug}.com?fallback=false`;
      }
    } catch (e) {}
  }

  // 2. If Google s2 favicons API fails, transition to Unavatar
  if (raw.includes('s2/favicons')) {
    try {
      const urlObj = new URL(raw);
      const domain = urlObj.searchParams.get('domain');
      if (domain) {
        return `https://unavatar.io/${domain}?fallback=false`;
      }
    } catch (e) {}
  }

  // 2. If Unavatar fails, transition to Clearbit
  if (raw.includes('unavatar.io')) {
    try {
      const parts = raw.split('unavatar.io/');
      const domain = parts[1]?.split('?')[0];
      if (domain) {
        return `https://logo.clearbit.com/${domain}`;
      }
    } catch (e) {}
  }

  // 3. If Clearbit logo fails, transition to DuckDuckGo Favicon API
  if (raw.includes('logo.clearbit.com')) {
    try {
      const parts = raw.split('logo.clearbit.com/');
      const domain = parts[1]?.split('?')[0];
      if (domain && domain.includes('.')) {
        return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      }
    } catch (e) {}
  }

  // 4. If DuckDuckGo fails, transition to Google Favicon V2
  if (raw.includes('duckduckgo.com')) {
    try {
      const parts = raw.split('ip3/');
      const domain = parts[1]?.replace('.ico', '')?.split('?')[0];
      if (domain) {
        return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=404&url=https://${domain}&size=128`;
      }
    } catch (e) {}
  }

  // 5. If Google Favicon V2 fails, transition to generated SVG placeholder
  if (raw.includes('faviconV2')) {
    try {
      const domain = (new URL(raw).searchParams.get('url') || '').replace(/^https?:\/\//, '').split('/')[0];
      return getGeneratedPlaceholderLogo(domain);
    } catch (e) {
      return getGeneratedPlaceholderLogo(originalUrl || '');
    }
  }

  // 1. Try wsrv.nl CDN proxy first (works globally and on static hosts like Vercel)
  if (!currentSrc.includes('wsrv.nl/?url=')) {
    if (raw && raw.startsWith('http')) {
      return `https://wsrv.nl/?url=${encodeURIComponent(raw)}`;
    }
  }

  // 2. Try server-side Express proxy (/api/proxy-image)
  if (!currentSrc.includes('/api/proxy-image?url=')) {
    if (raw && raw.startsWith('http')) {
      return `/api/proxy-image?url=${encodeURIComponent(raw)}`;
    }
  }

  // 3. Try corsproxy.io
  if (!currentSrc.includes('corsproxy.io/?')) {
    if (raw && raw.startsWith('http')) {
      return `https://corsproxy.io/?${encodeURIComponent(raw)}`;
    }
  }

  if (originalUrl && originalUrl !== currentSrc && originalUrl.startsWith('http') && !originalUrl.includes('wsrv.nl')) {
    return originalUrl;
  }

  // Final fallback for logo requests: crisp generated SVG placeholder
  if (
    raw.includes('s2/favicons') ||
    raw.includes('unavatar.io') ||
    raw.includes('logo.clearbit.com') ||
    raw.includes('simpleicons.org') ||
    raw.includes('faviconV2')
  ) {
    return getGeneratedPlaceholderLogo(originalUrl || raw);
  }

  return null;
};

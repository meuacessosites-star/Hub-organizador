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
    rawUrl.includes('githubusercontent.com')
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

  // If Clearbit logo fails, immediately transition to Google Favicon as the next main fallback
  if (raw.includes('logo.clearbit.com')) {
    try {
      const parts = raw.split('logo.clearbit.com/');
      const domain = parts[1]?.split('?')[0];
      if (domain && domain.includes('.')) {
        return `https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=256`;
      }
    } catch (e) {
      // ignore
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

  return null;
};

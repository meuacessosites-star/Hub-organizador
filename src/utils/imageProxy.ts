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

  // If Google/Gravatar avatar fails directly, try proxying via /api/proxy-image once before giving up
  if (
    currentSrc.includes('googleusercontent') ||
    currentSrc.includes('ggpht.com') ||
    currentSrc.includes('gravatar.com')
  ) {
    if (!currentSrc.includes('/api/proxy-image?url=')) {
      return `/api/proxy-image?url=${encodeURIComponent(currentSrc)}`;
    }
    return null;
  }

  if (currentSrc.includes('/api/proxy-image?url=')) {
    const raw = decodeURIComponent(currentSrc.split('/api/proxy-image?url=')[1] || '');
    if (raw) {
      return `https://corsproxy.io/?${encodeURIComponent(raw)}`;
    }
  } else if (currentSrc.includes('corsproxy.io/?')) {
    const raw = decodeURIComponent(currentSrc.split('corsproxy.io/?')[1] || '');
    if (raw) {
      return `https://wsrv.nl/?url=${encodeURIComponent(raw)}`;
    }
  } else if (currentSrc.includes('wsrv.nl/?url=')) {
    const raw = decodeURIComponent(currentSrc.split('wsrv.nl/?url=')[1] || '');
    if (raw) {
      return raw;
    }
  } else if (currentSrc.startsWith('http') && !currentSrc.startsWith('data:') && !currentSrc.startsWith('blob:')) {
    return `/api/proxy-image?url=${encodeURIComponent(currentSrc)}`;
  }

  if (originalUrl && originalUrl !== currentSrc && originalUrl.startsWith('http')) {
    return originalUrl;
  }

  return null;
};

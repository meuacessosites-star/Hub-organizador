import * as cheerio from 'cheerio';

function getRefererForUrl(urlStr: string): string {
  const lower = (urlStr || '').toLowerCase();
  if (lower.includes('mlstatic.com') || lower.includes('mercadolivre') || lower.includes('mercadolibre')) {
    return 'https://www.mercadolivre.com.br/';
  }
  if (lower.includes('amazon') || lower.includes('amzn') || lower.includes('a.co')) {
    return 'https://www.amazon.com.br/';
  }
  if (lower.includes('shopee') || lower.includes('susercontent.com')) {
    return 'https://shopee.com.br/';
  }
  if (lower.includes('aliexpress')) {
    return 'https://pt.aliexpress.com/';
  }
  if (lower.includes('shein')) {
    return 'https://br.shein.com/';
  }
  try {
    const parsed = new URL(urlStr);
    return `${parsed.protocol}//${parsed.hostname}/`;
  } catch (e) {
    return 'https://www.google.com/';
  }
}

async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
  if (!imageUrl || typeof imageUrl !== 'string') return null;
  if (imageUrl.startsWith('data:')) return imageUrl;

  let targetUrl = imageUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    const cleanHash = targetUrl.replace(/^\/?(file\/)?/, '');
    targetUrl = `https://down-br.img.susercontent.com/file/${cleanHash}`;
  }
  if (targetUrl.startsWith('http://')) {
    targetUrl = targetUrl.replace(/^http:\/\//i, 'https://');
  }

  const referer = getRefererForUrl(targetUrl);
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Referer': referer,
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
  };

  const urlsToTry: string[] = [targetUrl];
  if (targetUrl.includes('mlstatic.com')) {
    if (/-[IVDEC]\.(jpg|png|webp|gif)$/i.test(targetUrl)) {
      urlsToTry.push(targetUrl.replace(/-[IVDEC]\.(jpg|png|webp|gif)$/i, '-O.jpg'));
      urlsToTry.push(targetUrl.replace(/-[IVDEC]\.(jpg|png|webp|gif)$/i, '-F.jpg'));
    } else if (/-O\.(jpg|png|webp|gif)$/i.test(targetUrl)) {
      urlsToTry.push(targetUrl.replace(/-O\.(jpg|png|webp|gif)$/i, '-F.jpg'));
    }
    if (targetUrl.includes('/D_NQ_NP_2X_')) {
      urlsToTry.push(targetUrl.replace('/D_NQ_NP_2X_', '/D_NQ_NP_'));
    } else if (targetUrl.includes('/D_NQ_NP_')) {
      urlsToTry.push(targetUrl.replace('/D_NQ_NP_', '/D_NQ_NP_2X_'));
    }
  }
  const match = targetUrl.match(/\/file\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    const hash = match[1];
    urlsToTry.push(`https://down-br.img.susercontent.com/file/${hash}`);
    urlsToTry.push(`https://cf.shopee.com.br/file/${hash}`);
    urlsToTry.push(`https://down-ws.img.susercontent.com/file/${hash}`);
  }

  for (const currentUrl of urlsToTry) {
    try {
      const resp = await fetch(currentUrl, { headers, signal: AbortSignal.timeout(6000) });
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {}

    try {
      const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(currentUrl)}`;
      const resp = await fetch(corsProxyUrl, { signal: AbortSignal.timeout(6000) });
      if (resp.ok) {
        const contentType = resp.headers.get('content-type') || 'image/jpeg';
        const arrayBuffer = await resp.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return `data:${contentType};base64,${buffer.toString('base64')}`;
      }
    } catch (e) {}
  }

  return null;
}

function extractAmazonImages($: cheerio.CheerioAPI): string[] {
  const images: string[] = [];

  const addImage = (src: string | undefined) => {
    if (!src || typeof src !== "string") return;
    const clean = src.trim();
    if (!clean || clean.startsWith("data:") || clean.includes("sprite") || clean.includes("pixel") || clean.includes("indicator") || clean.includes("loading") || clean.includes("logo") || clean.includes("spacer.gif")) return;
    
    const highRes = clean.replace(/\._[A-Z0-9,_-]+\.(jpg|jpeg|png|gif|webp)$/i, '.$1');
    if (!images.includes(highRes)) {
      images.push(highRes);
    }
  };

  const landingImage = $('#landingImage');
  if (landingImage.length) {
    const oldHires = landingImage.attr('data-old-hires');
    if (oldHires) addImage(oldHires);

    const dynImage = landingImage.attr('data-a-dynamic-image');
    if (dynImage) {
      try {
        const parsed = JSON.parse(dynImage);
        Object.keys(parsed).forEach(k => addImage(k));
      } catch (e) {}
    }
    addImage(landingImage.attr('src'));
  }

  const imgBlkFront = $('#imgBlkFront');
  if (imgBlkFront.length) {
    const dynImage = imgBlkFront.attr('data-a-dynamic-image');
    if (dynImage) {
      try {
        const parsed = JSON.parse(dynImage);
        Object.keys(parsed).forEach(k => addImage(k));
      } catch (e) {}
    }
    addImage(imgBlkFront.attr('src'));
  }

  const ebooksImgBlkFront = $('#ebooksImgBlkFront');
  if (ebooksImgBlkFront.length) {
    const dynImage = ebooksImgBlkFront.attr('data-a-dynamic-image');
    if (dynImage) {
      try {
        const parsed = JSON.parse(dynImage);
        Object.keys(parsed).forEach(k => addImage(k));
      } catch (e) {}
    }
    addImage(ebooksImgBlkFront.attr('src'));
  }

  $('#altImages img, #imageBlock img, .image-thumbnail img').each((_, el) => {
    addImage($(el).attr('src'));
    addImage($(el).attr('data-src'));
    addImage($(el).attr('data-old-hires'));
  });

  $('#main-image-container img').each((_, el) => {
    addImage($(el).attr('src'));
  });

  return images.filter(Boolean);
}

function extractAmazonAsin(urlStr: string): string | null {
  try {
    const pathname = new URL(urlStr).pathname;
    const dpMatch = pathname.match(/\/(?:dp|gp\/product|ASIN)\/([A-Z0-9]{10})/i) || pathname.match(/\/([A-Z0-9]{10})(?:[\/?#]|$)/i);
    if (dpMatch && dpMatch[1]) {
      return dpMatch[1].toUpperCase();
    }
  } catch (e) {}
  return null;
}

function extractShopeeIds(urlStr: string): { shopId: number | null; itemId: number | null } {
  try {
    const url = new URL(urlStr);
    const sId = url.searchParams.get("shopId") || url.searchParams.get("shop_id");
    const iId = url.searchParams.get("itemId") || url.searchParams.get("item_id");
    if (sId && iId) {
      return { shopId: parseInt(sId, 10), itemId: parseInt(iId, 10) };
    }

    const matchi = urlStr.match(/-i\.(\d+)\.(\d+)/);
    if (matchi) {
      return { shopId: parseInt(matchi[1], 10), itemId: parseInt(matchi[2], 10) };
    }

    const pathOnly = url.pathname;
    const matchParts = pathOnly.match(/(\d+)[./](\d+)$/);
    if (matchParts) {
      return { shopId: parseInt(matchParts[1], 10), itemId: parseInt(matchParts[2], 10) };
    }
  } catch (e) {}
  return { shopId: null, itemId: null };
}

function extractMercadoLivreId(urlStr: string): string | null {
  try {
    const match = urlStr.match(/(MLB|MLA|MLM|MCO|MLU|MLC|MPE|MVE)[-]?(\d{7,14})/i);
    if (match && match[1] && match[2]) {
      return `${match[1].toUpperCase()}${match[2]}`;
    }
  } catch (e) {}
  return null;
}

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL é obrigatória' });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    // Follow redirects for short links (e.g. shope.ee, s.shopee.com.br, amzn.to, a.co)
    try {
      const headResp = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(6000)
      });
      if (headResp.url) {
        targetUrl = headResp.url;
      }
    } catch (e) {}

    const isAmazon = targetUrl.includes('amazon') || targetUrl.includes('amzn') || targetUrl.includes('a.co');
    const isShopee = targetUrl.includes('shopee') || targetUrl.includes('shope.ee') || targetUrl.includes('susercontent.com');
    const isMercadoLivre = targetUrl.includes('mercadolivre') || targetUrl.includes('mercadolibre') || targetUrl.includes('mlstatic') || targetUrl.includes('mlb.link');

    // Handle Mercado Livre API extraction
    if (isMercadoLivre) {
      const mlbId = extractMercadoLivreId(targetUrl);
      if (mlbId) {
        const endpointsToTry = [
          `https://api.mercadolibre.com/items/${mlbId}`,
          `https://api.mercadolibre.com/products/${mlbId}`
        ];

        for (const mlApiUrl of endpointsToTry) {
          try {
            const mlResp = await fetch(mlApiUrl, {
              headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept': 'application/json' 
              },
              signal: AbortSignal.timeout(6000)
            });
            if (mlResp.ok) {
              const mlJson = await mlResp.json();
              if (mlJson && (mlJson.title || mlJson.name || mlJson.id)) {
                const title = (mlJson.title || mlJson.name || '').trim() || null;
                let rawImages: string[] = [];

                if (mlJson.pictures && Array.isArray(mlJson.pictures)) {
                  mlJson.pictures.forEach((pic: any) => {
                    let raw = pic.secure_url || pic.url;
                    if (raw) {
                      if (raw.startsWith('http://')) raw = raw.replace(/^http:\/\//i, 'https://');
                      const clean = raw.replace(/-[IVDEC]\.(jpg|png|webp|gif)/i, '-O.jpg');
                      if (!rawImages.includes(clean)) rawImages.push(clean);
                    }
                  });
                }

                if (rawImages.length === 0 && (mlJson.secure_thumbnail || mlJson.thumbnail)) {
                  let raw = mlJson.secure_thumbnail || mlJson.thumbnail;
                  if (raw) {
                    if (raw.startsWith('http://')) raw = raw.replace(/^http:\/\//i, 'https://');
                    const clean = raw.replace(/-[IVDEC]\.(jpg|png|webp|gif)/i, '-O.jpg');
                    rawImages.push(clean);
                  }
                }

                const base64Images = await Promise.all(
                  rawImages.map(async (img) => (await downloadImageAsBase64(img)) || img)
                );

                return res.status(200).json({
                  titulo: title,
                  imagem: base64Images.length > 0 ? base64Images[0] : null,
                  imagens: base64Images,
                  isMercadoLivre: true,
                  resolvedUrl: targetUrl
                });
              }
            }
          } catch (mlErr) {}
        }
      }
    }

    // Handle Shopee API extraction
    if (isShopee) {
      const { shopId, itemId } = extractShopeeIds(targetUrl);
      if (shopId && itemId) {
        try {
          const publicApiUrl = `https://shopee.com.br/api/v4/item/get?shop_id=${shopId}&item_id=${itemId}`;
          const pubResp = await fetch(publicApiUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              'Referer': targetUrl,
              'Accept': 'application/json'
            },
            signal: AbortSignal.timeout(6000)
          });

          if (pubResp.ok) {
            const pubJson = await pubResp.json();
            const item = pubJson?.data || pubJson?.item;
            if (item && (item.name || item.title)) {
              const title = item.name || item.title;
              let rawImages: string[] = [];
              const imgs = item.images || (item.image ? [item.image] : []) || item.image_id_list || [];
              if (Array.isArray(imgs)) {
                rawImages = imgs.map((imgHash: string) => {
                  if (imgHash.startsWith('http')) return imgHash;
                  return `https://down-br.img.susercontent.com/file/${imgHash}`;
                });
              }

              // Convert all Shopee images to Base64
              const base64Images = await Promise.all(
                rawImages.map(async (img) => (await downloadImageAsBase64(img)) || img)
              );

              return res.status(200).json({
                titulo: title,
                imagem: base64Images.length > 0 ? base64Images[0] : null,
                imagens: base64Images,
                isShopee: true,
                resolvedUrl: targetUrl
              });
            }
          }
        } catch (shopeeErr) {}
      }
    }

    // Handle Amazon ASIN image
    const asin = isAmazon ? extractAmazonAsin(targetUrl) : null;
    const asinImageUrl = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : null;

    let html = '';
    try {
      const resp = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Referer': isShopee ? 'https://shopee.com.br/' : targetUrl
        },
        signal: AbortSignal.timeout(7000)
      });
      if (resp.ok) {
        html = await resp.text();
      }
    } catch (e) {}

    let scrapedTitle: string | null = null;
    let scrapedImages: string[] = [];

    if (html) {
      const $ = cheerio.load(html);
      if (isAmazon) {
        const titleEl = $('#productTitle');
        if (titleEl.length) {
          scrapedTitle = titleEl.text().trim();
        }
        scrapedImages = extractAmazonImages($);
      } else {
        const titleEl = $('.ui-pdp-title, h1.ui-pdp-title');
        if (titleEl.length) {
          scrapedTitle = titleEl.text().trim();
        } else {
          scrapedTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        }

        const ogImg = $('meta[property="og:image"]').attr('content');
        if (ogImg) scrapedImages.push(ogImg.replace(/-[IVDEC]\.(jpg|png|webp|gif)/i, '-O.jpg'));

        $('.ui-pdp-gallery__figure img, .ui-pdp-gallery img, img.ui-pdp-image, .ui-pdp-image, .product-gallery img, .gallery img, img[itemprop="image"]').each((_, el) => {
          let src = $(el).attr('data-zoom') || $(el).attr('src') || $(el).attr('data-src');
          if (src) {
            if (src.startsWith('//')) src = `https:${src}`;
            src = src.replace(/-[IVDEC]\.(jpg|png|webp|gif)/i, '-O.jpg');
            if (!scrapedImages.includes(src)) scrapedImages.push(src);
          }
        });

        // Search for mlstatic image URLs in HTML script blocks
        const mlStaticMatches = html.match(/https?:\/\/http2\.mlstatic\.com\/D_NQ_NP_[A-Za-z0-9_-]+\.(jpg|jpeg|webp|png)/gi);
        if (mlStaticMatches) {
          mlStaticMatches.forEach(url => {
            const highRes = url.replace(/-[IVDEC]\.(jpg|png|webp|gif)/i, '-O.jpg');
            if (!scrapedImages.includes(highRes)) scrapedImages.push(highRes);
          });
        }

        $('img').each((_, el) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          if (src && (src.includes('susercontent.com') || src.includes('shopee') || src.includes('mlstatic.com'))) {
            let clean = src.replace(/-[IVDEC]\.(jpg|png|webp|gif)/i, '-O.jpg');
            if (clean.startsWith('//')) clean = `https:${clean}`;
            if (!scrapedImages.includes(clean)) scrapedImages.push(clean);
          }
        });
      }
    }

    if (scrapedTitle) {
      scrapedTitle = scrapedTitle
        .replace(/Amazon.com.br|Amazon.com|: Amazon.*/gi, '')
        .replace(/Shopee Brasil|Shopee.*/gi, '')
        .replace(/\|\s*Mercado\s*Livre.*/gi, '')
        .replace(/-\s*Mercado\s*Livre.*/gi, '')
        .replace(/[\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (asinImageUrl && !scrapedImages.includes(asinImageUrl)) {
      scrapedImages.unshift(asinImageUrl);
    }

    // Convert scraped images to Base64
    const base64ScrapedImages = await Promise.all(
      scrapedImages.map(async (img) => (await downloadImageAsBase64(img)) || img)
    );

    if (scrapedTitle || base64ScrapedImages.length > 0 || asin) {
      return res.status(200).json({
        titulo: scrapedTitle || null,
        imagem: base64ScrapedImages.length > 0 ? base64ScrapedImages[0] : asinImageUrl,
        imagens: base64ScrapedImages,
        resolvedUrl: targetUrl,
        asin: asin
      });
    }

    return res.status(200).json({
      error: 'Não foi possível extrair dados automaticamente',
      resolvedUrl: targetUrl
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro no servidor' });
  }
}

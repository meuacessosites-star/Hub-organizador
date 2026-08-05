import * as cheerio from 'cheerio';

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

    // Follow redirects for short links (e.g. amzn.to, a.co)
    try {
      const headResp = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(5000)
      });
      if (headResp.url) {
        targetUrl = headResp.url;
      }
    } catch (e) {}

    const isAmazon = targetUrl.includes('amazon') || targetUrl.includes('amzn') || targetUrl.includes('a.co');
    const asin = isAmazon ? extractAmazonAsin(targetUrl) : null;
    const asinImageUrl = asin ? `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg` : null;

    let html = '';
    try {
      const resp = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
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
        scrapedTitle = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
        const ogImg = $('meta[property="og:image"]').attr('content');
        if (ogImg) scrapedImages.push(ogImg);
      }
    }

    if (scrapedTitle) {
      scrapedTitle = scrapedTitle
        .replace(/Amazon.com.br|Amazon.com|: Amazon.*/gi, '')
        .replace(/[\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    if (asinImageUrl && !scrapedImages.includes(asinImageUrl)) {
      scrapedImages.unshift(asinImageUrl);
    }

    if (scrapedTitle || scrapedImages.length > 0 || asin) {
      return res.status(200).json({
        titulo: scrapedTitle || null,
        imagem: scrapedImages.length > 0 ? scrapedImages[0] : asinImageUrl,
        imagens: scrapedImages,
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

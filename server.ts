import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import { GoogleGenAI, Type } from "@google/genai";
import * as cheerio from "cheerio";
import crypto from "crypto";

function extractAmazonImages($: cheerio.CheerioAPI): string[] {
  const images: string[] = [];

  const addImage = (src: string | undefined) => {
    if (!src || typeof src !== "string") return;
    const clean = src.trim();
    if (!clean || clean.startsWith("data:") || clean.includes("sprite") || clean.includes("pixel") || clean.includes("indicator") || clean.includes("loading") || clean.includes("logo") || clean.includes("spacer.gif")) return;
    
    // Clean to high res
    const highRes = clean.replace(/\._[A-Z0-9,_-]+\.(jpg|jpeg|png|gif|webp)$/i, '.$1');
    if (!images.includes(highRes)) {
      images.push(highRes);
    }
  };

  // 1. #landingImage (main image)
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

  // 2. Books often use #imgBlkFront
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

  // 3. Kindle/ebooks often use #ebooksImgBlkFront
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

  // 4. altImages thumbnails
  $('#altImages img, #imageBlock img, .image-thumbnail img').each((_, el) => {
    addImage($(el).attr('src'));
    addImage($(el).attr('data-src'));
    addImage($(el).attr('data-old-hires'));
  });

  // 5. #main-image-container img
  $('#main-image-container img').each((_, el) => {
    addImage($(el).attr('src'));
  });

  return images.filter(Boolean);
}

function extractAmazonImage($: cheerio.CheerioAPI): string | null {
  const imgs = extractAmazonImages($);
  return imgs.length > 0 ? imgs[0] : null;
}

function extractAmazonTitle($: cheerio.CheerioAPI): string | null {
  const titleEl = $('#productTitle');
  if (titleEl.length) {
    return titleEl.text().trim();
  }
  return null;
}

function extractGeneralImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
  const images: string[] = [];
  
  const addImage = (src: string | undefined) => {
    if (!src || typeof src !== "string") return;
    let clean = src.trim();
    if (!clean || clean.startsWith("data:") || clean.includes("logo") || clean.includes("icon") || clean.includes("avatar") || clean.includes("loading") || clean.includes("spacer.gif") || clean.includes("pixel")) return;
    
    // Normalize relative paths
    if (clean.startsWith('//')) {
      clean = `https:${clean}`;
    } else if (clean.startsWith('/')) {
      try {
        const urlObj = new URL(baseUrl);
        clean = `${urlObj.protocol}//${urlObj.host}${clean}`;
      } catch (e) {}
    }

    if (!images.includes(clean)) {
      images.push(clean);
    }
  };

  // Add meta og:images
  $('meta[property="og:image"]').each((_, el) => {
    addImage($(el).attr('content'));
  });

  $('meta[name="twitter:image"]').each((_, el) => {
    addImage($(el).attr('content'));
  });

  // Common product gallery selectors
  const selectors = [
    '.product-gallery img',
    '.product-images img',
    '.gallery img',
    '.swiper-slide img',
    '.carousel img',
    '#product-images img',
    'img[itemprop="image"]',
    '.product-single__photo img',
    '.product-media img',
    '.product-carousel img'
  ];

  selectors.forEach(sel => {
    $(sel).each((_, el) => {
      addImage($(el).attr('src'));
      addImage($(el).attr('data-src'));
      addImage($(el).attr('data-lazy-src'));
      addImage($(el).attr('data-zoom'));
      addImage($(el).attr('data-zoom-image'));
    });
  });

  // If we don't have enough images, grab any img with reasonable size attributes
  if (images.length < 3) {
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-lazy-src');
      if (src) {
        const width = parseInt($(el).attr('width') || "0", 10);
        const height = parseInt($(el).attr('height') || "0", 10);
        if ((width && width < 120) || (height && height < 120)) {
          return;
        }
        addImage(src);
      }
    });
  }

  return images.filter(Boolean);
}

function extractGeneralMetadata($: cheerio.CheerioAPI): { titulo: string | null; imagem: string | null } {
  let ldTitle: string | null = null;
  let ldImage: string | null = null;

  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      
      const processObj = (obj: any) => {
        if (!obj) return;
        if (obj['@type'] === 'Product' || obj['@type'] === 'http://schema.org/Product' || obj['@type'] === 'https://schema.org/Product') {
          if (obj.name) ldTitle = obj.name;
          if (obj.image) {
            if (typeof obj.image === 'string') {
              ldImage = obj.image;
            } else if (Array.isArray(obj.image) && obj.image.length > 0) {
              ldImage = obj.image[0];
            } else if (obj.image.url) {
              ldImage = obj.image.url;
            }
          }
        } else if (obj['@graph'] && Array.isArray(obj['@graph'])) {
          obj['@graph'].forEach(processObj);
        }
      };

      if (Array.isArray(data)) {
        data.forEach(processObj);
      } else {
        processObj(data);
      }
    } catch (e) {}
  });

  const titulo = 
    ldTitle ||
    $('meta[property="og:title"]').attr('content') ||
    $('meta[name="twitter:title"]').attr('content') ||
    $('h1').first().text().trim() ||
    $('title').text().trim();

  const imagem = 
    ldImage ||
    $('meta[property="og:image"]').attr('content') ||
    $('meta[name="twitter:image"]').attr('content') ||
    $('link[rel="image_src"]').attr('href') ||
    $('img[itemprop="image"]').attr('src');

  return { titulo: titulo || null, imagem: imagem || null };
}

function parseTitleFromUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr);
    let slug = "";
    
    // Amazon specific
    if (url.host.includes("amazon")) {
      const dpIdx = url.pathname.indexOf("/dp/");
      if (dpIdx !== -1) {
        const partBeforeDp = url.pathname.substring(0, dpIdx);
        const segments = partBeforeDp.split("/").filter(Boolean);
        if (segments.length > 0) {
          slug = segments[segments.length - 1];
        }
      } else {
        const segments = url.pathname.split("/").filter(Boolean);
        const candidates = segments.filter(s => s !== "dp" && s !== "gp" && s !== "product" && s.length > 4);
        if (candidates.length > 0) {
          slug = candidates[0];
        }
      }
    }
    
    // General path parsing
    if (!slug) {
      const segments = url.pathname.split("/").filter(s => {
        const clean = s.trim();
        if (!clean) return false;
        if (["p", "produto", "product", "item", "items", "pd", "products", "c", "categoria", "category"].includes(clean.toLowerCase())) return false;
        if (/^[0-9a-f-]{20,}$/i.test(clean)) return false;
        if (/^\d+$/.test(clean)) return false;
        return true;
      });
      
      if (segments.length > 0) {
        const sorted = [...segments].sort((a, b) => b.length - a.length);
        slug = sorted[0];
      }
    }

    if (!slug) {
      const params = ["name", "title", "product", "q", "query", "p"];
      for (const p of params) {
        const val = url.searchParams.get(p);
        if (val && val.length > 3) {
          slug = val;
          break;
        }
      }
    }

    if (slug) {
      let decoded = "";
      try {
        decoded = decodeURIComponent(slug);
      } catch (e) {
        decoded = slug;
      }

      let title = decoded.replace(/[-_+]/g, ' ');
      title = title.replace(/\.(html|php|asp|aspx)$/i, '');
      title = title.replace(/\s+/g, ' ').trim();

      title = title
        .split(' ')
        .map(word => {
          if (word.length === 0) return '';
          if (word === word.toUpperCase() && word.length > 1 && !/\d/.test(word)) return word;
          return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
        })
        .join(' ')
        .trim();

      if (title.length > 3) {
        return title;
      }
    }
  } catch (e) {
    console.error("Error parsing title from URL:", e);
  }
  return null;
}

async function resolveRedirects(urlStr: string): Promise<string> {
  let currentUrl = urlStr;
  const maxRedirects = 6;
  const visited = new Set<string>();

  for (let i = 0; i < maxRedirects; i++) {
    if (visited.has(currentUrl)) break;
    visited.add(currentUrl);

    try {
      const response = await fetch(currentUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        redirect: 'follow',
        signal: AbortSignal.timeout(5000)
      });

      if (response.url && response.url !== currentUrl) {
        console.log(`[Resolve Redirects] Redirected: ${currentUrl} -> ${response.url}`);
        currentUrl = response.url;
        continue;
      }

      const text = await response.text();
      const metaMatch = text.match(/<meta[^>]+http-equiv=["']refresh["'][^>]+content=["'][^"']*url=([^'"\s>]+)["']/i) || text.match(/url=([^'"\s>]+)["'][^>]*http-equiv=["']refresh["']/i);
      if (metaMatch && metaMatch[1]) {
        const nextUrl = new URL(metaMatch[1], currentUrl).toString();
        console.log(`[Resolve Redirects] Meta refresh redirect: ${currentUrl} -> ${nextUrl}`);
        currentUrl = nextUrl;
        continue;
      }

      const jsMatch = text.match(/window\.location\.replace\(['"]([^'"]+)['"]\)/) || text.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
      if (jsMatch && jsMatch[1]) {
        const nextUrl = new URL(jsMatch[1], currentUrl).toString();
        console.log(`[Resolve Redirects] JS redirect: ${currentUrl} -> ${nextUrl}`);
        currentUrl = nextUrl;
        continue;
      }

      break;
    } catch (e) {
      console.warn(`[Resolve Redirects] Error resolving redirect for ${currentUrl}:`, e);
      break;
    }
  }

  return currentUrl;
}

async function fetchPage(url: string): Promise<{ html: string | null; resolvedUrl: string }> {
  try {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    };
    
    const response = await fetch(url, { 
      headers,
      signal: AbortSignal.timeout(8000)
    });
    
    const resolvedUrl = response.url || url;
    const html = await response.text();
    return { html, resolvedUrl };
  } catch (e) {
    console.warn(`Failed to fetch URL directly:`, e);
    return { html: null, resolvedUrl: url };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API routes
  const apiRouter = express.Router();
  app.use("/api", apiRouter);

  apiRouter.use((req, res, next) => {
    res.setHeader('Content-Type', 'application/json');
    console.log(`[API Request] ${req.method} ${req.url}`);
    next();
  });

  apiRouter.get("/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  function formatShopeeImageUrl(img: string): string {
    if (!img || typeof img !== 'string') return '';
    const trimmed = img.trim();
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      const match = trimmed.match(/\/file\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        return `https://down-br.img.susercontent.com/file/${match[1]}`;
      }
      return trimmed;
    }
    if (trimmed.startsWith('//')) {
      return `https:${trimmed}`;
    }
    const cleanHash = trimmed.replace(/^\/?(file\/)?/, '');
    if (cleanHash) {
      return `https://down-br.img.susercontent.com/file/${cleanHash}`;
    }
    return trimmed;
  }

  async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
    if (!imageUrl || typeof imageUrl !== 'string') return null;
    if (imageUrl.startsWith('data:')) return imageUrl;

    let targetUrl = imageUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = formatShopeeImageUrl(targetUrl);
    }

    const headers: Record<string, string> = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      'Referer': 'https://shopee.com.br/',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    };

    const urlsToTry: string[] = [targetUrl];
    const match = targetUrl.match(/\/file\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      const hash = match[1];
      const alt1 = `https://down-br.img.susercontent.com/file/${hash}`;
      const alt2 = `https://down-ws.img.susercontent.com/file/${hash}`;
      const alt3 = `https://cf.shopee.com.br/file/${hash}`;
      const alt4 = `https://down-tx.img.susercontent.com/file/${hash}`;
      if (!urlsToTry.includes(alt1)) urlsToTry.push(alt1);
      if (!urlsToTry.includes(alt2)) urlsToTry.push(alt2);
      if (!urlsToTry.includes(alt3)) urlsToTry.push(alt3);
      if (!urlsToTry.includes(alt4)) urlsToTry.push(alt4);
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
      } catch (e) {
        // try next
      }

      try {
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(currentUrl)}`;
        const resp = await fetch(corsProxyUrl, { signal: AbortSignal.timeout(6000) });
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await resp.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          return `data:${contentType};base64,${buffer.toString('base64')}`;
        }
      } catch (e) {
        // try next
      }
    }

    return null;
  }

  apiRouter.get("/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl || typeof imageUrl !== 'string') {
        res.setHeader('Content-Type', 'application/json');
        return res.status(400).json({ error: "URL da imagem é obrigatória" });
      }

      let targetUrl = imageUrl.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = formatShopeeImageUrl(targetUrl);
      }

      const headers: Record<string, string> = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://shopee.com.br/',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      };

      const urlsToTry: string[] = [targetUrl];
      const match = targetUrl.match(/\/file\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        const hash = match[1];
        const alt1 = `https://down-br.img.susercontent.com/file/${hash}`;
        const alt2 = `https://down-ws.img.susercontent.com/file/${hash}`;
        const alt3 = `https://cf.shopee.com.br/file/${hash}`;
        const alt4 = `https://down-tx.img.susercontent.com/file/${hash}`;
        if (!urlsToTry.includes(alt1)) urlsToTry.push(alt1);
        if (!urlsToTry.includes(alt2)) urlsToTry.push(alt2);
        if (!urlsToTry.includes(alt3)) urlsToTry.push(alt3);
        if (!urlsToTry.includes(alt4)) urlsToTry.push(alt4);
      }

      let response: Response | null = null;
      for (const currentUrl of urlsToTry) {
        try {
          response = await fetch(currentUrl, { headers, signal: AbortSignal.timeout(6000) });
          if (response.ok) break;

          const fallbackHeaders = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
            'Referer': 'https://shopee.com.br/'
          };
          response = await fetch(currentUrl, { headers: fallbackHeaders, signal: AbortSignal.timeout(6000) });
          if (response.ok) break;
        } catch (e) {
          // ignore and try next URL
        }
      }

      if (response && response.ok) {
        const contentType = response.headers.get('content-type') || 'image/jpeg';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        const arrayBuffer = await response.arrayBuffer();
        return res.send(Buffer.from(arrayBuffer));
      }

      // Serve a sleek SVG placeholder if image is unavailable or 404
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none">
  <rect width="400" height="400" fill="#18181b"/>
  <rect x="1" y="1" width="398" height="398" rx="12" stroke="#27272a" stroke-width="2"/>
  <path d="M160 150L200 110L240 150M200 110V250" stroke="#a1a1aa" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M140 210H130C118.954 210 110 218.954 110 230V270C110 281.046 118.954 290 130 290H270C281.046 290 290 281.046 290 270V230C290 218.954 281.046 210 270 210H260" stroke="#a1a1aa" stroke-width="8" stroke-linecap="round"/>
  <text x="200" y="330" fill="#a1a1aa" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle">Imagem indisponível</text>
</svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Cache-Control', 'no-cache');
      return res.status(200).send(fallbackSvg);
    } catch (error: any) {
      console.warn("[Image Proxy] Warning:", error?.message || error);
      const fallbackSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none">
  <rect width="400" height="400" fill="#18181b"/>
  <text x="200" y="200" fill="#a1a1aa" font-family="sans-serif" font-size="14" font-weight="600" text-anchor="middle">Imagem indisponível</text>
</svg>`;
      res.setHeader('Content-Type', 'image/svg+xml');
      return res.status(200).send(fallbackSvg);
    }
  });

  async function fetchShopeeProductWithApi(productUrl: string, customCredentials?: { apiKey?: string; partnerId?: string; secret?: string; accessToken?: string }): Promise<{ titulo: string; imagem: string | null; imagens: string[] } | null> {
    console.log(`[Shopee API] Starting extraction for URL: ${productUrl}`);
    
    // Resolve redirects/unshorten first to get the final complete Shopee URL (which contains shop_id and item_id)
    let finalUrl = productUrl;
    try {
      finalUrl = await resolveRedirects(productUrl);
      console.log(`[Shopee API] Resolved final URL for extraction: ${finalUrl}`);
    } catch (e) {
      console.error(`[Shopee API] Error resolving redirects in Shopee API fetch:`, e);
    }
    productUrl = finalUrl;
    
    // Log available Shopee configuration keys for diagnostics (no secrets logged)
    const shopeeEnvKeys = Object.keys(process.env).filter(k => k.startsWith("SHOPEE"));
    console.log(`[Shopee API] Configured env variables starting with SHOPEE:`, shopeeEnvKeys);

    // Resolve credentials from custom input, headers, or env vars
    const appId = customCredentials?.partnerId || customCredentials?.apiKey || process.env.SHOPEE_APP_ID || process.env.SHOPEE_AFFILIATE_APP_ID || process.env.SHOPEE_PARTNER_ID || process.env.SHOPEE_API_KEY || process.env.SHOPEE_KEY;
    const secret = customCredentials?.secret || process.env.SHOPEE_SECRET || process.env.SHOPEE_AFFILIATE_SECRET || process.env.SHOPEE_PARTNER_KEY;

    // 1. Try Affiliate V1 API if configured
    if (appId && secret) {
      console.log(`[Shopee API] Attempting Shopee Affiliate API v1 for: ${productUrl}`);
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        const graphqlQuery = {
          query: `
            query getProductInfo($url: String!) {
              productInfoByUrl(url: $url) {
                productName
                imageUrl
                imageUrls
              }
            }
          `,
          variables: {
            url: productUrl
          }
        };

        const bodyStr = JSON.stringify(graphqlQuery);
        const signature = crypto
          .createHash('sha256')
          .update(appId + timestamp + bodyStr + secret)
          .digest('hex');

        const headers = {
          'Content-Type': 'application/json',
          'Authorization': `SHA256 Credential=${appId}, Timestamp=${timestamp}, Signature=${signature}`
        };

        const response = await fetch('https://open-api.affiliate.shopee.com.br/api/v1/graphql', {
          method: 'POST',
          headers,
          body: bodyStr,
          signal: AbortSignal.timeout(8000)
        });

        if (response.ok) {
          const resJson = await response.json();
          console.log("[Shopee API] Affiliate API response:", JSON.stringify(resJson));
          const product = resJson?.data?.productInfoByUrl;
          if (product && product.productName) {
            const formattedImgs = (product.imageUrls || []).map(formatShopeeImageUrl).filter(Boolean);
            const mainImg = product.imageUrl ? formatShopeeImageUrl(product.imageUrl) : (formattedImgs[0] || null);
            return {
              titulo: product.productName,
              imagem: mainImg,
              imagens: formattedImgs.length > 0 ? formattedImgs : (mainImg ? [mainImg] : [])
            };
          }
        } else {
          console.warn(`[Shopee API] Affiliate API status: ${response.status}`);
        }
      } catch (err) {
        console.error("[Shopee API] Error fetching from Shopee Affiliate API:", err);
      }
    }

    // Robust shop_id and item_id extraction from any URL format
    const extractShopeeIds = (url: string) => {
      const match1 = url.match(/i\.(\d+)\.(\d+)/);
      if (match1) return { shopId: parseInt(match1[1], 10), itemId: parseInt(match1[2], 10) };

      const match2 = url.match(/product\/(\d+)\/(\d+)/);
      if (match2) return { shopId: parseInt(match2[1], 10), itemId: parseInt(match2[2], 10) };

      const match3 = url.match(/-i\.(\d+)\.(\d+)/);
      if (match3) return { shopId: parseInt(match3[1], 10), itemId: parseInt(match3[2], 10) };

      try {
        const parsed = new URL(url);
        const sId = parsed.searchParams.get("shopId") || parsed.searchParams.get("shop_id");
        const iId = parsed.searchParams.get("itemId") || parsed.searchParams.get("item_id");
        if (sId && iId) return { shopId: parseInt(sId, 10), itemId: parseInt(iId, 10) };
      } catch (e) {}

      const pathOnly = url.split('?')[0];
      const matchParts = pathOnly.match(/(\d+)[./](\d+)$/);
      if (matchParts) return { shopId: parseInt(matchParts[1], 10), itemId: parseInt(matchParts[2], 10) };

      return { shopId: null, itemId: null };
    };

    const { shopId, itemId } = extractShopeeIds(productUrl);
    if (shopId && itemId) {
      console.log(`[Shopee Public API] Attempting public API with Shop ID: ${shopId}, Item ID: ${itemId}`);
      try {
        const publicApiUrl = `https://shopee.com.br/api/v4/item/get?shop_id=${shopId}&item_id=${itemId}`;
        const pubResp = await fetch(publicApiUrl, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': productUrl,
            'Accept': 'application/json'
          },
          signal: AbortSignal.timeout(6000)
        });

        if (pubResp.ok) {
          const pubJson = await pubResp.json();
          const item = pubJson?.data || pubJson?.item;
          if (item && (item.name || item.title)) {
            const title = item.name || item.title;
            let images: string[] = [];
            const rawImages = item.images || (item.image ? [item.image] : []) || item.image_id_list || [];
            if (Array.isArray(rawImages)) {
              images = rawImages.map(formatShopeeImageUrl).filter(Boolean);
            }
            if (images.length === 0 && item.image) {
              images = [formatShopeeImageUrl(item.image)];
            }

            console.log(`[Shopee Public API] Success! Title: ${title}`);
            return {
              titulo: title,
              imagem: images.length > 0 ? images[0] : null,
              imagens: images
            };
          }
        }
      } catch (pubErr) {
        console.warn(`[Shopee Public API] Error:`, pubErr);
      }
    }

    // 2. Try Open Platform v2 API
    const partnerId = process.env.SHOPEE_PARTNER_ID || process.env.SHOPEE_APP_ID || appId;
    const partnerKey = process.env.SHOPEE_PARTNER_KEY || process.env.SHOPEE_SECRET || secret;
    const accessToken = process.env.SHOPEE_ACCESS_TOKEN || process.env.SHOPEE_TOKEN || "";

    if (!partnerId || !partnerKey) {
      console.log("[Shopee API] Partner ID or Key not configured. Skipping V2 Open Platform API.");
      return null;
    }

    console.log(`[Shopee API] Attempting Shopee Open Platform V2 API for: ${productUrl}`);
    try {

      const path = "/api/v2/product/get_item_base_info";
      const timestamp = Math.floor(Date.now() / 1000);

      // Generate signature variants to ensure compatibility with all account types
      const signatureVariants = [];

      // Variant A: Standard v2 Shop API sign (partner_id + path + timestamp + access_token + shop_id)
      if (accessToken) {
        const baseStringA = `${partnerId}${path}${timestamp}${accessToken}${shopId}`;
        const signA = crypto.createHmac('sha256', partnerKey).update(baseStringA).digest('hex');
        signatureVariants.push({ sign: signA, hasToken: true, description: "Standard Shop v2 (partner_id + path + timestamp + access_token + shop_id)" });
      }

      // Variant B: Alternative Shop sign without accessToken (partner_id + path + timestamp + shop_id)
      const baseStringB = `${partnerId}${path}${timestamp}${shopId}`;
      const signB = crypto.createHmac('sha256', partnerKey).update(baseStringB).digest('hex');
      signatureVariants.push({ sign: signB, hasToken: false, description: "Alternative Shop v2 (partner_id + path + timestamp + shop_id)" });

      // Variant C: Public / User requested signature (partner_id + path + timestamp)
      const baseStringC = `${partnerId}${path}${timestamp}`;
      const signC = crypto.createHmac('sha256', partnerKey).update(baseStringC).digest('hex');
      signatureVariants.push({ sign: signC, hasToken: false, description: "Public v2 (partner_id + path + timestamp)" });

      const hosts = [
        "https://partner.shopeemobile.com",
        "https://openplatform.shopee.com.br"
      ];

      for (const sigInfo of signatureVariants) {
        for (const host of hosts) {
          const queryParams = new URLSearchParams({
            partner_id: partnerId.toString(),
            timestamp: timestamp.toString(),
            sign: sigInfo.sign,
            shop_id: shopId.toString(),
            item_id_list: `[${itemId}]`
          });

          if (sigInfo.hasToken && accessToken) {
            queryParams.append('access_token', accessToken);
          }

          const apiUrl = `${host}${path}?${queryParams.toString()}`;
          console.log(`[Shopee API] Fetching using host ${host} and variant: ${sigInfo.description}`);

          try {
            const response = await fetch(apiUrl, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'X-Shopee-Sign': sigInfo.sign,
                'X-Shopee-Timestamp': timestamp.toString()
              },
              signal: AbortSignal.timeout(8000)
            });

            if (!response.ok) {
              console.warn(`[Shopee API] HTTP status ${response.status} from ${host}`);
              continue;
            }

            const responseText = await response.text();
            let resJson;
            try {
              resJson = JSON.parse(responseText);
            } catch (e) {
              console.error(`[Shopee API] Failed to parse response text as JSON from ${host}: ${responseText}`);
              continue;
            }

            console.log(`[Shopee API] Response payload from ${host}:`, JSON.stringify(resJson));

            if (resJson?.error) {
              console.warn(`[Shopee API] API error from ${host}: ${resJson.error} - ${resJson.message}`);
              continue; 
            }

            const item = resJson?.response?.item_list?.[0] || resJson?.response?.item_info || resJson?.response?.item;
            if (item) {
              const title = item.item_name || item.name || "";
              let images: string[] = [];
              
              if (item.image?.image_url_list && Array.isArray(item.image.image_url_list)) {
                images = item.image.image_url_list.map(formatShopeeImageUrl).filter(Boolean);
              } else if (item.images && Array.isArray(item.images)) {
                images = item.images.map(formatShopeeImageUrl).filter(Boolean);
              } else if (item.image?.image_id_list && Array.isArray(item.image.image_id_list)) {
                images = item.image.image_id_list.map(formatShopeeImageUrl).filter(Boolean);
              }

              if (images.length === 0 && item.image?.image_id) {
                images = [formatShopeeImageUrl(item.image.image_id)];
              }

              console.log(`[Shopee API] Successfully extracted product! Title: ${title}`);
              return {
                titulo: title,
                imagem: images.length > 0 ? images[0] : null,
                imagens: images
              };
            }
          } catch (fetchErr) {
            console.error(`[Shopee API] Error fetching from host ${host}:`, fetchErr);
          }
        }
      }

      // Try older API fallback if /get_item_base_info fails
      console.log("[Shopee API] Trying older get_item_info API as last resort fallback...");
      const oldPath = "/api/v2/item/get_item_info";
      const oldBaseString = `${partnerId}${oldPath}${timestamp}`;
      const oldSign = crypto.createHmac('sha256', partnerKey).update(oldBaseString).digest('hex');
      
      for (const host of hosts) {
        const oldApiUrl = `${host}${oldPath}?partner_id=${partnerId}&timestamp=${timestamp}&sign=${oldSign}&item_id=${itemId}&shop_id=${shopId}`;
        try {
          const oldResp = await fetch(oldApiUrl, {
            method: 'GET',
            signal: AbortSignal.timeout(8000)
          });
          if (oldResp.ok) {
            const oldJson = await oldResp.json();
            const item = oldJson?.response?.item_info || oldJson?.response?.item;
            if (item) {
              const title = item.item_name || item.name || "";
              let images: string[] = [];
              if (item.image?.image_url_list) {
                images = item.image.image_url_list;
              } else if (item.images) {
                images = item.images;
              }
              return {
                titulo: title,
                imagem: images.length > 0 ? images[0] : null,
                imagens: images
              };
            }
          }
        } catch (oldErr) {
          console.error(`[Shopee API] Error on older fallback host ${host}:`, oldErr);
        }
      }

    } catch (err) {
      console.error("[Shopee API] Unexpected error in Open Platform API:", err);
    }

    return null;
  }

  apiRouter.post("/fetch-metadata", async (req, res) => {
    try {
      const { url, apiKey, partnerId, secret, accessToken } = req.body;
      if (!url) return res.status(400).json({ error: "URL is required" });

      const customCreds = {
        apiKey: apiKey || req.headers['x-shopee-api-key'] as string,
        partnerId: partnerId || req.headers['x-shopee-partner-id'] as string,
        secret: secret || req.headers['x-shopee-secret'] as string,
        accessToken: accessToken || req.headers['x-shopee-access-token'] as string
      };

      console.log(`[Metadata Scraper] Processing URL: ${url}`);

      let scrapedTitle: string | null = null;
      let scrapedImage: string | null = null;
      let scrapedImages: string[] = [];

      // 1. Resolve shortened links first
      const resolvedUrlFromRedirects = await resolveRedirects(url);
      console.log(`[Metadata Scraper] Resolved URL from redirect engine: ${resolvedUrlFromRedirects}`);

      const checkUrl = resolvedUrlFromRedirects || url;

      const isShopee = checkUrl.toLowerCase().includes('shopee.com') || 
                       checkUrl.toLowerCase().includes('shopee.com.br') || 
                       checkUrl.toLowerCase().includes('shope.ee') ||
                       checkUrl.toLowerCase().includes('shp.ee') ||
                       url.toLowerCase().includes('shope.ee') ||
                       url.toLowerCase().includes('shp.ee') ||
                       url.toLowerCase().includes('shopee.com') ||
                       url.toLowerCase().includes('shopee.com.br');

      if (isShopee) {
        console.log(`[Metadata Scraper] Target is Shopee. Attempting official Shopee API first...`);
        const shopeeData = await fetchShopeeProductWithApi(checkUrl, customCreds) || await fetchShopeeProductWithApi(url, customCreds);
        if (shopeeData && shopeeData.titulo) {
          console.log(`[Metadata Scraper] Shopee API success! Converting images to Base64 Data URIs...`);
          let mainImg = shopeeData.imagem || (shopeeData.imagens.length > 0 ? shopeeData.imagens[0] : null);
          let imgList = shopeeData.imagens || [];

          if (mainImg) {
            const b64 = await downloadImageAsBase64(mainImg);
            if (b64) mainImg = b64;
          }
          if (imgList.length > 0) {
            const b64s = await Promise.all(imgList.map(async (i) => (await downloadImageAsBase64(i)) || i));
            imgList = b64s.filter(Boolean);
          }

          return res.json({
            titulo: shopeeData.titulo,
            imagem: mainImg,
            imagens: imgList,
            isShopee: true,
            resolvedUrl: checkUrl
          });
        }
        console.log(`[Metadata Scraper] Shopee API did not return data. Continuing with scraping fallback...`);
      }

      // 2. Direct Scraping on resolved URL
      const { html, resolvedUrl: fetchResolvedUrl } = await fetchPage(checkUrl);
      const finalCheckUrl = fetchResolvedUrl || checkUrl;

      const isAmazon = finalCheckUrl.includes('amazon.com') || 
                       finalCheckUrl.includes('amazon.com.br') || 
                       finalCheckUrl.includes('amzn.to') ||
                       url.includes('amazon.com') || 
                       url.includes('amazon.com.br') || 
                       url.includes('amzn.to');

      if (html) {
        const $ = cheerio.load(html);
        
        if (isAmazon) {
          scrapedTitle = extractAmazonTitle($);
          scrapedImages = extractAmazonImages($);
          scrapedImage = scrapedImages.length > 0 ? scrapedImages[0] : null;
        } else {
          const general = extractGeneralMetadata($);
          scrapedTitle = general.titulo;
          scrapedImages = extractGeneralImages($, checkUrl);
          scrapedImage = general.imagem || (scrapedImages.length > 0 ? scrapedImages[0] : null);
        }
      }

      // Helper to normalize relative and protocol-relative URLs
      const normalizeImg = (imgUrl: string | null): string | null => {
        if (!imgUrl) return null;
        imgUrl = imgUrl.trim();
        if (imgUrl.startsWith('//')) {
          try {
            const urlObj = new URL(checkUrl);
            return `${urlObj.protocol}${imgUrl}`;
          } catch (e) {
            return `https:${imgUrl}`;
          }
        }
        if (imgUrl.startsWith('/')) {
          try {
            const urlObj = new URL(checkUrl);
            return `${urlObj.protocol}//${urlObj.host}${imgUrl}`;
          } catch (e) {
            return imgUrl;
          }
        }
        return imgUrl;
      };

      const isValidProductImage = (imgUrl: string | null): boolean => {
        if (!imgUrl || typeof imgUrl !== 'string' || !imgUrl.startsWith('http')) return false;
        
        const lowerImg = imgUrl.toLowerCase();
        
        // Filter out obvious tracking pixels, icons, layout elements, and UI assets
        if (
          lowerImg.includes('pixel') || 
          lowerImg.includes('sprite') || 
          lowerImg.includes('logo') || 
          lowerImg.includes('avatar') || 
          lowerImg.includes('loading') || 
          lowerImg.includes('spinner') || 
          lowerImg.includes('spacer') || 
          lowerImg.includes('icon') || 
          lowerImg.includes('button') || 
          lowerImg.includes('arrow') || 
          lowerImg.includes('captcha') || 
          lowerImg.includes('robot') || 
          lowerImg.includes('/x-locale/') || 
          lowerImg.includes('/g/01/') || 
          lowerImg.includes('error') || 
          lowerImg.includes('placeholder') || 
          lowerImg.includes('no-image') || 
          lowerImg.includes('not-found') ||
          lowerImg.includes('transparent') ||
          lowerImg.includes('rating') ||
          lowerImg.includes('stars') ||
          lowerImg.includes('ad-') ||
          lowerImg.includes('/ads/') ||
          lowerImg.includes('banner') ||
          lowerImg.includes('badge') ||
          lowerImg.includes('check-') ||
          lowerImg.includes('marker-')
        ) {
          return false;
        }

        // Exclude generic small gifs often used as spacers or indicators
        if (lowerImg.endsWith('.gif') && !lowerImg.includes('product')) {
          return false;
        }

        return true;
      };

      if (scrapedImage) {
        scrapedImage = normalizeImg(scrapedImage);
        if (!isValidProductImage(scrapedImage)) {
          scrapedImage = null;
        }
      }

      scrapedImages = scrapedImages
        .map(normalizeImg)
        .filter(Boolean)
        .filter(isValidProductImage) as string[];

      // Ensure main image is in the list
      if (scrapedImage && !scrapedImages.includes(scrapedImage)) {
        scrapedImages.unshift(scrapedImage);
      } else if (!scrapedImage && scrapedImages.length > 0) {
        scrapedImage = scrapedImages[0];
      }

      // Clean title from extra whitespaces or newlines
      if (scrapedTitle) {
        scrapedTitle = scrapedTitle.replace(/\s+/g, ' ').trim();
      }

      // Blocked or generic title detector
      const isBlockedOrGeneric = (title: string | null): boolean => {
        if (!title) return true;
        const lower = title.toLowerCase();
        return lower.includes('security') || 
               lower.includes('captcha') || 
               lower.includes('robot') || 
               lower.includes('verification') || 
               lower.includes('blocked') || 
               lower.includes('bloqueio') || 
               lower.includes('cloudflare') ||
               lower.includes('forbidden') ||
               lower.includes('access denied') ||
               lower === 'aliexpress' ||
               lower === 'shopee' ||
               lower === 'shein' ||
               lower === 'mercado livre' ||
               lower === 'mercadolivre' ||
               lower === 'produtos' ||
               lower === 'amazon' ||
               lower === 'amazon.com' ||
               lower === 'amazon.com.br' ||
               /^\d+$/.test(title.replace(/[\s\-_.]/g, ''));
      };

      const isAliExpress = checkUrl.toLowerCase().includes('aliexpress') || url.toLowerCase().includes('aliexpress');
      const isShein = checkUrl.toLowerCase().includes('shein') || url.toLowerCase().includes('shein');
      const isMercadoLivre = checkUrl.toLowerCase().includes('mercadolivre') || url.toLowerCase().includes('mercadolivre') || checkUrl.toLowerCase().includes('mlb.link') || url.toLowerCase().includes('mlb.link');
      const isMagalu = checkUrl.toLowerCase().includes('maga.lu') || url.toLowerCase().includes('maga.lu') || checkUrl.toLowerCase().includes('magazineluiza') || url.toLowerCase().includes('magazineluiza');
      const isProtected = isShopee || isAliExpress || isShein || isMercadoLivre || isMagalu;

      // 2. Gemini fallback if scraping is incomplete, blocked, or generic for standard/protected sites
      const needsGeminiFallback = !scrapedTitle || isBlockedOrGeneric(scrapedTitle) || !scrapedImage || scrapedImages.length === 0 || isProtected;

      if (needsGeminiFallback) {
        if (!process.env.GEMINI_API_KEY) {
          console.warn("GEMINI_API_KEY não configurada no servidor, pulando fallback do Gemini.");
        } else {
          console.log(`[Metadata Fallback] Scraping incomplete, blocked, or protected site (${checkUrl}). Requesting Gemini Search Grounding...`);
          try {
            const ai = new GoogleGenAI({ 
              apiKey: process.env.GEMINI_API_KEY,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
            });

            // Step 1: Perform the search with Google Search tools enabled (Free text to avoid JSON mode + Search grounding conflicts)
            const searchPrompt = `Você é um extrator de metadados inteligente para produtos de e-commerce.
Dado este link de produto: "${checkUrl}".
Por favor, use a ferramenta de busca do Google para obter:
1. O nome/título exato e completo do produto.
2. URLs diretas de imagens de alta qualidade deste produto correspondentes a este produto exato (preferencialmente URLs do site original ou hospedadas em CDNs confiáveis).
Escreva uma resposta clara contendo o título do produto e a lista de links diretos de imagens encontrados.`;

            console.log("[Gemini Step 1] Requesting Search Grounding...");
            let response1;
            try {
              response1 = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: searchPrompt,
                config: {
                  tools: [{ googleSearch: {} }],
                },
              });
            } catch (err: any) {
              if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(err).includes('429')) {
                console.warn("[Gemini] Quota exceeded (429), skipping AI fallback gracefully.");
                throw new Error("GEMINI_QUOTA_EXCEEDED");
              }
              console.warn("gemini-3.6-flash search grounding failed, falling back to basic prompt without search...", err);
              response1 = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: searchPrompt,
              });
            }

            const rawSearchResult = response1.text || "";
            console.log(`[Gemini Step 1] Received search text (length: ${rawSearchResult.length}). Now parsing via Step 2...`);

            // Step 2: Format the raw search output into precise JSON schema (NO search tools here, 100% compliant JSON)
            const extractionPrompt = `Analise o seguinte resultado de busca de e-commerce e extraia o título exato do produto, a URL da imagem principal e uma lista de outras imagens adicionais se houver.
Resultado da busca:
"""
${rawSearchResult}
"""

Retorne APENAS um objeto JSON válido seguindo exatamente este esquema:
{
  "titulo": "Nome exato do produto",
  "imagem": "https://url-da-imagem-principal.jpg",
  "imagens": ["https://url-da-imagem-principal.jpg", "https://url-da-imagem-adicional.jpg"]
}`;

            let response2;
            try {
              response2 = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: extractionPrompt,
                config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                      titulo: { type: Type.STRING },
                      imagem: { type: Type.STRING },
                      imagens: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING }
                      }
                    },
                    required: ["titulo", "imagem"]
                  }
                },
              });
            } catch (err: any) {
              if (err?.message?.includes('429') || err?.status === 'RESOURCE_EXHAUSTED' || JSON.stringify(err).includes('429')) {
                console.warn("[Gemini] Quota exceeded (429) during step 2.");
                throw new Error("GEMINI_QUOTA_EXCEEDED");
              }
              console.warn("gemini-3.6-flash structured output extraction failed...", err);
              response2 = await ai.models.generateContent({
                model: "gemini-3.6-flash",
                contents: extractionPrompt,
              });
            }

            const geminiData = JSON.parse(response2.text || "{}");
            console.log("[Gemini Step 2] Successfully extracted structured metadata:", JSON.stringify(geminiData));
            
            if (geminiData.titulo && (isBlockedOrGeneric(scrapedTitle) || isProtected || !scrapedTitle)) {
              scrapedTitle = geminiData.titulo;
            }
            
            const geminiImage = geminiData.imagem && isValidProductImage(normalizeImg(geminiData.imagem)) 
              ? normalizeImg(geminiData.imagem) 
              : null;
            const geminiImages = geminiData.imagens && Array.isArray(geminiData.imagens)
              ? geminiData.imagens.map(normalizeImg).filter(Boolean).filter(isValidProductImage) as string[]
              : [];

            if (geminiImage && (isProtected || !scrapedImage || isBlockedOrGeneric(scrapedTitle))) {
              scrapedImage = geminiImage;
            }

            if (geminiImages.length > 0 && (isProtected || scrapedImages.length === 0)) {
              scrapedImages = geminiImages;
            } else if (geminiImages.length > 0) {
              geminiImages.forEach((img: string) => {
                if (img && !scrapedImages.includes(img)) {
                  scrapedImages.push(img);
                }
              });
            }
          } catch (geminiErr) {
            console.error("Gemini fallback failed:", geminiErr);
          }
        }
      }

      // Ensure main image is at the very beginning of the list
      if (scrapedImage) {
        scrapedImages = [scrapedImage, ...scrapedImages.filter(img => img !== scrapedImage)];
      }

      // Deduplicate images and clean them
      scrapedImages = Array.from(new Set(scrapedImages)).filter(img => {
        return img && typeof img === 'string' && img.startsWith('http') && isValidProductImage(img);
      });

      // 3. Graceful fallback for title if scraping/Gemini didn't return a specific title
      const isNumericOnly = scrapedTitle && /^\d+$/.test(scrapedTitle.replace(/[\s\-_.]/g, '')) && scrapedTitle.length < 20;
      if (!scrapedTitle || isNumericOnly || isBlockedOrGeneric(scrapedTitle)) {
        try {
          const parsed = new URL(checkUrl);
          const pathSegments = parsed.pathname.split('/').filter(Boolean);
          if (pathSegments.length > 0) {
            const lastSeg = pathSegments[pathSegments.length - 1];
            const cleaned = decodeURIComponent(lastSeg)
              .replace(/[-_]+/g, ' ')
              .replace(/\.[^/.]+$/, '')
              .trim();
            if (cleaned.length > 3 && !/^\d+$/.test(cleaned)) {
              scrapedTitle = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
            }
          }
          if (!scrapedTitle || isBlockedOrGeneric(scrapedTitle)) {
            const domain = parsed.hostname.replace('www.', '').split('.')[0];
            scrapedTitle = `Produto Importado de ${domain.charAt(0).toUpperCase() + domain.slice(1)}`;
          }
        } catch (e) {
          scrapedTitle = "Produto Importado";
        }
      }

      // 4. Absolute Bulletproof fallback for images if we have a title but no image
      if (scrapedTitle && scrapedImages.length === 0) {
        const queryTerm = scrapedTitle
          .toLowerCase()
          .replace(/comprar|preço|oferta|promoção|shopee|amazon|mercado livre|frete grátis/gi, '')
          .replace(/[^\w\s\u00C0-\u00FF]/g, '')
          .trim()
          .split(/\s+/)
          .slice(0, 3)
          .join(' ') || "product";
        const fallbackImg = `https://images.unsplash.com/featured/500x500/?${encodeURIComponent(queryTerm)},product`;
        scrapedImage = fallbackImg;
        scrapedImages = [fallbackImg];
      }

      // Convert image URLs to server-side Base64 Data URIs to ensure direct loading in browser without CORS/404 issues
      if (scrapedImage) {
        const b64Main = await downloadImageAsBase64(scrapedImage);
        if (b64Main) scrapedImage = b64Main;
      }

      if (scrapedImages.length > 0) {
        const b64List = await Promise.all(
          scrapedImages.map(async (img) => {
            const b64 = await downloadImageAsBase64(img);
            return b64 || img;
          })
        );
        scrapedImages = b64List.filter(Boolean);
      }

      res.json({
        titulo: scrapedTitle,
        imagem: scrapedImage || (scrapedImages.length > 0 ? scrapedImages[0] : "https://images.unsplash.com/photo-1555529669-2269763671c0?auto=format&fit=crop&q=80&w=400"),
        imagens: scrapedImages.length > 0 ? scrapedImages : [scrapedImage || "https://images.unsplash.com/photo-1555529669-2269763671c0?auto=format&fit=crop&q=80&w=400"],
        isShopee: isShopee,
        resolvedUrl: checkUrl
      });

    } catch (error: any) {
      console.error("fetch-metadata error:", error);
      res.status(500).json({ error: error.message || "Erro ao processar o link" });
    }
  });

  // API Catch-all
  apiRouter.all("*", (req, res) => {
    console.warn(`[API 404] ${req.method} ${req.url}`);
    res.status(404).json({ error: "API Route not found" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  // Global error handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error("Global error handler:", err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ 
      error: "Erro interno no servidor", 
      message: err.message || "Um erro inesperado ocorreu" 
    });
  });
}

startServer();

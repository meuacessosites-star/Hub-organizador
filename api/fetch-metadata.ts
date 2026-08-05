import type { Request, Response } from 'express';
import * as cheerio from 'cheerio';

export default async function handler(req: any, res: any) {
  // CORS Headers
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

    const targetUrl = url.trim();
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
    
    let html = '';
    try {
      const resp = await fetch(proxyUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        }
      });
      if (resp.ok) {
        html = await resp.text();
      }
    } catch (e) {
      try {
        const resp2 = await fetch(targetUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
          }
        });
        if (resp2.ok) html = await resp2.text();
      } catch (e2) {}
    }

    if (html) {
      const $ = cheerio.load(html);
      
      const title = $('#productTitle').text().trim() ||
                    $('meta[property="og:title"]').attr('content') ||
                    $('title').text().trim();

      const image = $('#landingImage').attr('src') ||
                    $('#imgBlkFront').attr('src') ||
                    $('meta[property="og:image"]').attr('content');

      let cleanTitle = title
        .replace(/Amazon.com.br|Amazon.com|: Amazon.*/gi, '')
        .replace(/[\n\r]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanTitle) {
        return res.status(200).json({
          titulo: cleanTitle,
          imagem: image || null,
          imagens: image ? [image] : [],
          resolvedUrl: targetUrl
        });
      }
    }

    return res.status(200).json({
      error: 'Não foi possível extrair dados automaticamente',
      resolvedUrl: targetUrl
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro no servidor' });
  }
}

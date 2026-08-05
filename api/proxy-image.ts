import type { Request, Response } from 'express';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const rawUrl = req.query?.url || req.body?.url;
    if (!rawUrl || typeof rawUrl !== 'string') {
      return res.status(400).json({ error: 'URL da imagem é obrigatória' });
    }

    let targetUrl = rawUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      const cleanHash = targetUrl.replace(/^\/?(file\/)?/, '');
      targetUrl = `https://down-br.img.susercontent.com/file/${cleanHash}`;
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
      urlsToTry.push(`https://down-br.img.susercontent.com/file/${hash}`);
      urlsToTry.push(`https://cf.shopee.com.br/file/${hash}`);
      urlsToTry.push(`https://down-ws.img.susercontent.com/file/${hash}`);
      urlsToTry.push(`https://down-tx.img.susercontent.com/file/${hash}`);
    }

    for (const currentUrl of urlsToTry) {
      try {
        const resp = await fetch(currentUrl, { headers, signal: AbortSignal.timeout(6000) });
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await resp.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
          return res.status(200).send(buffer);
        }
      } catch (e) {}

      try {
        const corsProxyUrl = `https://corsproxy.io/?${encodeURIComponent(currentUrl)}`;
        const resp = await fetch(corsProxyUrl, { signal: AbortSignal.timeout(6000) });
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || 'image/jpeg';
          const arrayBuffer = await resp.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          res.setHeader('Content-Type', contentType);
          res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=86400');
          return res.status(200).send(buffer);
        }
      } catch (e) {}
    }

    return res.status(404).json({ error: 'Não foi possível carregar a imagem' });

  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Erro interno no proxy de imagem' });
  }
}

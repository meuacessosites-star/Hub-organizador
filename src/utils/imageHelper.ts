export const resizeImage = (file: File, maxWidth = 128, maxHeight = 128, cropToSquare = true): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        
        let finalWidth = width;
        let finalHeight = height;
        let offsetX = 0;
        let offsetY = 0;
        let sourceSize = Math.min(img.width, img.height);

        if (cropToSquare) {
          finalWidth = Math.min(width, height);
          finalHeight = finalWidth;
          offsetX = (img.width - sourceSize) / 2;
          offsetY = (img.height - sourceSize) / 2;
        }

        canvas.width = finalWidth;
        canvas.height = finalHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            resolve(event.target?.result as string);
            return;
        }

        if (cropToSquare) {
          ctx.drawImage(img, offsetX, offsetY, sourceSize, sourceSize, 0, 0, finalWidth, finalHeight);
        } else {
          ctx.drawImage(img, 0, 0, finalWidth, finalHeight);
        }

        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};


/**
 * Capturas de tela e fotos de compras exigem mais definição que avatares.
 * Preserva a proporção e até 1900 px no lado maior, com compressão adaptativa:
 * tenta PNG sem perdas quando couber no orçamento e depois WebP/JPEG de alta
 * qualidade para evitar ultrapassar o limite de armazenamento do Firestore.
 *
 * IMPORTANTE: não melhora imagens que já foram salvas com 600 px. Para isso,
 * é necessário reenviar o arquivo original.
 */
export const resizePurchaseImage = (file: File): Promise<string> => {
  const MAX_DATA_URL_CHARS = 190_000; // aprox. 140 KB binários por imagem
  const MAX_LONG_SIDE = 1900;
  const MIN_LONG_SIDE = 1100;

  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const sourceWidth = img.naturalWidth;
        const sourceHeight = img.naturalHeight;
        if (!sourceWidth || !sourceHeight) throw new Error('Imagem inválida.');

        const sourceLongSide = Math.max(sourceWidth, sourceHeight);
        const ctxCanvas = document.createElement('canvas');
        const ctx = ctxCanvas.getContext('2d');
        if (!ctx) throw new Error('Não foi possível processar a imagem.');

        let bestResult = '';
        let bestLength = Infinity;
        const resolutionSteps = [1900, 1700, 1500, 1300, 1100];
        for (const targetLongSide of resolutionSteps) {
          const maxSide = Math.min(targetLongSide, MAX_LONG_SIDE, sourceLongSide);
          if (maxSide < MIN_LONG_SIDE && sourceLongSide >= MIN_LONG_SIDE) continue;

          const scale = Math.min(1, maxSide / sourceLongSide);
          ctxCanvas.width = Math.max(1, Math.round(sourceWidth * scale));
          ctxCanvas.height = Math.max(1, Math.round(sourceHeight * scale));
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, ctxCanvas.width, ctxCanvas.height);
          ctx.drawImage(img, 0, 0, ctxCanvas.width, ctxCanvas.height);

          // PNG is lossless and usually preserves small letters perfectly.
          // Keep it when the screenshot is simple enough to fit.
          if (file.type === 'image/png') {
            const png = ctxCanvas.toDataURL('image/png');
            if (png.length <= MAX_DATA_URL_CHARS) {
              resolve(png);
              return;
            }
          }

          const webpSupported = ctxCanvas.toDataURL('image/webp', 0.9).startsWith('data:image/webp');
          const mime = webpSupported ? 'image/webp' : 'image/jpeg';
          for (const quality of [0.94, 0.9, 0.85, 0.78, 0.7]) {
            const result = ctxCanvas.toDataURL(mime, quality);
            if (result.length < bestLength) {
              bestResult = result;
              bestLength = result.length;
            }
            if (result.length <= MAX_DATA_URL_CHARS) {
              resolve(result);
              return;
            }
          }

          if (maxSide === sourceLongSide) break; // Never upscale an original.
        }
        // If a complex screenshot cannot reach the target, use the
        // smallest available result rather than silently discarding it.
        if (bestResult) resolve(bestResult);
        else reject(new Error('Não foi possível compactar a imagem.'));
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Não foi possível abrir o arquivo de imagem.'));
    };
    img.src = objectUrl;
  });
};

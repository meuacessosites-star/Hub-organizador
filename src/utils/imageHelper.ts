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

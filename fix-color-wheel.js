const fs = require('fs');
let code = fs.readFileSync('src/components/ProfileModal.tsx', 'utf8');

code = code.replace(
`  // Color wheel generator
  useEffect(() => {
    if ((avatarTab !== 'color' && avatarTab !== 'emoji') || !showColorWheel || !colorWheelRef.current || !isEditingInView) return;
    const canvas = colorWheelRef.current;`,
`  // Color wheel generator
  const drawColorWheel = () => {
    const canvas = colorWheelRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          let angle = Math.atan2(dy, dx) + Math.PI;
          const hue = (angle / (Math.PI * 2)) * 360;
          const sat = dist / radius;
          const val = 1.0;
          const rgb = hsvToRgb(hue, sat, val);
          const index = (y * width + x) * 4;
          data[index] = rgb[0];
          data[index + 1] = rgb[1];
          data[index + 2] = rgb[2];
          data[index + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  };

  useEffect(() => {
    if (showColorWheel) {
      // Delay slightly to ensure framer-motion has mounted the canvas
      const timer = setTimeout(() => {
        drawColorWheel();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showColorWheel, avatarTab]);

  // Dummy effect to replace the old one so regex replacement works without breaking brace count
  useEffect(() => {
    const dummy = colorWheelRef.current;`
);

code = code.replace(
`    const width = canvas.width;
    const height = canvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = width / 2;

    const imgData = ctx.createImageData(width, height);
    const data = imgData.data;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx;
        const dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist <= radius) {
          let angle = Math.atan2(dy, dx) + Math.PI;
          const hue = (angle / (Math.PI * 2)) * 360;
          const sat = dist / radius;
          const val = 1.0;
          const rgb = hsvToRgb(hue, sat, val);
          const index = (y * width + x) * 4;
          data[index] = rgb[0];
          data[index + 1] = rgb[1];
          data[index + 2] = rgb[2];
          data[index + 3] = 255;
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
  }, [avatarTab, isEditingInView, showColorWheel]);`,
`  }, []);`
);

fs.writeFileSync('src/components/ProfileModal.tsx', code);

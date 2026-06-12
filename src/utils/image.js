// Client-side image compressor (120x120px at 70% quality JPEG)
export const compressAvatar = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 120;
        canvas.height = 120;
        const ctx = canvas.getContext('2d');
        const size = Math.min(img.width, img.height);
        const x = (img.width - size) / 2;
        const y = (img.height - size) / 2;
        ctx.drawImage(img, x, y, size, size, 0, 0, 120, 120);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (e) => reject(new Error("Failed to load image"));
      img.src = event.target.result;
    };
    reader.onerror = (e) => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
};

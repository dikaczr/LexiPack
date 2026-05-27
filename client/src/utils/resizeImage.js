/**
 * High-quality image resize using step-by-step halving.
 * Each step uses imageSmoothingQuality = "high" to avoid aliasing.
 * SVG files are returned as-is (no resize needed for vectors).
 */
export async function resizeImageFile(file, maxSize = 256) {
  if (file.type === "image/svg+xml") {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);

      const scale   = Math.min(maxSize / img.width, maxSize / img.height, 1);
      const targetW = Math.round(img.width  * scale);
      const targetH = Math.round(img.height * scale);

      // Seed canvas at original size
      let src = document.createElement("canvas");
      src.width  = img.width;
      src.height = img.height;
      src.getContext("2d").drawImage(img, 0, 0);

      // Step-by-step halving until within 1.5× of target
      let w = img.width;
      let h = img.height;
      while (w > targetW * 1.5 || h > targetH * 1.5) {
        w = Math.max(Math.ceil(w / 2), targetW);
        h = Math.max(Math.ceil(h / 2), targetH);
        const step = document.createElement("canvas");
        step.width  = w;
        step.height = h;
        const ctx = step.getContext("2d");
        ctx.imageSmoothingEnabled  = true;
        ctx.imageSmoothingQuality  = "high";
        ctx.drawImage(src, 0, 0, w, h);
        src = step;
      }

      // Final render to exact target dimensions
      const out = document.createElement("canvas");
      out.width  = targetW;
      out.height = targetH;
      const ctx  = out.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(src, 0, 0, targetW, targetH);

      const isJpeg   = file.type === "image/jpeg";
      const mimeType = isJpeg ? "image/jpeg" : "image/png";
      const quality  = isJpeg ? 0.88 : undefined;
      resolve(out.toDataURL(mimeType, quality));
    };
    img.src = url;
  });
}

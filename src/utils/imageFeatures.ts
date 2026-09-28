import type { ImageFeatures } from '../types';

/**
 * Extract simple colour features from an image File or data URL.
 * Downsamples to 64×64 on a canvas for speed, then computes average RGB.
 */
export async function extractImageFeatures(
  source: File | string
): Promise<ImageFeatures> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      const SIZE = 64;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas 2D not available')); return; }

      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const { data } = ctx.getImageData(0, 0, SIZE, SIZE);
      let r = 0, g = 0, b = 0;
      const pixels = SIZE * SIZE;

      for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
      }

      const avgR = r / pixels;
      const avgG = g / pixels;
      const avgB = b / pixels;
      // ITU-R BT.709 luma
      const brightness = 0.2126 * avgR + 0.7152 * avgG + 0.0722 * avgB;

      resolve({
        avgR:       parseFloat(avgR.toFixed(1)),
        avgG:       parseFloat(avgG.toFixed(1)),
        avgB:       parseFloat(avgB.toFixed(1)),
        brightness: parseFloat(brightness.toFixed(1)),
        imageDataUrl: typeof source === 'string' ? source : undefined,
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    if (typeof source === 'string') {
      img.src = source;
    } else {
      const reader = new FileReader();
      reader.onload = (e) => { img.src = e.target!.result as string; };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(source);
    }
  });
}

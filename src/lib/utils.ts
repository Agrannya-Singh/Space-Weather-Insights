import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function downloadSvgChartAsPng(svgElement: SVGSVGElement, filename: string, scale = 2) {
  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(svgElement);
  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  const loaded: Promise<void> = new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = reject;
  });
  img.src = url;
  await loaded;
  const width = svgElement.viewBox.baseVal?.width || svgElement.clientWidth || 800;
  const height = svgElement.viewBox.baseVal?.height || svgElement.clientHeight || 400;
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.floor(width * scale));
  canvas.height = Math.max(1, Math.floor(height * scale));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--background') ? `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--background')})` : '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename.endsWith('.png') ? filename : `${filename}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    URL.revokeObjectURL(url);
  });
}
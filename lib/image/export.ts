import type { BlurRegion, ExportFormat, LoadedImage } from "./types";
import { createRenderContext, paintRegion } from "./render";

const MIME: Record<ExportFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

const QUALITY: Record<ExportFormat, number> = {
  png: 1,
  jpeg: 0.92,
  webp: 0.9,
};

export const FORMAT_LABELS: Record<ExportFormat, string> = {
  png: "PNG",
  jpeg: "JPG",
  webp: "WebP",
};

function toBlob(canvas: HTMLCanvasElement, mime: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Export failed"));
        },
        mime,
        quality
      );
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Renders the obscured image at full source resolution. Everything happens
 * locally in the browser; the returned blob is never transmitted.
 */
export async function exportBlurredImage(
  source: LoadedImage,
  regions: BlurRegion[],
  format: ExportFormat,
  displayWidth: number
): Promise<Blob> {
  const bw = source.width;
  const bh = source.height;
  const canvas = document.createElement("canvas");
  canvas.width = bw;
  canvas.height = bh;
  const ctx = canvas.getContext("2d")!;

  if (format === "jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, bw, bh);
  }

  ctx.drawImage(source.bitmap, 0, 0, bw, bh);

  const scale = displayWidth > 0 ? bw / displayWidth : 1;
  const rc = createRenderContext();

  for (const region of regions) {
    const w = region.w * bw;
    const h = region.h * bh;
    if (w < 1 || h < 1) continue;
    paintRegion(
      ctx,
      source.bitmap,
      bw,
      bh,
      {
        x: region.x * bw,
        y: region.y * bh,
        w,
        h,
        strength: region.strength,
        shape: region.shape,
      },
      scale,
      rc
    );
  }

  return toBlob(canvas, MIME[format], QUALITY[format]);
}

export function suggestedFilename(sourceName: string | null, format: ExportFormat, destNameFallback = "photo"): string {
  const base = sourceName
    ? sourceName
        .replace(/\.[a-z0-9]+$/i, "")
        .replace(/[^\w.-]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60)
    : "";
  const stem = base || destNameFallback;
  const ext = format === "jpeg" ? "jpg" : format;
  return `${stem}-pixelated.${ext}`;
}

export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function supportsFormat(format: ExportFormat): boolean {
  if (format === "png" || format === "jpeg") return true;
  const canvas = document.createElement("canvas");
  return canvas.toDataURL("image/webp").indexOf("image/webp") === 5;
}
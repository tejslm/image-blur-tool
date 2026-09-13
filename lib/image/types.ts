export type ExportFormat = "png" | "jpeg" | "webp";

export interface BlurRegion {
  id: string;
  /** Normalized coordinates relative to the image (0..1). */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Blur strength, 0..100 (UI scale). */
  strength: number;
}

export interface LoadedImage {
  bitmap: ImageBitmap;
  /** Original filename, if known. Never sent anywhere. */
  name: string | null;
  width: number;
  height: number;
}

export type RegionId = string;

export function createRegionId(): string {
  return `r_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-4)}`;
}
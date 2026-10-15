import type { BlurRegion } from "./types";

export const MIN_STRENGTH = 0;
export const MAX_STRENGTH = 100;
export const DEFAULT_STRENGTH = 55;
/** Corner radius of the "rounded" shape, as a fraction of the shortest side. */
export const ROUNDED_RATIO = 0.28;

/** Corner radius in pixels for a "rounded" rect of the given box size. */
export function roundedCornerRadius(width: number, height: number): number {
  return Math.max(0, Math.min(width, height) * ROUNDED_RATIO);
}

/** Map UI strength (0..100) to a pixel block size (CSS pixels), 2..32. */
export function strengthToBlockSize(strength: number): number {
  const t = Math.min(Math.max(strength, 0), 100) / 100;
  return Math.round(2 + Math.pow(t, 1.4) * 30);
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export interface DisplayRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function normalizedToDisplay(region: BlurRegion, width: number, height: number): DisplayRect {
  return {
    x: region.x * width,
    y: region.y * height,
    w: region.w * width,
    h: region.h * height,
  };
}

export function displayToNormalized(x: number, y: number, w: number, h: number, width: number, height: number) {
  const x0 = Math.min(Math.max(x, 0), width);
  const y0 = Math.min(Math.max(y, 0), height);
  const x1 = Math.min(Math.max(x + w, 0), width);
  const y1 = Math.min(Math.max(y + h, 0), height);
  const left = Math.min(x0, x1);
  const right = Math.max(x0, x1);
  const top = Math.min(y0, y1);
  const bottom = Math.max(y0, y1);
  return {
    x: left / width,
    y: top / height,
    w: Math.abs(right - left) / width,
    h: Math.abs(bottom - top) / height,
  };
}

export function regionFromPoints(x0: number, y0: number, x1: number, y1: number, width: number, height: number) {
  const x = Math.min(x0, x1);
  const y = Math.min(y0, y1);
  const w = Math.abs(x1 - x0);
  const h = Math.abs(y1 - y0);
  return displayToNormalized(x, y, w, h, width, height);
}

export function regionBoundingRect(regions: BlurRegion[]): { left: number; top: number; right: number; bottom: number } | null {
  if (regions.length === 0) return null;
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const r of regions) {
    left = Math.min(left, r.x);
    top = Math.min(top, r.y);
    right = Math.max(right, r.x + r.w);
    bottom = Math.max(bottom, r.y + r.h);
  }
  return { left, top, right, bottom };
}
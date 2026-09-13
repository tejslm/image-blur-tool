import type { BlurRegion, BlurShape, LoadedImage } from "./types";
import { strengthToRadius, clamp, roundedCornerRadius } from "./geometry";

export interface BlurContext {
  scratch: HTMLCanvasElement;
  small: HTMLCanvasElement;
  supportsFilter: boolean;
}

const testCanvas =
  typeof OffscreenCanvas !== "undefined"
    ? new OffscreenCanvas(2, 2)
    : typeof document !== "undefined"
      ? document.createElement("canvas")
      : null;

const SUPPORTS_FILTER = (() => {
  if (!testCanvas) return false;
  const ctx = testCanvas.getContext("2d") as CanvasRenderingContext2D | null;
  return typeof ctx?.filter === "string";
})();

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function ensureSize(c: HTMLCanvasElement, w: number, h: number) {
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
}

export function createBlurContext(): BlurContext {
  return {
    scratch: makeCanvas(1, 1),
    small: makeCanvas(1, 1),
    supportsFilter: SUPPORTS_FILTER,
  };
}

export function downscaleUpscaleBlur(source: HTMLCanvasElement, radius: number): void {
  const w = source.width;
  const h = source.height;
  if (radius <= 1 || w <= 0 || h <= 0) return;
  const factor = clamp(radius * 2.2, 2, Math.min(w, h));
  const tw = Math.max(1, Math.round(w / factor));
  const th = Math.max(1, Math.round(h / factor));
  const sctx = source.getContext("2d")!;
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = "high";
  // Downsample onto a temporary small canvas
  const small = makeCanvas(tw, th);
  const mctx = small.getContext("2d")!;
  mctx.drawImage(source, 0, 0, w, h, 0, 0, tw, th);
  // Upsample back
  sctx.clearRect(0, 0, w, h);
  sctx.drawImage(small, 0, 0, tw, th, 0, 0, w, h);
}

function traceShapePath(ctx: CanvasRenderingContext2D, shape: BlurShape, x: number, y: number, w: number, h: number) {
  ctx.beginPath();
  if (shape === "ellipse") {
    ctx.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  } else if (shape === "rounded") {
    ctx.roundRect(x, y, w, h, roundedCornerRadius(w, h));
  } else {
    ctx.rect(x, y, w, h);
  }
}

export function blurRegion(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  bc: BlurContext,
  shape: BlurShape = "rect"
): void {
  if (w <= 0 || h <= 0) return;
  const safeRadius = Math.max(0, radius);
  const cappedRadius = Math.min(safeRadius, Math.max(0, Math.min(w, h) * 0.5));
  const sw = sourceW;
  const sh = sourceH;
  if (sw <= 0 || sh <= 0) return;

  const pad = cappedRadius > 0.5 ? Math.ceil(cappedRadius * 1.35) + 2 : 0;
  const sx = clamp(Math.floor(x - pad), 0, sw);
  const sy = clamp(Math.floor(y - pad), 0, sh);
  const swPatch = clamp(Math.ceil(x + w + pad), sx, sw) - sx;
  const shPatch = clamp(Math.ceil(y + h + pad), sy, sh) - sy;

  if (swPatch <= 0 || shPatch <= 0) return;

  ensureSize(bc.scratch, swPatch, shPatch);
  const sctx = bc.scratch.getContext("2d")!;
  sctx.drawImage(source, sx, sy, swPatch, shPatch, 0, 0, swPatch, shPatch);

  if (cappedRadius > 0.5) {
    if (bc.supportsFilter) {
      sctx.filter = `blur(${cappedRadius}px)`;
      sctx.drawImage(bc.scratch, 0, 0);
      sctx.filter = "none";
    } else {
      downscaleUpscaleBlur(bc.scratch, cappedRadius);
    }
  }

  if (shape === "rect") {
    ctx.drawImage(bc.scratch, x - sx, y - sy, w, h, x, y, w, h);
  } else {
    ctx.save();
    traceShapePath(ctx, shape, x, y, w, h);
    ctx.clip();
    ctx.drawImage(bc.scratch, x - sx, y - sy, w, h, x, y, w, h);
    ctx.restore();
  }
}

/**
 * Draw the full blurred preview scene.
 * All rect parameters are in CSS pixels matching the canvas.
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  sourceLayer: HTMLCanvasElement,
  sourceW: number,
  sourceH: number,
  regions: BlurRegion[],
  displayW: number,
  displayH: number,
  bc: BlurContext,
  draft?: { x: number; y: number; w: number; h: number; strength: number; shape?: BlurShape } | null
): void {
  ctx.clearRect(0, 0, displayW, displayH);
  ctx.drawImage(sourceLayer, 0, 0, displayW, displayH);

  for (const region of regions) {
    const rx = region.x * displayW;
    const ry = region.y * displayH;
    const rw = region.w * displayW;
    const rh = region.h * displayH;
    blurRegion(ctx, sourceLayer, displayW, displayH, rx, ry, rw, rh, strengthToRadius(region.strength), bc, region.shape);
  }

  if (draft) {
    const dx = draft.x;
    const dy = draft.y;
    const dw = Math.abs(draft.w);
    const dh = Math.abs(draft.h);
    if (dw > 0.5 && dh > 0.5) {
      blurRegion(ctx, sourceLayer, displayW, displayH, dx, dy, dw, dh, strengthToRadius(draft.strength), bc, draft.shape ?? "rect");
    }
  }
}

export function createImageLayer(source: LoadedImage, displayW: number, displayH: number): HTMLCanvasElement {
  const canvas = makeCanvas(displayW, displayH);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source.bitmap, 0, 0, source.width, source.height, 0, 0, displayW, displayH);
  return canvas;
}
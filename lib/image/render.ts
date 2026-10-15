import type { BlurRegion, BlurShape, LoadedImage } from "./types";
import { roundedCornerRadius, strengthToBlockSize } from "./geometry";

export interface RenderContext {
  /** Reusable downscale target for the mosaic. */
  canvas: HTMLCanvasElement;
}

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

export function createRenderContext(): RenderContext {
  return { canvas: makeCanvas(1, 1) };
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

/** Run `draw` clipped to a region's shape. */
function withShapeClip(
  ctx: CanvasRenderingContext2D,
  shape: BlurShape,
  x: number,
  y: number,
  w: number,
  h: number,
  draw: () => void
) {
  if (shape === "rect") {
    draw();
    return;
  }
  ctx.save();
  traceShapePath(ctx, shape, x, y, w, h);
  ctx.clip();
  draw();
  ctx.restore();
}

/**
 * Pixelate (mosaic) the given rectangle of `source` and composite it back,
 * masked to `shape`. The area is averaged down into colour blocks and redrawn
 * without smoothing, so the underlying detail is destroyed rather than merely
 * softened. `block` is the approximate block size in output pixels.
 */
export function pixelateRegion(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  x: number,
  y: number,
  w: number,
  h: number,
  block: number,
  rc: RenderContext,
  shape: BlurShape = "rect"
): void {
  if (w <= 0 || h <= 0 || sourceW <= 0 || sourceH <= 0) return;
  const b = Math.max(1, block);
  const cols = Math.max(1, Math.ceil(w / b));
  const rows = Math.max(1, Math.ceil(h / b));

  // Average each block's colour by scaling the patch down…
  ensureSize(rc.canvas, cols, rows);
  const mctx = rc.canvas.getContext("2d")!;
  mctx.imageSmoothingEnabled = true;
  mctx.imageSmoothingQuality = "high";
  mctx.clearRect(0, 0, cols, rows);
  mctx.drawImage(source, x, y, w, h, 0, 0, cols, rows);

  // …then redraw it blocky, with smoothing off.
  const prevSmoothing = ctx.imageSmoothingEnabled;
  ctx.imageSmoothingEnabled = false;
  withShapeClip(ctx, shape, x, y, w, h, () => {
    ctx.drawImage(rc.canvas, 0, 0, cols, rows, x, y, w, h);
  });
  ctx.imageSmoothingEnabled = prevSmoothing;
}

export interface RegionPaint {
  x: number;
  y: number;
  w: number;
  h: number;
  strength: number;
  shape?: BlurShape;
}

/**
 * Paint one region onto `ctx`. Geometry is in output pixels; `scale` is
 * output pixels per display pixel, which keeps the block size proportional
 * when exporting at full resolution.
 */
export function paintRegion(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceW: number,
  sourceH: number,
  region: RegionPaint,
  scale: number,
  rc: RenderContext
): void {
  const { x, y, w, h } = region;
  if (w <= 0 || h <= 0) return;
  const block = strengthToBlockSize(region.strength) * (scale > 0 ? scale : 1);
  pixelateRegion(ctx, source, sourceW, sourceH, x, y, w, h, block, rc, region.shape ?? "rect");
}

/**
 * Draw the full preview scene.
 * All rect parameters are in CSS pixels matching the canvas.
 */
export function renderScene(
  ctx: CanvasRenderingContext2D,
  sourceLayer: HTMLCanvasElement,
  regions: BlurRegion[],
  displayW: number,
  displayH: number,
  rc: RenderContext,
  draft?: { x: number; y: number; w: number; h: number; strength: number; shape?: BlurShape } | null
): void {
  ctx.clearRect(0, 0, displayW, displayH);
  ctx.drawImage(sourceLayer, 0, 0, displayW, displayH);

  for (const region of regions) {
    paintRegion(
      ctx,
      sourceLayer,
      displayW,
      displayH,
      {
        x: region.x * displayW,
        y: region.y * displayH,
        w: region.w * displayW,
        h: region.h * displayH,
        strength: region.strength,
        shape: region.shape,
      },
      1,
      rc
    );
  }

  if (draft) {
    const dw = Math.abs(draft.w);
    const dh = Math.abs(draft.h);
    if (dw > 0.5 && dh > 0.5) {
      paintRegion(
        ctx,
        sourceLayer,
        displayW,
        displayH,
        {
          x: draft.x,
          y: draft.y,
          w: dw,
          h: dh,
          strength: draft.strength,
          shape: draft.shape ?? "rect",
        },
        1,
        rc
      );
    }
  }
}

export function createImageLayer(source: LoadedImage, displayW: number, displayH: number): HTMLCanvasElement {
  const canvas = makeCanvas(displayW, displayH);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(source.bitmap, 0, 0, source.width, source.height, 0, 0, displayW, displayH);
  return canvas;
}

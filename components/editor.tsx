"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { BlurRegion, ExportFormat, LoadedImage } from "@/lib/image/types";
import { createRegionId } from "@/lib/image/types";
import { useEditorDoc } from "@/hooks/use-editor-doc";
import {
  createImageLayer,
  renderScene,
  createBlurContext,
} from "@/lib/image/render";
import {
  FORMAT_LABELS,
  exportBlurredImage,
  suggestedFilename,
  supportsFormat,
  triggerDownload,
} from "@/lib/image/export";
import {
  clamp,
  displayToNormalized,
  normalizedToDisplay,
  regionFromPoints,
  type DisplayRect,
} from "@/lib/image/geometry";
import {
  CheckIcon,
  DownloadIcon,
  LockIcon,
  RedoIcon,
  TrashIcon,
  UndoIcon,
} from "./icons";

interface EditorProps {
  source: LoadedImage;
  onReset: () => void;
}

type HandleId = "n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw";
const HANDLES: HandleId[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];
const MIN_DRAW = 9;
const MIN_RESIZE = 22;

interface DraftRect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

type Interaction =
  | { type: "draw"; startX: number; startY: number }
  | { type: "move"; id: string; startX: number; startY: number; origin: DisplayRect }
  | { type: "resize"; id: string; handle: HandleId; startX: number; startY: number; origin: DisplayRect };

export function Editor({ source, onReset }: EditorProps) {
  const {
    doc,
    selectedId,
    setSelectedId,
    canUndo,
    canRedo,
    undo,
    redo,
    startGesture,
    updateRegion,
    removeRegion,
    addRegion,
    setDefaultStrength,
  } = useEditorDoc();

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const interactionRef = useRef<Interaction | null>(null);
  const draftRef = useRef<DraftRect | null>(null);
  const dprRef = useRef(1);
  const displayRef = useRef({ w: 0, h: 0 });
  const docRef = useRef(doc);
  const selectedRef = useRef<string | null>(selectedId);

  useEffect(() => {
    docRef.current = doc;
  }, [doc]);

  useEffect(() => {
    selectedRef.current = selectedId;
  }, [selectedId]);

  const [display, setDisplay] = useState({ w: 0, h: 0 });
  const [draftUI, setDraftUI] = useState<DraftRect | null>(null);
  const [status, setStatus] = useState("");
  const [format, setFormat] = useState<ExportFormat>("png");
  const [exporting, setExporting] = useState(false);
  const [downloadFeedback, setDownloadFeedback] = useState<"idle" | "done">("idle");
  const [bc] = useState(createBlurContext);

  const announce = useCallback((message: string) => {
    setStatus(message);
  }, []);

  const renderNow = useCallback(() => {
    rafRef.current = null;
    const canvas = canvasRef.current;
    const layer = layerRef.current;
    if (!canvas || !layer || !bc) return;
    const { w, h } = displayRef.current;
    if (w <= 0 || h <= 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dprRef.current, 0, 0, dprRef.current, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const draft = draftRef.current;
    renderScene(
      ctx,
      layer,
      w,
      h,
      docRef.current.regions,
      w,
      h,
      bc,
      draft && (Math.abs(draft.x1 - draft.x0) > 0.6 || Math.abs(draft.y1 - draft.y0) > 0.6)
        ? {
            x: Math.min(draft.x0, draft.x1),
            y: Math.min(draft.y0, draft.y1),
            w: Math.abs(draft.x1 - draft.x0),
            h: Math.abs(draft.y1 - draft.y0),
            strength: docRef.current.defaultStrength,
          }
        : null
    );
  }, [bc]);

  const scheduleRender = useCallback(() => {
    if (rafRef.current == null) {
      rafRef.current = requestAnimationFrame(renderNow);
    }
  }, [renderNow]);

  useEffect(() => {
    scheduleRender();
  }, [doc.regions, doc.defaultStrength, scheduleRender]);

  // Size the canvas to fit the stage, device pixel ratio, and image.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const applySize = () => {
      const cs = getComputedStyle(stage);
      const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      const availW = stage.clientWidth - padX;
      const availH = stage.clientHeight - padY;
      if (availW <= 0 || availH <= 0) return;
      const aspect = source.width / source.height;
      let fitW = availW;
      let fitH = availW / aspect;
      if (fitH > availH) {
        fitH = availH;
        fitW = fitH * aspect;
      }
      const w = Math.max(1, Math.floor(fitW));
      const h = Math.max(1, Math.floor(fitH));
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      dprRef.current = dpr;
      displayRef.current = { w, h };
      layerRef.current = createImageLayer(source, w, h);
      setDisplay({ w, h });
      requestAnimationFrame(renderNow);
    };

    const ro = new ResizeObserver(applySize);
    ro.observe(stage);
    applySize();
    return () => ro.disconnect();
  }, [source, renderNow]);

  // Clear selection if its region disappears (e.g. after undo/redo/delete).
  useEffect(() => {
    if (selectedRef.current && !doc.regions.some((r) => r.id === selectedRef.current)) {
      setSelectedId(null);
    }
  }, [doc.regions, setSelectedId]);

  const dispRect = useCallback(
    (region: BlurRegion): DisplayRect => normalizedToDisplay(region, displayRef.current.w, displayRef.current.h),
    []
  );

  const regionById = useCallback(
    (id: string): BlurRegion | undefined => docRef.current.regions.find((r) => r.id === id),
    []
  );

  const select = useCallback((id: string) => setSelectedId(id), [setSelectedId]);

  function pointOf(e: ReactPointerEvent | PointerEvent): { x: number; y: number } {
    const overlay = overlayRef.current;
    if (!overlay) return { x: 0, y: 0 };
    const rect = overlay.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const onOverlayPointerDown = (e: ReactPointerEvent) => {
    if (!overlayRef.current) return;
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    startGesture();
    const p = pointOf(e);
    const target = e.target as HTMLElement;
    const handleEl = target.closest<HTMLElement>(".handle");
    if (handleEl) {
      const id = handleEl.dataset.regionId;
      const handle = handleEl.dataset.handle as HandleId;
      const region = id ? regionById(id) : undefined;
      if (!id || !handle || !region) return;
      select(id);
      interactionRef.current = { type: "resize", id, handle, startX: p.x, startY: p.y, origin: dispRect(region) };
      overlayRef.current.setPointerCapture(e.pointerId);
      return;
    }
    const regionEl = target.closest<HTMLElement>(".region");
    if (regionEl) {
      const id = regionEl.dataset.id;
      const region = id ? regionById(id) : undefined;
      if (!id || !region) return;
      select(id);
      interactionRef.current = { type: "move", id, startX: p.x, startY: p.y, origin: dispRect(region) };
      overlayRef.current.setPointerCapture(e.pointerId);
      return;
    }
    setSelectedId(null);
    draftRef.current = { x0: p.x, y0: p.y, x1: p.x, y1: p.y };
    setDraftUI({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
    interactionRef.current = { type: "draw", startX: p.x, startY: p.y };
    overlayRef.current.setPointerCapture(e.pointerId);
  };

  const onOverlayPointerMove = (e: ReactPointerEvent) => {
    const it = interactionRef.current;
    if (!it) return;
    e.preventDefault();
    const p = pointOf(e);
    const { w, h } = displayRef.current;

    if (it.type === "draw") {
      const x0 = clamp(it.startX, 0, w);
      const y0 = clamp(it.startY, 0, h);
      const x1 = clamp(p.x, 0, w);
      const y1 = clamp(p.y, 0, h);
      draftRef.current = { x0, y0, x1, y1 };
      setDraftUI({ x0, y0, x1, y1 });
      scheduleRender();
      return;
    }

    if (it.type === "move") {
      const nx = clamp(it.origin.x + (p.x - it.startX), 0, Math.max(0, w - it.origin.w));
      const ny = clamp(it.origin.y + (p.y - it.startY), 0, Math.max(0, h - it.origin.h));
      updateRegion(it.id, displayToNormalized(nx, ny, it.origin.w, it.origin.h, w, h));
      return;
    }

    if (it.type === "resize") {
      const o = it.origin;
      const dx = p.x - it.startX;
      const dy = p.y - it.startY;
      let nx = o.x;
      let ny = o.y;
      let nw = o.w;
      let nh = o.h;
      const handle = it.handle;

      if (handle.includes("e")) nw = clamp(o.w + dx, MIN_RESIZE, Math.max(MIN_RESIZE, w - o.x));
      if (handle.includes("s")) nh = clamp(o.h + dy, MIN_RESIZE, Math.max(MIN_RESIZE, h - o.y));
      if (handle.includes("w")) {
        const maxX = Math.max(0, o.x + o.w - MIN_RESIZE);
        nx = clamp(o.x + dx, 0, maxX);
        nw = o.x + o.w - nx;
      }
      if (handle.includes("n")) {
        const maxY = Math.max(0, o.y + o.h - MIN_RESIZE);
        ny = clamp(o.y + dy, 0, maxY);
        nh = o.y + o.h - ny;
      }

      nx = clamp(nx, 0, w);
      ny = clamp(ny, 0, h);
      nw = clamp(nw, 0, w - nx);
      nh = clamp(nh, 0, h - ny);

      updateRegion(it.id, displayToNormalized(nx, ny, nw, nh, w, h));
    }
  };

  const endInteraction = (e: ReactPointerEvent) => {
    const it = interactionRef.current;
    if (!it) return;
    e.preventDefault();
    if (it.type === "draw") {
      const d = draftRef.current;
      draftRef.current = null;
      setDraftUI(null);
      const w = displayRef.current.w;
      const h = displayRef.current.h;
      if (d && (Math.abs(d.x1 - d.x0) >= MIN_DRAW || Math.abs(d.y1 - d.y0) >= MIN_DRAW)) {
        const rect = regionFromPoints(d.x0, d.y0, d.x1, d.y1, w, h);
        if (rect.w > 0.002 && rect.h > 0.002) {
          addRegion({
            id: createRegionId(),
            x: rect.x,
            y: rect.y,
            w: rect.w,
            h: rect.h,
            strength: docRef.current.defaultStrength,
          });
          announce("Blurred area added.");
        }
      } else {
        announce("No area was drawn.");
      }
    }
    interactionRef.current = null;
    if (overlayRef.current) overlayRef.current.releasePointerCapture(e.pointerId);
  };

  const cancelInteraction = useCallback(() => {
    interactionRef.current = null;
    draftRef.current = null;
    setDraftUI(null);
  }, []);

  const deleteSelected = useCallback(() => {
    const sel = selectedRef.current;
    if (!sel) return;
    startGesture();
    removeRegion(sel);
    announce("Blurred area deleted.");
  }, [announce, removeRegion, startGesture]);

  // Keyboard shortcuts: undo/redo, delete, escape, arrow-nudge.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      const sel = selectedRef.current;

      if (mod && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
          announce("Redo.");
        } else {
          undo();
          announce("Undo.");
        }
        return;
      }
      if (mod && e.key.toLowerCase() === "y") {
        e.preventDefault();
        redo();
        announce("Redo.");
        return;
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (sel) {
          e.preventDefault();
          startGesture();
          removeRegion(sel);
          announce("Blurred area deleted.");
        }
        return;
      }
      if (e.key === "Escape") {
        if (interactionRef.current) {
          cancelInteraction();
        } else {
          setSelectedId(null);
        }
        return;
      }
      if (sel && e.key.startsWith("Arrow")) {
        e.preventDefault();
        startGesture();
        const step = e.shiftKey ? 8 : 1;
        const { w, h } = displayRef.current;
        const region = regionById(sel);
        if (!region) return;
        const d = dispRect(region);
        const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
        const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
        const nx = clamp(d.x + dx, 0, Math.max(0, w - d.w));
        const ny = clamp(d.y + dy, 0, Math.max(0, h - d.h));
        updateRegion(sel, displayToNormalized(nx, ny, d.w, d.h, w, h));
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, removeRegion, updateRegion, startGesture, cancelInteraction, regionById, dispRect, announce, setSelectedId]);

  const handleReset = useCallback(() => {
    if (docRef.current.regions.length === 0) {
      onReset();
      return;
    }
    const ok = window.confirm("Start over? You'll lose any blur edits on this image.");
    if (ok) onReset();
  }, [onReset]);

  const webpSupported = useMemo(() => supportsFormat("webp"), []);

  const onDownload = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const blob = await exportBlurredImage(source, docRef.current.regions, format, displayRef.current.w);
      const filename = suggestedFilename(source.name, format);
      triggerDownload(blob, filename);
      setDownloadFeedback("done");
      announce(`Downloaded as ${FORMAT_LABELS[format]}.`);
      window.setTimeout(() => setDownloadFeedback("idle"), 2600);
    } catch {
      announce("Something went wrong while creating the image. Try a different format.");
    } finally {
      setExporting(false);
    }
  }, [announce, source, format, exporting]);

  const selectedRegion = selectedId ? doc.regions.find((r) => r.id === selectedId) ?? null : null;
  const strengthValue = selectedRegion ? Math.round(selectedRegion.strength) : Math.round(doc.defaultStrength);

  const onStrengthChange = useCallback(
    (value: number) => {
      const selected = selectedRef.current;
      const regions = docRef.current.regions;
      if (selected) {
        updateRegion(selected, { strength: value });
      } else if (regions.length > 0) {
        const last = regions[regions.length - 1];
        setSelectedId(last.id);
        updateRegion(last.id, { strength: value });
      } else {
        setDefaultStrength(value);
      }
    },
    [updateRegion, setDefaultStrength, setSelectedId]
  );

  const tip = useMemo(() => {
    if (doc.regions.length === 0 && !draftUI) return "Draw over anything you want to hide.";
    if (selectedRegion) return "Drag inside to move · use the handles to resize · press Delete to remove.";
    return "Draw another box to blur more areas. Drag a box to move it.";
  }, [doc.regions.length, draftUI, selectedRegion]);

  return (
    <div className="tool-shell">
      <div className="editor" role="region" aria-label="Image editor">
        <div className="editor__bar">
          <div className="editor__file">
            <span className="editor__file-name" title={source.name ?? undefined}>
              {source.name ?? "Image from clipboard"}
            </span>
            <span className="editor__file-dims">
              {source.width}&times;{source.height} px
            </span>
          </div>

          <span className="editor__divider" aria-hidden />

          <button type="button" className="btn btn--ghost btn--sm" onClick={undo} disabled={!canUndo} aria-label="Undo (Ctrl/Command Z)">
            <UndoIcon width={16} height={16} />
            Undo
          </button>
          <button type="button" className="btn btn--ghost btn--sm" onClick={redo} disabled={!canRedo} aria-label="Redo (Ctrl/Command Shift Z)">
            <RedoIcon width={16} height={16} />
            Redo
          </button>

          {selectedRegion && (
            <>
              <span className="editor__divider" aria-hidden />
              <button type="button" className="btn btn--ghost btn--sm" onClick={deleteSelected} aria-label={`Delete blurred area ${doc.regions.indexOf(selectedRegion) + 1}`}>
                <TrashIcon width={16} height={16} />
                Delete area
              </button>
            </>
          )}

          <span className="editor__divider" aria-hidden />
          <button type="button" className="btn btn--danger-ghost btn--sm" onClick={handleReset} aria-label="Start over with a new image">
            Start over
          </button>

          <span className="editor__spacer" aria-hidden />

          <div className="download-group">
            <select
              className="format-select"
              value={format}
              aria-label="Export format"
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
            >
              <option value="png">{FORMAT_LABELS.png}</option>
              <option value="jpeg">{FORMAT_LABELS.jpeg}</option>
              <option value="webp" disabled={!webpSupported}>
                {FORMAT_LABELS.webp}
                {!webpSupported ? " (unsupported)" : ""}
              </option>
            </select>
            <button type="button" className="btn btn--primary" onClick={onDownload} disabled={exporting} aria-label="Download the blurred image">
              {exporting ? (
                <>
                  <span className="spinner" aria-hidden style={{ width: 16, height: 16 }} />
                  Preparing…
                </>
              ) : downloadFeedback === "done" ? (
                <>
                  <CheckIcon width={16} height={16} />
                  Downloaded
                </>
              ) : (
                <>
                  <DownloadIcon width={17} height={17} />
                  Download image
                </>
              )}
            </button>
          </div>
        </div>

        <div className="editor__stage" ref={stageRef}>
          <div
            className="editor__frame"
            style={{ width: display.w || undefined, height: display.h || undefined }}
          >
            <canvas ref={canvasRef} className="editor__canvas" aria-hidden />
            <div
              ref={overlayRef}
              className="editor__overlay"
              style={{ width: display.w || undefined, height: display.h || undefined }}
              onPointerDown={onOverlayPointerDown}
              onPointerMove={onOverlayPointerMove}
              onPointerUp={endInteraction}
              onPointerCancel={endInteraction}
            >
              {draftUI && (
                <div
                  className="region--draft"
                  role="presentation"
                  style={{
                    left: Math.min(draftUI.x0, draftUI.x1),
                    top: Math.min(draftUI.y0, draftUI.y1),
                    width: Math.abs(draftUI.x1 - draftUI.x0),
                    height: Math.abs(draftUI.y1 - draftUI.y0),
                  }}
                />
              )}
              {doc.regions.map((region, i) => {
                const rect = normalizedToDisplay(region, display.w, display.h);
                const isSelected = region.id === selectedId;
                return (
                  <div
                    key={region.id}
                    className={`region ${isSelected ? "is-selected" : ""}`}
                    data-id={region.id}
                    tabIndex={0}
                    role="img"
                    aria-label={`Blurred area ${i + 1} of ${doc.regions.length}`}
                    style={{ left: rect.x, top: rect.y, width: rect.w, height: rect.h }}
                    onFocus={(e) => {
                      e.stopPropagation();
                      select(region.id);
                    }}
                  >
                    {isSelected &&
                      HANDLES.map((handle) => (
                        <span
                          key={handle}
                          className={`handle handle--${handle}`}
                          data-handle={handle}
                          data-region-id={region.id}
                          role="presentation"
                        />
                      ))}
                  </div>
                );
              })}
            </div>
            <div className={`editor__hint ${doc.regions.length === 0 && !draftUI ? "" : "is-hidden"}`} aria-hidden={doc.regions.length > 0 || !!draftUI}>
              <div className="editor__hint-inner">
                <span aria-hidden style={{ fontSize: 15 }}>&#9998;</span>
                Draw over anything you want to hide
              </div>
            </div>
          </div>
        </div>

        <div className="editor__controls">
          <div className="editor__controls-row">
            <div className="strength">
              <span className="strength__label" id="strength-label">
                <span>Blur strength</span>
                <span className="strength__value">{strengthValue}</span>
              </span>
              <input
                type="range"
                className="strength__input"
                min={0}
                max={100}
                step={1}
                value={strengthValue}
                aria-labelledby="strength-label"
                aria-valuetext={`Blur strength ${strengthValue} out of 100`}
                style={{ "--range-progress": `${strengthValue}%` } as CSSProperties}
                onPointerDown={startGesture}
                onKeyDown={startGesture}
                onChange={(e) => onStrengthChange(Number(e.target.value))}
                onPointerUp={startGesture}
              />
              <div className="strength__track-labels">
                <span>Soft</span>
                <span>Strong</span>
              </div>
            </div>

            <div className="editor__controls-row--between" style={{ flex: 1, minWidth: 200 }}>
              <span className="editor__tip">{tip}</span>
              <span className="trust-note" style={{ fontSize: "var(--text-xs)" }}>
                <LockIcon width={13} height={13} />
                Your image stays on your device
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="sr-only" role="status" aria-live="polite">
        {status}
      </div>
    </div>
  );
}
"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import type { LoadedImage } from "@/lib/image/types";
import type { ImageErrorInfo } from "@/lib/image/validation";
import { loadImageFile } from "@/lib/image/validation";
import { ImageUploader } from "./image-uploader";
import { ConfirmDialog } from "./confirm-dialog";
import { LockIcon } from "./icons";

const Editor = dynamic(() => import("./editor").then((m) => m.Editor), {
  ssr: false,
  loading: () => (
    <div className="tool-shell">
      <div className="centered-box" role="status">
        <div className="spinner" aria-hidden />
        <span>Preparing editor…</span>
      </div>
    </div>
  ),
});

interface ToolState {
  phase: "idle" | "loading" | "editing";
  source: LoadedImage | null;
  error: string | null;
  confirmReplaceOpen: boolean;
  instanceKey: number;
}

export function Tool() {
  const [state, setState] = useState<ToolState>({
    phase: "idle",
    source: null,
    error: null,
    confirmReplaceOpen: false,
    instanceKey: 0,
  });
  const phaseRef = useRef(state.phase);
  const sourceRef = useRef(state.source);

  useEffect(() => {
    phaseRef.current = state.phase;
    sourceRef.current = state.source;
  }, [state.phase, state.source]);

  const pendingFileRef = useRef<File | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, error: null, phase: "loading" }));
    try {
      const loaded = await loadImageFile(file);
      setState((s) => {
        if (s.source?.bitmap && s.source.bitmap !== loaded.bitmap) {
          s.source.bitmap.close();
        }
        return { ...s, phase: "editing", source: loaded, error: null, instanceKey: s.instanceKey + 1 };
      });
    } catch (err) {
      const info = err as ImageErrorInfo;
      setState((s) => ({ ...s, phase: "idle", error: info.message }));
    }
  }, []);

  const handleError = useCallback((msg: string) => {
    setState((s) => ({ ...s, error: msg }));
  }, []);

  // Full reset back to the uploader.
  const resetToUpload = useCallback(() => {
    pendingFileRef.current = null;
    setState((s) => {
      if (s.source) s.source.bitmap.close();
      return { phase: "idle", source: null, error: null, confirmReplaceOpen: false, instanceKey: s.instanceKey };
    });
  }, []);

  // After confirming a replacement, load the pending file.
  const applyPendingFile = useCallback(() => {
    const file = pendingFileRef.current;
    pendingFileRef.current = null;
    setState((s) => {
      if (s.source) s.source.bitmap.close();
      return { phase: "idle", source: null, error: null, confirmReplaceOpen: false, instanceKey: s.instanceKey };
    });
    if (file) handleFile(file);
  }, [handleFile]);

  // Paste handling on the window — works while viewing the uploader or the editor.
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const files = e.clipboardData?.files;
      if (!files) return;
      const imgFile = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (!imgFile) {
        setState((s) => ({ ...s, error: "There's no image in your clipboard." }));
        return;
      }
      if (phaseRef.current === "editing" && sourceRef.current) {
        pendingFileRef.current = imgFile;
        setState((s) => ({ ...s, confirmReplaceOpen: true }));
        return;
      }
      handleFile(imgFile);
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [handleFile]);

  // Drag & drop onto the whole window.
  const [draggingFile, setDraggingFile] = useState(false);
  const dragDepth = useRef(0);

  useEffect(() => {
    function onDragEnter(e: DragEvent) {
      e.preventDefault();
      if (dragDepth.current === 0) setDraggingFile(true);
      dragDepth.current += 1;
    }
    function onDragOver(e: DragEvent) {
      e.preventDefault();
    }
    function onDragLeave() {
      dragDepth.current -= 1;
      if (dragDepth.current <= 0) {
        dragDepth.current = 0;
        setDraggingFile(false);
      }
    }
    function onDrop(e: DragEvent) {
      e.preventDefault();
      dragDepth.current = 0;
      setDraggingFile(false);
      const files = e.dataTransfer?.files;
      if (!files) return;
      const imgFile = Array.from(files).find((f) => f.type.startsWith("image/"));
      if (!imgFile) return;
      if (phaseRef.current === "editing" && sourceRef.current) {
        pendingFileRef.current = imgFile;
        setState((s) => ({ ...s, confirmReplaceOpen: true }));
        return;
      }
      handleFile(imgFile);
    }
    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("drop", onDrop);
    };
  }, [handleFile]);

  return (
    <>
      {state.phase === "loading" && (
        <div className="tool-shell">
          <div className="centered-box" role="status">
            <div className="spinner" aria-hidden />
            <span>Preparing image…</span>
          </div>
        </div>
      )}

      {state.phase === "idle" && (
        <ImageUploader
          onFileSelected={handleFile}
          error={state.error}
          onError={handleError}
          dismissError={() => setState((s) => ({ ...s, error: null }))}
        />
      )}

      {state.phase === "editing" && state.source && (
        <Editor key={state.instanceKey} source={state.source} onReset={resetToUpload} />
      )}

      {state.confirmReplaceOpen && (
        <ConfirmDialog
          title="Replace this image?"
          description="Opening a new image will discard your current blur edits."
          confirmLabel="Replace image"
          cancelLabel="Keep current image"
          onConfirm={applyPendingFile}
          onCancel={() => {
            pendingFileRef.current = null;
            setState((s) => ({ ...s, confirmReplaceOpen: false }));
          }}
        />
      )}

      {draggingFile && (
        <div className="drop-overlay" aria-hidden>
          <div className="drop-overlay__inner">
            <LockIcon width={16} height={16} />
            Drop image to open
          </div>
        </div>
      )}

      <div className="sr-only" role="status" aria-live="polite">
        {state.error || ""}
      </div>
    </>
  );
}
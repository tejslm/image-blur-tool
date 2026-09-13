"use client";

import { useCallback, useRef, useState } from "react";
import { AlertIcon, LockIcon, UploadIcon } from "./icons";

interface ImageUploaderProps {
  onFileSelected: (file: File) => void;
  error: string | null;
  onError: (message: string) => void;
  dismissError: () => void;
}

export function ImageUploader({ onFileSelected, error, onError, dismissError }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const openPicker = useCallback(() => {
    inputRef.current?.click();
  }, []);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      const file = files[0];
      if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp)$/i.test(file.name)) {
        onError("This image format isn't supported. Try PNG, JPG, or WebP.");
        return;
      }
      onFileSelected(file);
    },
    [onFileSelected, onError]
  );

  return (
    <div className="tool-shell">
      <div
        className={`dropzone ${isDragging ? "is-dragging" : ""} ${error ? "has-error" : ""}`}
        role="button"
        tabIndex={0}
        aria-label="Choose an image to blur"
        aria-describedby="upload-formats upload-privacy"
        onClick={openPicker}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            openPicker();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          dragDepth.current += 1;
          setIsDragging(true);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          dragDepth.current -= 1;
          if (dragDepth.current <= 0) {
            dragDepth.current = 0;
            setIsDragging(false);
          }
        }}
        onDrop={(e) => {
          e.preventDefault();
          dragDepth.current = 0;
          setIsDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <span className="dropzone__icon" aria-hidden>
          <UploadIcon width={22} height={22} />
        </span>
        <p className="dropzone__title">Drop an image here</p>
        <span className="dropzone__or">or</span>
        <button type="button" className="btn btn--primary" onClick={(e) => {
          e.stopPropagation();
          openPicker();
        }}>
          Choose an image
        </button>
        <div className="dropzone__meta" id="upload-formats">
          <span className="inline-tag">JPG</span>
          <span className="inline-tag">PNG</span>
          <span className="inline-tag">WebP</span>
        </div>
      </div>

      <p className="trust-note" id="upload-privacy" style={{ marginTop: 16 }}>
        <LockIcon width={14} height={14} />
        Your image stays on your device
      </p>

      {error && (
        <div className="notice" role="alert">
          <AlertIcon width={16} height={16} />
          <span>{error}</span>
          <button type="button" onClick={dismissError} aria-label="Dismiss message">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}
"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel }: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    lastFocused.current = document.activeElement as HTMLElement | null;
    confirmRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }
      if (e.key === "Tab") {
        const focusables = dialogRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      lastFocused.current?.focus();
    };
  }, [onCancel]);

  return createPortal(
    <div
      className="dialog-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        className="dialog"
      >
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-desc">{description}</p>
        <div className="dialog__actions">
          <button type="button" className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button ref={confirmRef} type="button" className="btn btn--danger-ghost" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
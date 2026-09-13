"use client";

import { useCallback, useReducer, useState } from "react";
import type { BlurRegion, BlurShape, RegionId } from "@/lib/image/types";
import { DEFAULT_STRENGTH } from "@/lib/image/geometry";

export interface EditorDoc {
  regions: BlurRegion[];
  /** Strength (0..100) used for the next region a user draws. */
  defaultStrength: number;
  /** Shape used for the next region a user draws. */
  defaultShape: BlurShape;
}

interface HistoryState {
  doc: EditorDoc;
  undo: EditorDoc[];
  redo: EditorDoc[];
  snapshotted: boolean;
}

type DocAction =
  | { type: "mutate"; updater: (d: EditorDoc) => EditorDoc }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "reset" }
  | { type: "start-gesture" };

const MAX_UNDO = 60;
const emptyDoc: EditorDoc = { regions: [], defaultStrength: DEFAULT_STRENGTH, defaultShape: "rect" };

function cloneDoc(doc: EditorDoc): EditorDoc {
  return {
    regions: doc.regions.map((r) => ({ ...r })),
    defaultStrength: doc.defaultStrength,
    defaultShape: doc.defaultShape,
  };
}

function historyReducer(state: HistoryState, action: DocAction): HistoryState {
  switch (action.type) {
    case "mutate": {
      if (state.snapshotted) {
        return { ...state, doc: action.updater(state.doc) };
      }
      return {
        doc: action.updater(state.doc),
        undo: [...state.undo, cloneDoc(state.doc)].slice(-MAX_UNDO),
        redo: [],
        snapshotted: true,
      };
    }
    case "undo": {
      if (state.undo.length === 0) return state;
      const prev = state.undo[state.undo.length - 1];
      return {
        doc: prev,
        undo: state.undo.slice(0, -1),
        redo: [...state.redo, cloneDoc(state.doc)].slice(-MAX_UNDO),
        snapshotted: false,
      };
    }
    case "redo": {
      if (state.redo.length === 0) return state;
      const next = state.redo[state.redo.length - 1];
      return {
        doc: next,
        undo: [...state.undo, cloneDoc(state.doc)].slice(-MAX_UNDO),
        redo: state.redo.slice(0, -1),
        snapshotted: true,
      };
    }
    case "reset":
      return { doc: cloneDoc(emptyDoc), undo: [], redo: [], snapshotted: false };
    case "start-gesture":
      return state.snapshotted === false ? state : { ...state, snapshotted: false };
    default:
      return state;
  }
}

interface UseEditorDocResult {
  doc: EditorDoc;
  selectedId: RegionId | null;
  setSelectedId: (id: RegionId | null) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  startGesture: () => void;
  reset: () => void;
  updateRegion: (id: RegionId, patch: Partial<BlurRegion>) => void;
  removeRegion: (id: RegionId) => void;
  addRegion: (region: BlurRegion) => void;
  setDefaultStrength: (s: number) => void;
  setDefaultShape: (s: BlurShape) => void;
}

export function useEditorDoc(): UseEditorDocResult {
  const [state, dispatch] = useReducer(historyReducer, emptyDoc, (doc) => ({
    doc,
    undo: [],
    redo: [],
    snapshotted: false,
  }));
  const [selectedId, setSelectedId] = useState<RegionId | null>(null);

  const updateRegion = useCallback((id: RegionId, patch: Partial<BlurRegion>) => {
    dispatch({
      type: "mutate",
      updater: (prev) => ({
        ...prev,
        regions: prev.regions.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      }),
    });
  }, []);

  const removeRegion = useCallback((id: RegionId) => {
    dispatch({
      type: "mutate",
      updater: (prev) => ({
        ...prev,
        regions: prev.regions.filter((r) => r.id !== id),
      }),
    });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, []);

  const addRegion = useCallback((region: BlurRegion) => {
    dispatch({
      type: "mutate",
      updater: (prev) => ({
        ...prev,
        regions: [...prev.regions, region],
      }),
    });
    setSelectedId(region.id);
  }, []);

  const setDefaultStrength = useCallback((s: number) => {
    const clamped = Math.min(Math.max(s, 0), 100);
    dispatch({
      type: "mutate",
      updater: (prev) => ({ ...prev, defaultStrength: clamped }),
    });
  }, []);

  const setDefaultShape = useCallback((s: BlurShape) => {
    dispatch({
      type: "mutate",
      updater: (prev) => ({ ...prev, defaultShape: s }),
    });
  }, []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);
  const startGesture = useCallback(() => dispatch({ type: "start-gesture" }), []);
  const reset = useCallback(() => dispatch({ type: "reset" }), []);

  return {
    doc: state.doc,
    selectedId,
    setSelectedId,
    canUndo: state.undo.length > 0,
    canRedo: state.redo.length > 0,
    undo,
    redo,
    startGesture,
    reset,
    updateRegion,
    removeRegion,
    addRegion,
    setDefaultStrength,
    setDefaultShape,
  };
}
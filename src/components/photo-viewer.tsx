"use client";

import { useRef, useState, type PointerEvent } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/icon";
import { copyImage } from "@/lib/clipboard";

const SWIPE_PX = 40;
const COPIED_MS = 1800;

// Mockup renderLayer kind "foto" (K-T76): swipe or arrows, "2 / 3", close with X or a tap outside.
export function PhotoViewer({ sources, start, onClose }: { sources: string[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [copyState, setCopyState] = useState<"idle" | "done" | "failed">("idle");
  const swipeFrom = useRef<number | null>(null);
  const root = document.getElementById("app");
  if (!root) return null;

  const total = sources.length;
  const go = (step: number) => setIndex((current) => Math.max(0, Math.min(total - 1, current + step)));

  // CHANGELOG 54: copies the photo on screen. The result shows on the button, since the viewer
  // covers the toast.
  async function copy() {
    const copied = await copyImage(sources[index] ?? "");
    setCopyState(copied ? "done" : "failed");
    setTimeout(() => setCopyState("idle"), COPIED_MS);
  }

  function endSwipe(event: PointerEvent) {
    if (swipeFrom.current === null) return;
    const distance = event.clientX - swipeFrom.current;
    swipeFrom.current = null;
    if (Math.abs(distance) > SWIPE_PX) go(distance < 0 ? 1 : -1);
  }

  return createPortal(
    <div
      className="layer fv"
      role="dialog"
      aria-label={`Foto ${index + 1} dari ${total}`}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <button className="fv-x" onClick={onClose} aria-label="Tutup foto">
        <Icon name="x" size={22} />
      </button>
      <button className="fv-copy" onClick={copy}>
        <Icon name="copy" size={16} />
        {copyState === "done" ? "Foto disalin" : copyState === "failed" ? "Tidak bisa disalin" : "Salin foto"}
      </button>
      <div
        className="fv-img"
        onPointerDown={(event) => {
          swipeFrom.current = event.clientX;
        }}
        onPointerUp={endSwipe}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- private, access-checked route */}
        <img src={sources[index]} alt={`Foto ${index + 1}`} draggable={false} />
      </div>
      {total > 1 && (
        <>
          <button className="fv-nav l" onClick={() => go(-1)} disabled={index === 0} aria-label="Foto sebelumnya">
            <Icon name="chevL" size={22} />
          </button>
          <button className="fv-nav r" onClick={() => go(1)} disabled={index === total - 1} aria-label="Foto berikutnya">
            <Icon name="chevR" size={22} />
          </button>
        </>
      )}
      <div className="fv-c">
        {index + 1} / {total}
      </div>
    </div>,
    root,
  );
}

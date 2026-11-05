"use client";

import { useState, type ReactNode } from "react";

import { PhotoViewer } from "@/components/photo-viewer";

// Mockup fotoThumbs. `children` is the add button on forms.
export function PhotoThumbs({ sources, children }: { sources: string[]; children?: ReactNode }) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  return (
    <div className="fotos">
      {sources.map((source, index) => (
        <button
          key={source}
          className="foto fbtn"
          onClick={() => setOpenAt(index)}
          aria-label={`Lihat foto ${index + 1} dari ${sources.length}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- private, access-checked route */}
          <img src={source} alt="" />
        </button>
      ))}
      {children}
      {openAt !== null && <PhotoViewer sources={sources} start={openAt} onClose={() => setOpenAt(null)} />}
    </div>
  );
}

export const photoUrl = (id: string) => `/api/photos/${id}`;

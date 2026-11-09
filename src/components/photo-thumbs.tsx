"use client";

import { useState, type ReactNode } from "react";

import { Icon } from "@/components/icon";
import { PhotoViewer } from "@/components/photo-viewer";

// Mockup fotoThumbs. `children` is the add button on forms. `onRemove` adds an X to photos not sent yet.
export function PhotoThumbs({
  sources,
  children,
  onRemove,
}: {
  sources: string[];
  children?: ReactNode;
  onRemove?: (index: number) => void;
}) {
  const [openAt, setOpenAt] = useState<number | null>(null);
  return (
    <div className="fotos">
      {sources.map((source, index) => {
        const thumb = (
          <button
            key={source}
            className="foto fbtn"
            onClick={() => setOpenAt(index)}
            aria-label={`Lihat foto ${index + 1} dari ${sources.length}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- private, access-checked route */}
            <img src={source} alt="" />
          </button>
        );
        if (!onRemove) return thumb;
        return (
          <div key={source} className="foto-wrap">
            {thumb}
            <button className="foto-rm" onClick={() => onRemove(index)} aria-label={`Hapus foto ${index + 1}`}>
              <Icon name="x" size={12} />
            </button>
          </div>
        );
      })}
      {children}
      {openAt !== null && <PhotoViewer sources={sources} start={openAt} onClose={() => setOpenAt(null)} />}
    </div>
  );
}

export const photoUrl = (id: string) => `/api/photos/${id}`;

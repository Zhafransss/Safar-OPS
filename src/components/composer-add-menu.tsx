"use client";

import { useEffect, useRef, useState } from "react";

import { Icon } from "@/components/icon";
import type { IconName } from "@/components/icons";

type Choice = { icon: IconName; label: string; onPick: () => void };

// CHANGELOG 59: one + button beside the message box. It opens a menu above it to take a photo, pick
// photos from the gallery, or attach a file; while open the + turns into an X.
export function ComposerAddMenu({
  onCamera,
  onGallery,
  onFile,
}: {
  onCamera: () => void;
  onGallery: () => void;
  onFile: () => void;
}) {
  const [open, setOpen] = useState(false);
  // Browsers open the camera directly only on phones and tablets; elsewhere it would be a second
  // file picker, so the choice is left out there.
  const [hasCamera, setHasCamera] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasCamera(window.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Closes on a touch outside the menu or on Escape.
  useEffect(() => {
    if (!open) return;
    const outside = (event: Event) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  const choices: Choice[] = [
    ...(hasCamera ? [{ icon: "cam" as const, label: "Kamera", onPick: onCamera }] : []),
    { icon: "image", label: "Galeri", onPick: onGallery },
    { icon: "paperclip", label: "Lampirkan file", onPick: onFile },
  ];

  return (
    <div className="add-menu-wrap" ref={root}>
      {open && (
        <div className="add-menu" role="menu">
          {choices.map((choice) => (
            <button
              key={choice.label}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                choice.onPick();
              }}
            >
              <span className="add-menu-ico">
                <Icon name={choice.icon} size={18} />
              </span>
              {choice.label}
            </button>
          ))}
        </div>
      )}
      <button
        className={`icbtn add-btn ${open ? "is-open" : ""}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? "Tutup pilihan" : "Tambah foto atau file"}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="plus" size={20} />
      </button>
    </div>
  );
}

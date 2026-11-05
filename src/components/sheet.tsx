"use client";

import type { ReactNode } from "react";
import { createPortal } from "react-dom";

import { Icon } from "@/components/icon";

export type SheetAction = { label: string; variant?: "sec" | "warn"; onClick: () => void; disabled?: boolean };

// Mockup renderLayer: bottom sheet with a title, close button and action row.
// Portaled to #app like the mockup layers: headers set white text and .hd is sticky,
// so rendering in place would inherit that color and trap the sheet inside the header.
export function Sheet({
  title,
  onClose,
  actions = [],
  children,
}: {
  title: string;
  onClose: () => void;
  actions?: SheetAction[];
  children: ReactNode;
}) {
  const root = document.getElementById("app");
  if (!root) return null;

  return createPortal(
    <div className="layer">
      <div className="sheet" role="dialog" aria-label={title}>
        <div className="sh-h">
          <b>{title}</b>
          <button className="x" onClick={onClose} aria-label="Tutup">
            <Icon name="x" />
          </button>
        </div>
        {children}
        {actions.length > 0 && (
          <div className="btns mt2">
            {actions.map((action) => (
              <button
                key={action.label}
                className={`btn ${action.variant ?? ""}`}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>,
    root,
  );
}

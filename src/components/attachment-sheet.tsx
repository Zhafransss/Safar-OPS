"use client";

import { useEffect, useState, type ReactNode } from "react";

import { Sheet } from "@/components/sheet";

// CHANGELOG 58: on an iPhone, following a download link takes the installed app to iOS's own file
// screen, which has no way back. There the attachment opens in this sheet instead: it closes with X,
// and the share sheet opens or saves the file (Files, Word, print, WhatsApp).
export function opensInSheet(): boolean {
  if (typeof navigator === "undefined") return false;
  const iPadAsMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || iPadAsMac;
}

export function AttachmentSheet({
  href,
  fileName,
  children,
  onClose,
}: {
  href: string;
  fileName: string;
  children: ReactNode;
  onClose: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [failed, setFailed] = useState(false);

  // Fetched as soon as the sheet opens, so the share sheet can open at the tap.
  useEffect(() => {
    let current = true;
    fetch(href)
      .then((response) => (response.ok ? response.blob() : Promise.reject(new Error(String(response.status)))))
      .then((blob) => current && setFile(new File([blob], fileName, { type: blob.type })))
      .catch(() => current && setFailed(true));
    return () => {
      current = false;
    };
  }, [href, fileName]);

  async function share() {
    if (!file) return;
    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({ files: [file] }).catch(() => {});
      return;
    }
    // No share sheet: hand the file over as a download from memory, which stays in the app.
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }

  return (
    <Sheet
      title="Lampiran"
      onClose={onClose}
      actions={[
        {
          label: failed ? "File tidak bisa dimuat" : file ? "Buka atau simpan" : "Menyiapkan file…",
          onClick: share,
          disabled: !file,
        },
      ]}
    >
      <div className="attach attach-sheet">{children}</div>
    </Sheet>
  );
}

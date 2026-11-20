"use client";

import { useEffect, useState } from "react";

import { Icon } from "@/components/icon";
import { THEME_KEY } from "@/lib/theme";

// The theme in effect: the saved pick if any, otherwise the device setting.
function isDark(): boolean {
  const picked = document.documentElement.dataset.theme;
  if (picked === "dark" || picked === "light") return picked === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

// CHANGELOG 47: switches between light and dark beside the bell. The CSS already defines both themes
// for an explicit data-theme on <html>; the pick is kept on this device only.
export function ThemeToggle() {
  // Unknown until mounted, since the server cannot see the device setting or the saved pick.
  const [dark, setDark] = useState<boolean | null>(null);

  useEffect(() => {
    setDark(isDark());
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const follow = () => setDark(isDark());
    media.addEventListener("change", follow);
    return () => media.removeEventListener("change", follow);
  }, []);

  function toggle() {
    const next = isDark() ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Private browsing may refuse storage; the switch still works until the page closes.
    }
    setDark(next === "dark");
  }

  return (
    <button className="bell" onClick={toggle} aria-label={dark ? "Ganti ke mode terang" : "Ganti ke mode gelap"}>
      <Icon name={dark ? "sun" : "moon"} size={18} />
    </button>
  );
}

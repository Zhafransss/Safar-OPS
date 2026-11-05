"use client";

import { useEffect } from "react";

// Production only: a service worker in dev would serve stale bundles.
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // The app works without it; only the install and offline page are lost.
    });
  }, []);
  return null;
}

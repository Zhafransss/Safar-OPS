"use client";

import { useEffect } from "react";

// CHANGELOG 25: the app does not zoom. Safari iOS ignores user-scalable=no in the viewport, so the
// pinch gesture is cancelled here; touch-action in app.css stops the double-tap zoom.
export function NoZoom() {
  useEffect(() => {
    const cancel = (event: Event) => event.preventDefault();
    const cancelPinch = (event: TouchEvent) => {
      if (event.touches.length > 1) event.preventDefault();
    };
    // gesture* events exist only in WebKit; elsewhere these listeners never fire.
    for (const type of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(type, cancel);
    document.addEventListener("touchmove", cancelPinch, { passive: false });
    return () => {
      for (const type of ["gesturestart", "gesturechange", "gestureend"]) document.removeEventListener(type, cancel);
      document.removeEventListener("touchmove", cancelPinch);
    };
  }, []);
  return null;
}

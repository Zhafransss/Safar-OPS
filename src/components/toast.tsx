"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const TOAST_MS = 3200;

const ToastContext = createContext<(message: string) => void>(() => {});

export function useToast() {
  return useContext(ToastContext);
}

// Lives above the pages so a toast survives the redirect after saving, as in the mockup.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(null), TOAST_MS);
  }, []);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  const value = useMemo(() => show, [show]);
  const root = message ? document.getElementById("app") : null;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {root &&
        createPortal(
          <div className="toast" role="status">
            {message}
          </div>,
          root,
        )}
    </ToastContext.Provider>
  );
}

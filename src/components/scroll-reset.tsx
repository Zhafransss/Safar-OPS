"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// #scr stays mounted across routes, so Next.js cannot restore its position. Mockup toTop.
export function ScrollReset() {
  const pathname = usePathname();
  useEffect(() => {
    document.getElementById("scr")?.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

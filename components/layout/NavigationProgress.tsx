"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

export default function NavigationProgress() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Navigation complete → fill bar then fade
  useEffect(() => {
    clearTimeout(timerRef.current);
    setProgress(100);
    timerRef.current = setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 400);
  }, [pathname]);

  // Detect link clicks → start bar
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a[href]") as HTMLAnchorElement | null;
      if (!link) return;
      const href = link.getAttribute("href") ?? "";
      if (href.startsWith("http") || href.startsWith("#") || href === pathname) return;
      clearTimeout(timerRef.current);
      setVisible(true);
      setProgress(25);
      timerRef.current = setTimeout(() => setProgress(65), 180);
    };
    document.addEventListener("click", handleClick);
    return () => {
      document.removeEventListener("click", handleClick);
      clearTimeout(timerRef.current);
    };
  }, [pathname]);

  if (!visible && progress === 0) return null;

  return (
    <div
      className="pointer-events-none fixed left-0 top-0 z-[9999] h-[3px] bg-blue"
      style={{
        width: `${progress}%`,
        opacity: visible ? 1 : 0,
        transition: visible
          ? "width 300ms ease"
          : "opacity 300ms ease, width 200ms ease",
      }}
    />
  );
}

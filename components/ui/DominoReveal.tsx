"use client";

import { useEffect, useRef, type ReactNode } from "react";

const PASO_MS = 90;
const MAX_ESCALONES = 14;

// Hace aparecer en cascada, de una en una, los elementos marcados con data-reveal
// (también los que se agregan después, por ejemplo al cambiar de pestaña).
export default function DominoReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const animar = (items: Element[]) =>
      items.forEach((el, i) => {
        const h = el as HTMLElement;
        if (h.classList.contains("rv")) return;
        h.style.setProperty("--rv-delay", `${Math.min(i, MAX_ESCALONES) * PASO_MS}ms`);
        h.classList.add("rv");
      });

    const buscar = (nodo: Node): Element[] => {
      if (!(nodo instanceof Element)) return [];
      return [...(nodo.matches("[data-reveal]") ? [nodo] : []), ...nodo.querySelectorAll("[data-reveal]")];
    };

    animar([...root.querySelectorAll("[data-reveal]")]);

    const observer = new MutationObserver((mutaciones) => {
      const nuevos = mutaciones.flatMap((m) => [...m.addedNodes].flatMap(buscar));
      if (nuevos.length) animar(nuevos);
    });
    observer.observe(root, { childList: true, subtree: true });

    // Resplandor de las cards: la posición del cursor queda en --mx / --my del elemento [data-spot]
    const seguirCursor = (e: PointerEvent) => {
      const card = (e.target as Element).closest?.("[data-spot]") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    };
    root.addEventListener("pointermove", seguirCursor);

    return () => {
      observer.disconnect();
      root.removeEventListener("pointermove", seguirCursor);
    };
  }, []);

  return <div ref={ref} className="h-full">{children}</div>;
}

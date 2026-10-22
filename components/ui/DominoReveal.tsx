"use client";

import { useEffect, useRef, type ReactNode } from "react";

const PASO_MS = 50;
const MAX_ESCALONES = 12;

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

    // Elementos a animar: los marcados con data-reveal y los hijos directos de un data-reveal-group
    const buscar = (nodo: Node): Element[] => {
      if (!(nodo instanceof Element)) return [];
      const propios = nodo.matches("[data-reveal]") ? [nodo] : [];
      const enGrupo = nodo.parentElement?.hasAttribute("data-reveal-group") ? [nodo] : [];
      return [...propios, ...enGrupo, ...nodo.querySelectorAll("[data-reveal], [data-reveal-group] > *")];
    };
    const existentes = () => [
      ...root.querySelectorAll("[data-reveal]"),
      ...root.querySelectorAll("[data-reveal-group] > *"),
    ];

    animar([...existentes()]);

    const observer = new MutationObserver((mutaciones) => {
      const nuevos = mutaciones.flatMap((m) => [...m.addedNodes].flatMap(buscar));
      if (nuevos.length) animar(nuevos);
    });
    observer.observe(root, { childList: true, subtree: true });

    // Resplandor de las cards: la posición del cursor queda en --mx / --my del elemento [data-spot]
    // Se calcula como máximo una vez por frame: los eventos de puntero llegan más seguido que la pantalla
    let frame = 0;
    let ultimo: PointerEvent | null = null;
    const seguirCursor = () => {
      frame = 0;
      if (!ultimo) return;
      const card = (ultimo.target as Element).closest?.("[data-spot]") as HTMLElement | null;
      if (!card) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${ultimo.clientX - r.left}px`);
      card.style.setProperty("--my", `${ultimo.clientY - r.top}px`);
    };
    const alMover = (e: PointerEvent) => {
      ultimo = e;
      if (!frame) frame = requestAnimationFrame(seguirCursor);
    };
    root.addEventListener("pointermove", alMover);

    return () => {
      observer.disconnect();
      root.removeEventListener("pointermove", alMover);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="h-full">{children}</div>;
}

"use client";

import { useEffect, useRef, type ReactNode } from "react";

const PASO_MS = 50;
const MAX_ESCALONES = 12;

// Hace aparecer en cascada los elementos marcados con data-reveal (y los hijos de un data-reveal-group).
// Cada uno anima recién cuando entra en pantalla: lo que está debajo del pliegue no consume nada hasta verse.
export default function DominoReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const pendientes = new Set<Element>();
    // Gráficos: su animación está pausada en CSS; al entrar en pantalla se reanuda
    const visorGrafico = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        visorGrafico.unobserve(e.target);
        pendientes.delete(e.target);
        e.target.setAttribute("data-en-vista", "");
      });
    }, { threshold: 0.2 });
    const visor = new IntersectionObserver((entradas) => {
      const visibles = entradas.filter((e) => e.isIntersecting).map((e) => e.target);
      visibles.forEach((el, i) => {
        visor.unobserve(el);
        pendientes.delete(el);
        const h = el as HTMLElement;
        h.style.opacity = "";
        h.style.setProperty("--rv-delay", `${Math.min(i, MAX_ESCALONES) * PASO_MS}ms`);
        h.classList.add("rv");
      });
    });

    // Oculto mientras espera, para que no se vea un parpadeo antes de la animación
    const observar = (items: Element[]) => items.forEach((el) => {
      if (el.hasAttribute("data-lazy-anim")) {
        if (!el.hasAttribute("data-en-vista") && !pendientes.has(el)) {
          pendientes.add(el);
          visorGrafico.observe(el);
        }
        return;
      }
      if (el.classList.contains("rv") || pendientes.has(el)) return;
      pendientes.add(el);
      (el as HTMLElement).style.opacity = "0";
      visor.observe(el);
    });

    const buscar = (nodo: Node): Element[] => {
      if (!(nodo instanceof Element)) return [];
      const propios = nodo.matches("[data-reveal], [data-lazy-anim]") ? [nodo] : [];
      const enGrupo = nodo.parentElement?.hasAttribute("data-reveal-group") ? [nodo] : [];
      return [...propios, ...enGrupo, ...nodo.querySelectorAll("[data-reveal], [data-reveal-group] > *, [data-lazy-anim]")];
    };

    observar([
      ...root.querySelectorAll("[data-reveal]"),
      ...root.querySelectorAll("[data-reveal-group] > *"),
      ...root.querySelectorAll("[data-lazy-anim]"),
    ]);

    const observer = new MutationObserver((mutaciones) => {
      const nuevos = mutaciones.flatMap((m) => [...m.addedNodes].flatMap(buscar));
      if (nuevos.length) observar(nuevos);
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
      const x = ultimo.clientX - r.left, y = ultimo.clientY - r.top;
      card.style.setProperty("--mx", `${x}px`);
      card.style.setProperty("--my", `${y}px`);
      // Inclinación 3D leve hacia el cursor (solo visible con .depth:hover)
      card.style.setProperty("--ty", `${(x / r.width - 0.5) * 6}deg`);
      card.style.setProperty("--tx", `${(y / r.height - 0.5) * -4}deg`);
    };
    const alMover = (e: PointerEvent) => {
      ultimo = e;
      if (!frame) frame = requestAnimationFrame(seguirCursor);
    };
    root.addEventListener("pointermove", alMover);

    return () => {
      observer.disconnect();
      visor.disconnect();
      visorGrafico.disconnect();
      root.removeEventListener("pointermove", alMover);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <div ref={ref} className="h-full">{children}</div>;
}

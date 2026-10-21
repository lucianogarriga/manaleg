"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { todayISO } from "@/utils/formatters";

interface DateInputProps {
  name?: string;
  id?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (e: { target: { value: string } }) => void;
  required?: boolean;
  min?: string;
  max?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
  "aria-label"?: string;
}

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
const DIAS = ["L", "M", "X", "J", "V", "S", "D"];
const ANCHO_POPOVER = 280;
const ALTO_POPOVER = 318;

function partes(iso: string): { y: number; m: number; d: number } | null {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? { y, m, d } : null;
}

function aIso(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function formatear(iso: string): string {
  const p = partes(iso);
  return p ? `${String(p.d).padStart(2, "0")}/${String(p.m).padStart(2, "0")}/${p.y}` : "";
}

// Calendario mensual con el mismo valor que un <input type="date"> (YYYY-MM-DD).
export default function DateInput({
  name, id, value, defaultValue, onChange, required, min, max, autoFocus, disabled, className, ...rest
}: DateInputProps) {
  const [interno, setInterno] = useState(defaultValue ?? "");
  const actual = value !== undefined ? value : interno;
  const [abierto, setAbierto] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const [vista, setVista] = useState(() => partes(actual) ?? partes(todayISO())!);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = partes(actual);
    if (p) setVista({ y: p.y, m: p.m, d: p.d });
  }, [actual]);

  const elegir = (v: string) => {
    if (value === undefined) setInterno(v);
    onChange?.({ target: { value: v } });
  };

  const calcularPos = () => {
    const r = triggerRef.current?.getBoundingClientRect();
    if (!r) return;
    const izquierda = Math.min(Math.max(8, r.left), window.innerWidth - ANCHO_POPOVER - 8);
    const abajo = r.bottom + 6;
    const arriba = r.top - ALTO_POPOVER - 6;
    const top = abajo + ALTO_POPOVER > window.innerHeight && arriba > 8 ? arriba : abajo;
    setPos({ top, left: izquierda });
  };

  const abrir = () => {
    if (disabled) return;
    calcularPos();
    setAbierto(true);
  };

  useLayoutEffect(() => {
    if (!abierto) return;
    const cerrar = () => setAbierto(false);
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popRef.current?.contains(t)) return;
      cerrar();
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrar();
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", cerrar);
    window.addEventListener("scroll", cerrar, true);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", cerrar);
      window.removeEventListener("scroll", cerrar, true);
    };
  }, [abierto]);

  const mover = (delta: number) => {
    setVista((v) => {
      const total = v.y * 12 + (v.m - 1) + delta;
      return { y: Math.floor(total / 12), m: (total % 12) + 1, d: 1 };
    });
  };

  const primerDia = new Date(vista.y, vista.m - 1, 1).getDay();
  const offset = (primerDia + 6) % 7; // lunes primero
  const diasMes = new Date(vista.y, vista.m, 0).getDate();
  const celdas: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: diasMes }, (_, i) => i + 1),
  ];
  while (celdas.length % 7 !== 0) celdas.push(null);

  const hoy = todayISO();
  const seleccionado = partes(actual);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={id}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={rest["aria-label"]}
        aria-haspopup="dialog"
        aria-expanded={abierto}
        onClick={() => (abierto ? setAbierto(false) : abrir())}
        className={`${className ?? ""} flex w-full items-center justify-between gap-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60`}
      >
        <span className={actual ? "" : "text-muted"}>{actual ? formatear(actual) : "dd/mm/aaaa"}</span>
        <CalendarDays size={14} className="shrink-0 text-muted" aria-hidden />
      </button>

      {name && (
        <input
          type="text"
          name={name}
          value={actual}
          required={required}
          readOnly
          tabIndex={-1}
          aria-hidden
          className="pointer-events-none absolute h-px w-px opacity-0"
          onChange={() => undefined}
        />
      )}

      {abierto && pos && typeof document !== "undefined" && createPortal(
        <div
          ref={popRef}
          role="dialog"
          aria-label="Elegir fecha"
          className="fixed z-[10010] rounded-[12px] border border-border bg-card p-3 shadow-[0_8px_28px_rgba(0,0,0,.22)]"
          style={{ top: pos.top, left: pos.left, width: ANCHO_POPOVER }}
        >
          <div className="mb-2 flex items-center justify-between">
            <button type="button" onClick={() => mover(-1)} aria-label="Mes anterior"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] text-sub hover:bg-panel2">
              <ChevronLeft size={15} />
            </button>
            <span className="text-[13px] font-semibold capitalize text-text">{MESES[vista.m - 1]} {vista.y}</span>
            <button type="button" onClick={() => mover(1)} aria-label="Mes siguiente"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[6px] text-sub hover:bg-panel2">
              <ChevronRight size={15} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-[2px] pb-1 text-center text-[10px] font-bold uppercase text-muted">
            {DIAS.map((d) => <span key={d}>{d}</span>)}
          </div>

          <div className="grid grid-cols-7 gap-[2px]">
            {celdas.map((dia, i) => {
              if (dia === null) return <span key={`v${i}`} />;
              const iso = aIso(vista.y, vista.m, dia);
              const esSel = seleccionado && seleccionado.y === vista.y && seleccionado.m === vista.m && seleccionado.d === dia;
              const esHoy = iso === hoy;
              const fuera = (min && iso < min) || (max && iso > max);
              return (
                <button
                  key={iso}
                  type="button"
                  disabled={!!fuera}
                  aria-pressed={!!esSel}
                  aria-label={`${dia} de ${MESES[vista.m - 1]} de ${vista.y}`}
                  onClick={() => { elegir(iso); setAbierto(false); }}
                  className={`flex h-8 items-center justify-center rounded-[7px] text-[12.5px] tabular-nums transition-colors ${
                    esSel
                      ? "bg-blue font-bold text-on-primary"
                      : esHoy
                        ? "font-bold text-accent ring-1 ring-accent hover:bg-panel2"
                        : fuera
                          ? "cursor-not-allowed text-muted opacity-40"
                          : "cursor-pointer text-text hover:bg-panel2"
                  }`}
                >
                  {dia}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex justify-between border-t border-border pt-2">
            <button type="button" onClick={() => { elegir(""); setAbierto(false); }}
              className="cursor-pointer rounded-[6px] px-2 py-[3px] text-[12px] text-muted hover:text-text">
              Borrar
            </button>
            <button type="button" onClick={() => { elegir(hoy); setVista(partes(hoy)!); setAbierto(false); }}
              className="cursor-pointer rounded-[6px] px-2 py-[3px] text-[12px] font-semibold text-blue hover:underline">
              Hoy
            </button>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

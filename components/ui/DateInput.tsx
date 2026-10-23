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

// "dd/mm/aaaa" -> "aaaa-mm-dd", o null si no es una fecha real
function desdeTexto(t: string): string | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(t);
  if (!m) return null;
  const d = Number(m[1]), mes = Number(m[2]), y = Number(m[3]);
  const fecha = new Date(y, mes - 1, d);
  if (fecha.getFullYear() !== y || fecha.getMonth() !== mes - 1 || fecha.getDate() !== d) return null;
  return aIso(y, mes, d);
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
  const triggerRef = useRef<HTMLDivElement>(null);
  // Texto que se ve en el input: se puede escribir a mano o se llena al elegir en el calendario
  const [texto, setTexto] = useState(() => formatear(actual));
  const popRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const p = partes(actual);
    if (p) setVista({ y: p.y, m: p.m, d: p.d });
    setTexto(formatear(actual));
  }, [actual]);

  const dentroDeLimites = (iso: string) => !((min && iso < min) || (max && iso > max));

  // Máscara mientras se escribe: barras automáticas; se confirma cuando la fecha está completa y es válida
  const alEscribir = (raw: string) => {
    const digitos = raw.replace(/\D/g, "").slice(0, 8);
    const mascara = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter(Boolean).join("/");
    setTexto(mascara);
    if (digitos.length === 0) {
      if (actual) elegir("");
      return;
    }
    if (digitos.length === 8) {
      const iso = desdeTexto(mascara);
      if (iso && dentroDeLimites(iso)) elegir(iso);
    }
  };

  // Al salir del campo: si quedó una fecha válida la toma; si no, vuelve al último valor válido
  const alSalir = () => {
    const iso = desdeTexto(texto);
    if (iso && dentroDeLimites(iso)) {
      if (iso !== actual) elegir(iso);
      setTexto(formatear(iso));
    } else if (!texto) {
      if (actual) elegir("");
    } else {
      setTexto(formatear(actual));
    }
  };

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
      <div ref={triggerRef} className="relative">
        <input
          type="text"
          inputMode="numeric"
          id={id}
          value={texto}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder="dd/mm/aaaa"
          aria-label={rest["aria-label"]}
          autoComplete="off"
          onChange={(e) => alEscribir(e.target.value)}
          onBlur={alSalir}
          onClick={() => { if (!abierto) abrir(); }}
          className={`${className ?? ""} pr-9`}
        />
        <button
          type="button"
          onClick={() => (abierto ? setAbierto(false) : abrir())}
          disabled={disabled}
          aria-label="Abrir calendario"
          aria-haspopup="dialog"
          aria-expanded={abierto}
          className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center text-muted hover:text-text disabled:cursor-not-allowed"
        >
          <CalendarDays size={14} aria-hidden />
        </button>
      </div>

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

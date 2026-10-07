"use client";

import { useMemo, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { removeDiaInhabil } from "@/app/(app)/calendario/actions";
import OpenCausaButton from "@/components/causas/OpenCausaButton";
import { useUIStore } from "@/store/uiStore";
import { addDaysISO, dayOfWeekISO, formatDate, formatLongDate } from "@/utils/formatters";
import type { AlertaItem } from "@/services/supabase/layoutCounts";
import type { DiaInhabil } from "@/types";
import DiaInhabilForm from "./DiaInhabilForm";

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const DIAS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

interface CalendarViewProps {
  hoy: string; // YYYY-MM-DD (hora de Argentina, calculado en el servidor)
  avisos: AlertaItem[];
  inhabiles: DiaInhabil[];
  userId: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
const monthKey = (year: number, month: number) => `${year}-${pad(month + 1)}`;

// Agrupa por fecha
function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) map.set(key(item), [...(map.get(key(item)) ?? []), item]);
  return map;
}

export default function CalendarView({ hoy, avisos, inhabiles, userId }: CalendarViewProps) {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();

  const [year, setYear] = useState(Number(hoy.slice(0, 4)));
  const [month, setMonth] = useState(Number(hoy.slice(5, 7)) - 1);
  const [selected, setSelected] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  const avisosPorDia = useMemo(() => groupBy(avisos, (a) => a.fecha), [avisos]);
  const inhabilesPorDia = useMemo(() => groupBy(inhabiles, (d) => d.fecha), [inhabiles]);
  const aniosConFeriados = useMemo(
    () => [...new Set(inhabiles.filter((d) => d.user_id === null).map((d) => d.fecha.slice(0, 4)))],
    [inhabiles],
  );

  // Grilla: semanas completas de lunes a domingo que cubren el mes
  const celdas = useMemo(() => {
    const primero = `${monthKey(year, month)}-01`;
    const offset = (dayOfWeekISO(primero) + 6) % 7; // lunes = 0
    const inicio = addDaysISO(primero, -offset);
    const diasEnMes = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const semanas = Math.ceil((offset + diasEnMes) / 7);
    return Array.from({ length: semanas * 7 }, (_, i) => addDaysISO(inicio, i));
  }, [year, month]);

  const prefijo = monthKey(year, month);
  const avisosDelMes = avisos.filter((a) => a.fecha.startsWith(prefijo));
  const inhabilesDelMes = inhabiles.filter((d) => d.fecha.startsWith(prefijo) && !isWeekend(d.fecha));
  const vencimientos = avisosDelMes.filter((a) => a.tipo !== "Alerta").length;
  const alertas = avisosDelMes.length - vencimientos;

  const cambiarMes = (delta: number) => {
    const d = new Date(Date.UTC(year, month + delta, 1));
    setYear(d.getUTCFullYear());
    setMonth(d.getUTCMonth());
    setSelected(null);
  };
  const irAHoy = () => {
    setYear(Number(hoy.slice(0, 4)));
    setMonth(Number(hoy.slice(5, 7)) - 1);
    setSelected(hoy);
  };

  const borrarInhabil = async (id: string) => {
    const ok = await confirmRequest({ title: "Eliminar día inhábil", message: "¿Eliminar este día inhábil?", confirmLabel: "Eliminar", danger: true });
    if (!ok) return;
    const result = await removeDiaInhabil(id);
    showToast({ message: result.error ?? result.message ?? "Listo." });
    if (!result.error) router.refresh();
  };

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-3 p-3 pb-20 md:flex-row md:pb-3">
      {/* ── Calendario ── */}
      <section className="min-w-0 flex-1 overflow-hidden rounded-[7px] border border-border bg-card">
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
          <button type="button" onClick={() => cambiarMes(-1)} aria-label="Mes anterior" className="flex cursor-pointer rounded p-1 text-sub hover:bg-bg">
            <ChevronLeft size={18} />
          </button>
          <h2 className="min-w-[170px] text-center text-[17px] font-bold text-text">
            {MESES[month]} {year}
          </h2>
          <button type="button" onClick={() => cambiarMes(1)} aria-label="Mes siguiente" className="flex cursor-pointer rounded p-1 text-sub hover:bg-bg">
            <ChevronRight size={18} />
          </button>
          <button type="button" onClick={irAHoy} className="cursor-pointer rounded-[6px] border border-border px-3 py-1 text-[13px] font-medium text-sub hover:bg-bg">
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="ml-auto cursor-pointer text-[13px] font-semibold text-blue hover:underline"
          >
            + Día inhábil
          </button>
        </div>

        <div className="grid grid-cols-7 border-b border-border bg-transparent text-center text-[12px] font-bold tracking-[.4px] text-muted uppercase">
          {DIAS.map((d) => (
            <div key={d} className="py-[6px]">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {celdas.map((fecha) => {
            const delMes = fecha.startsWith(prefijo);
            const finde = isWeekend(fecha);
            const inh = inhabilesPorDia.get(fecha) ?? [];
            const evs = avisosPorDia.get(fecha) ?? [];
            const esHoy = fecha === hoy;
            const activa = fecha === selected;
            return (
              <button
                key={fecha}
                type="button"
                onClick={() => setSelected(activa ? null : fecha)}
                aria-label={formatLongDate(fecha)}
                aria-pressed={activa}
                className={`flex min-h-[64px] cursor-pointer flex-col items-start gap-1 border-r border-b p-[6px] text-left transition-colors duration-150 sm:min-h-[76px] ${activa ? "ring-2 ring-blue ring-inset" : ""}`}
                style={{
                  borderColor: "var(--color-border)",
                  background: !delMes
                    ? "var(--cal-out)"
                    : inh.length
                    ? "var(--cal-inh)"
                    : finde
                    ? "var(--cal-wknd)"
                    : "var(--color-card)",
                }}
                onMouseEnter={(e) => {
                  if (delMes && !inh.length && !finde)
                    (e.currentTarget as HTMLElement).style.background = "var(--color-blue-lt)";
                }}
                onMouseLeave={(e) => {
                  if (delMes && !inh.length && !finde)
                    (e.currentTarget as HTMLElement).style.background = "var(--color-card)";
                }}
              >
                <span
                  className={`flex h-[24px] min-w-[24px] items-center justify-center rounded-full px-1 text-[13px] font-semibold ${
                    esHoy
                      ? "bg-blue text-white"
                      : !delMes
                      ? "text-muted opacity-40"
                      : finde
                      ? "text-sub"
                      : "text-text"
                  }`}
                >
                  {Number(fecha.slice(8))}
                </span>
                {inh.length > 0 && delMes && (
                  <span className="hidden max-w-full truncate text-[11px] text-amb sm:block" title={inh[0].descripcion}>
                    {inh[0].tipo === "Feriado nacional" ? "Feriado" : inh[0].tipo === "Feria judicial" ? "Feria" : "Inhábil"}
                  </span>
                )}
                {evs.length > 0 && (
                  <span className="mt-auto flex flex-wrap gap-[3px]">
                    {evs.slice(0, 4).map((e) => (
                      <span
                        key={e.causaId}
                        title={`${e.tipo ?? "Vencimiento"}: ${e.caratula}`}
                        className={`h-[9px] w-[9px] rounded-full ${e.tipo === "Alerta" ? "bg-amb" : "bg-red"}`}
                      />
                    ))}
                    {evs.length > 4 && <span className="text-[11px] leading-[9px] font-bold text-sub">+{evs.length - 4}</span>}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-3 py-2 text-[12.5px] text-sub">
          <span className="flex items-center gap-1"><span className="h-[9px] w-[9px] rounded-full bg-red" /> Vencimiento</span>
          <span className="flex items-center gap-1"><span className="h-[9px] w-[9px] rounded-full bg-amb" /> Alerta</span>
          <span className="flex items-center gap-1"><span className="h-[11px] w-[11px] rounded-[3px] ring-1 ring-amb-bd" style={{ background: "var(--cal-inh)" }} /> Día inhábil</span>
          <span className="ml-auto text-muted">
            Feriados nacionales cargados: {aniosConFeriados.join(", ") || "ninguno"}
          </span>
        </div>
      </section>

      {/* ── Resumen a un costado ── */}
      {/* En pantallas anchas es una columna vertical de la misma altura que el calendario,
          con scroll propio si hay muchos eventos. */}
      <aside className="w-full shrink-0 md:relative md:w-[320px]">
       <div className="flex flex-col gap-3 md:absolute md:inset-0 md:overflow-y-auto">
        {selected && (
          <Panel titulo={formatLongDate(selected)}>
            {(inhabilesPorDia.get(selected) ?? []).map((d) => (
              <InhabilRow key={d.id} dia={d} propio={d.user_id === userId} onDelete={borrarInhabil} />
            ))}
            {(avisosPorDia.get(selected) ?? []).map((a) => (
              <AvisoRow key={a.causaId} aviso={a} />
            ))}
            {!(inhabilesPorDia.get(selected)?.length) && !(avisosPorDia.get(selected)?.length) && (
              <p className="px-3 py-3 text-[13.5px] text-muted">
                {isWeekend(selected) ? "Fin de semana. " : ""}Sin alertas ni vencimientos este día.
              </p>
            )}
          </Panel>
        )}

        <Panel titulo={`Resumen de ${MESES[month].toLowerCase()}`} grow>
          <div className="grid grid-cols-3 divide-x divide-border border-b border-border text-center">
            <Resumen n={vencimientos} label="Vencim." tone="text-red" />
            <Resumen n={alertas} label="Alertas" tone="text-amb" />
            <Resumen n={inhabilesDelMes.length} label="Inhábiles" tone="text-sub" />
          </div>

          {avisosDelMes.length === 0 && inhabilesDelMes.length === 0 && (
            <p className="px-3 py-3 text-[13.5px] text-muted">No hay alertas, vencimientos ni feriados este mes.</p>
          )}

          {avisosDelMes.map((a) => (
            <AvisoRow key={a.causaId} aviso={a} conFecha />
          ))}
          {inhabilesDelMes.map((d) => (
            <InhabilRow key={d.id} dia={d} propio={d.user_id === userId} onDelete={borrarInhabil} conFecha />
          ))}
        </Panel>
       </div>
      </aside>

      {formOpen && (
        <DiaInhabilForm
          defaultDate={selected ?? hoy}
          onClose={() => setFormOpen(false)}
          onSaved={(message) => {
            setFormOpen(false);
            showToast({ message });
            router.refresh();
          }}
        />
      )}
      {confirmDialog}
    </div>
  );
}

function isWeekend(iso: string): boolean {
  const d = dayOfWeekISO(iso);
  return d === 0 || d === 6;
}

function Panel({ titulo, children, grow }: { titulo: string; children: React.ReactNode; grow?: boolean }) {
  return (
    <section className={`overflow-hidden rounded-[7px] border border-border bg-card ${grow ? "flex-1" : ""}`}>
      <div className="border-b border-border px-3 py-[9px] text-[13px] font-bold tracking-[.4px] text-sub uppercase">{titulo}</div>
      {children}
    </section>
  );
}

function Resumen({ n, label, tone }: { n: number; label: string; tone: string }) {
  return (
    <div className="py-2">
      <div className={`text-[22px] leading-none font-extrabold ${tone}`}>{n}</div>
      <div className="mt-1 text-[12px] text-muted">{label}</div>
    </div>
  );
}

function AvisoRow({ aviso, conFecha }: { aviso: AlertaItem; conFecha?: boolean }) {
  const esAlerta = aviso.tipo === "Alerta";
  const Icon = esAlerta ? Bell : CalendarClock;
  return (
    <div className="flex items-start gap-2 border-b border-border px-3 py-[9px] last:border-b-0">
      <Icon size={15} className={`mt-[3px] shrink-0 ${esAlerta ? "text-amb" : "text-red"}`} />
      <div className="min-w-0 flex-1">
        <OpenCausaButton causaId={aviso.causaId} className="block max-w-full truncate text-[14px] font-semibold text-text hover:text-blue">
          {aviso.caratula}
        </OpenCausaButton>
        <div className="text-[13px] text-sub">
          {aviso.tipo ?? "Vencimiento"}
          {aviso.motivo ? ` — ${aviso.motivo}` : ""}
        </div>
      </div>
      {conFecha && <span className="shrink-0 pt-px text-[12.5px] font-semibold text-sub">{formatDate(aviso.fecha).slice(0, 5)}</span>}
    </div>
  );
}

function InhabilRow({
  dia,
  propio,
  onDelete,
  conFecha,
}: {
  dia: DiaInhabil;
  propio: boolean;
  onDelete: (id: string) => void;
  conFecha?: boolean;
}) {
  return (
    <div className="flex items-start gap-2 border-b border-border px-3 py-[9px] last:border-b-0" style={{ background: "var(--cal-inh)" }}>
      <span className="mt-[6px] h-[9px] w-[9px] shrink-0 rounded-[3px] bg-amb-bd" />
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-medium text-text">{dia.descripcion}</div>
        <div className="text-[12.5px] text-muted">{dia.tipo}</div>
      </div>
      {conFecha && <span className="shrink-0 pt-px text-[12.5px] font-semibold text-sub">{formatDate(dia.fecha).slice(0, 5)}</span>}
      {propio && (
        <button
          type="button"
          onClick={() => onDelete(dia.id)}
          aria-label="Eliminar día inhábil"
          className="flex cursor-pointer pt-[3px] text-muted hover:text-red"
        >
          <Trash2 size={14} />
        </button>
      )}
    </div>
  );
}

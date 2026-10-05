"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CalendarClock, ClipboardList, Pencil, Share2, Users, Wallet, type LucideIcon } from "lucide-react";
import { marcarNotificacionesLeidas } from "@/app/(app)/notificaciones/actions";
import { useCausasStore } from "@/store/causasStore";
import { formatRelative, getDaysUntil } from "@/utils/formatters";
import { URGENCY_DOT, getDeadlineLabel, getUrgency } from "@/utils/urgencyHelpers";
import type { AlertaItem, NotificacionItem } from "@/services/supabase/layoutCounts";
import type { TipoNotificacion } from "@/types";

interface AlertsBellProps {
  alertas: AlertaItem[];
  urgentes: number; // alertas vencidas o de los próximos 3 días
  notificaciones: NotificacionItem[];
  sinLeer: number; // notificaciones de colegas sin leer
}

const GRUPOS = [
  { titulo: "Vencidos", match: (d: number) => d < 0 },
  { titulo: "Próximos 7 días", match: (d: number) => d >= 0 && d <= 7 },
  { titulo: "Más adelante", match: (d: number) => d > 7 },
];

const NOTIF_ICON: Record<TipoNotificacion, LucideIcon> = {
  causa_editada: Pencil,
  movimiento: ClipboardList,
  honorarios: Wallet,
  pago: Wallet,
  compartida: Share2,
};

type Tab = "alertas" | "colegas";

export default function AlertsBell({ alertas, urgentes, notificaciones, sinLeer }: AlertsBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("alertas");
  const [alertasVistas, setAlertasVistas] = useState(false);
  const [colegasVistos, setColegasVistos] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Badge visual: se oculta una vez que el usuario abrió esa pestaña
  const badgeUrgentes = alertasVistas ? 0 : urgentes;
  const badgeSinLeer  = colegasVistos ? 0 : sinLeer;
  const total = badgeUrgentes + badgeSinLeer;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Abre la causa en el listado (sin filtros que puedan ocultarla)
  const goToCausa = (causaId: string) => {
    const { select, setFilter, setSearch } = useCausasStore.getState();
    setFilter("todas");
    setSearch("");
    select(causaId);
    setOpen(false);
    router.push("/causas");
  };

  const abrirNotificacion = (n: NotificacionItem) => {
    if (!n.leida) void marcarNotificacionesLeidas([n.id]);
    goToCausa(n.causaId);
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          // Al abrir: marcar la pestaña activa como vista
          if (next) {
            if (tab === "alertas") setAlertasVistas(true);
            else { setColegasVistos(true); void marcarNotificacionesLeidas(); }
          }
        }}
        aria-label={`Notificaciones (${total} pendientes)`}
        aria-expanded={open}
        className="relative flex h-[34px] w-[34px] cursor-pointer items-center justify-center rounded-full bg-amb-lt text-amb"
      >
        <Bell size={17} />
        {total > 0 && (
          <span className="absolute -top-[3px] -right-[3px] flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-red px-[4px] text-[11px] font-bold text-white">
            {total}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-[56px] z-40 flex max-h-[75vh] flex-col overflow-hidden rounded-[8px] border border-border bg-card shadow-xl sm:absolute sm:inset-x-auto sm:top-full sm:right-0 sm:mt-2 sm:w-[420px]">
          {/* Pestañas */}
          <div role="tablist" className="flex shrink-0 border-b border-border">
            <TabButton active={tab === "alertas"} onClick={() => { setTab("alertas"); setAlertasVistas(true); }} count={badgeUrgentes} label="Alertas y vencimientos" />
            <TabButton active={tab === "colegas"} onClick={() => { setTab("colegas"); setColegasVistos(true); void marcarNotificacionesLeidas(); }} count={badgeSinLeer} label="Colegas" />
          </div>

          <div className="overflow-y-auto">
            {tab === "alertas" ? (
              <AlertasTab alertas={alertas} onOpen={goToCausa} />
            ) : (
              <ColegasTab
                notificaciones={notificaciones}
                sinLeer={sinLeer}
                onOpen={abrirNotificacion}
                onMarkAll={() => void marcarNotificacionesLeidas()}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, count, label }: { active: boolean; onClick: () => void; count: number; label: string }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex flex-1 cursor-pointer items-center justify-center gap-[6px] border-b-2 px-3 py-[9px] text-[12px] font-semibold ${
        active ? "border-blue text-blue" : "border-transparent text-sub hover:bg-bg"
      }`}
    >
      {label}
      {count > 0 && (
        <span className="rounded-full bg-red px-[6px] py-px text-[11px] font-bold text-white">{count}</span>
      )}
    </button>
  );
}

function AlertasTab({ alertas, onOpen }: { alertas: AlertaItem[]; onOpen: (causaId: string) => void }) {
  if (alertas.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-[12.5px] text-muted">
        No tenés alertas ni vencimientos en los próximos 30 días.
      </p>
    );
  }

  return (
    <>
      {GRUPOS.map((grupo) => {
        const items = alertas.filter((a) => grupo.match(getDaysUntil(a.fecha) ?? 99));
        if (items.length === 0) return null;
        return (
          <div key={grupo.titulo}>
            <div className="bg-bg px-[13px] py-[4px] text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
              {grupo.titulo} ({items.length})
            </div>
            {items.map((a) => {
              const urgency = getUrgency(a.fecha);
              const Icon = a.tipo === "Alerta" ? Bell : CalendarClock;
              return (
                <button
                  key={a.causaId}
                  type="button"
                  onClick={() => onOpen(a.causaId)}
                  className="flex w-full cursor-pointer items-start gap-[9px] border-b border-border px-[13px] py-[8px] text-left hover:bg-bg"
                >
                  <span className={`mt-[6px] h-[7px] w-[7px] shrink-0 rounded-full ${URGENCY_DOT[urgency]}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold text-text">{a.caratula}</span>
                    <span className="mt-px flex items-center gap-1 text-[11.5px] text-sub">
                      <Icon size={10} className="shrink-0" />
                      <span className="truncate">{a.motivo ?? a.tipo ?? "Vencimiento"}</span>
                    </span>
                  </span>
                  <span
                    className={`shrink-0 pt-px text-[11.5px] ${urgency === "red" ? "font-semibold text-red" : urgency === "amber" ? "text-amb" : "text-muted"}`}
                  >
                    {getDeadlineLabel(a.fecha, a.tipo)}
                  </span>
                </button>
              );
            })}
          </div>
        );
      })}
    </>
  );
}

function ColegasTab({
  notificaciones,
  sinLeer,
  onOpen,
  onMarkAll,
}: {
  notificaciones: NotificacionItem[];
  sinLeer: number;
  onOpen: (n: NotificacionItem) => void;
  onMarkAll: () => void;
}) {
  if (notificaciones.length === 0) {
    return (
      <div className="px-4 py-8 text-center text-[12.5px] text-muted">
        <Users size={20} className="mx-auto mb-2 text-muted" />
        Cuando un colega modifique una causa compartida con vos, te avisamos acá.
      </div>
    );
  }

  return (
    <>
      {sinLeer > 0 && (
        <div className="flex justify-end border-b border-border px-[13px] py-[6px]">
          <button type="button" onClick={onMarkAll} className="cursor-pointer text-[12.5px] font-semibold text-blue hover:underline">
            Marcar todas como leídas
          </button>
        </div>
      )}
      {notificaciones.map((n) => {
        const Icon = NOTIF_ICON[n.tipo] ?? Pencil;
        return (
          <button
            key={n.id}
            type="button"
            onClick={() => onOpen(n)}
            className={`flex w-full cursor-pointer items-start gap-[9px] border-b border-border px-[13px] py-[10px] text-left hover:bg-bg ${
              n.leida ? "" : "bg-blue-lt/60"
            }`}
          >
            <Icon size={13} className={`mt-[3px] shrink-0 ${n.leida ? "text-muted" : "text-blue"}`} />
            <span className="min-w-0 flex-1">
              <span className={`block text-[12.5px] leading-snug ${n.leida ? "text-sub" : "font-semibold text-text"}`}>
                {n.mensaje}
              </span>
              <span className="mt-px block truncate text-[11.5px] text-muted">{n.caratula}</span>
            </span>
            <span className="shrink-0 pt-px text-[11px] text-muted">{formatRelative(n.creadaEn)}</span>
          </button>
        );
      })}
    </>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { X, Share2, Pencil } from "lucide-react";
import { quitarAcceso } from "@/app/(app)/causas/shareActions";
import ColaboradoresList from "@/components/shares/ColaboradoresList";
import ShareCausaModal from "@/components/shares/ShareCausaModal";
import AlertCard from "@/components/ui/AlertCard";
import Badge from "@/components/ui/Badge";
import CollapsibleSection from "@/components/ui/CollapsibleSection";
import DriveLink from "@/components/ui/DriveLink";
import FieldGrid, { type Field } from "@/components/ui/FieldGrid";
import GestionEconomicaSection from "@/components/causas/GestionEconomicaSection";
import MovimientosSection, { type MovimientosSectionRef } from "@/components/movimientos/MovimientosSection";
import VencimientosSection from "@/components/causas/VencimientosSection";
import InfoTooltip from "@/components/ui/InfoTooltip";
import TodoList from "@/components/todos/TodoList";
import { useShares } from "@/hooks/useCausaData";
import { useCausasStore } from "@/store/causasStore";
import { useUIStore } from "@/store/uiStore";
import { formatCurrency, formatDate, getDaysUntil, getInitials } from "@/utils/formatters";
import { getDeadlineLabel, getUrgency } from "@/utils/urgencyHelpers";
import type { CausaConRelaciones, CausaShareConUsuario } from "@/types";

interface Props {
  causa: CausaConRelaciones;
  userId: string;
}

export default function CausaModal({ causa, userId }: Props) {
  const router = useRouter();
  const select = useCausasStore((s) => s.select);
  const openEdit = useCausasStore((s) => s.openEdit);
  const showToast = useUIStore((s) => s.showToast);
  const { data: shares, loading: sharesLoading, reload: reloadShares } = useShares(causa.id);
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();
  const [shareOpen, setShareOpen] = useState(false);
  const movRef = useRef<MovimientosSectionRef>(null);
  const vencimientosRef = useRef<HTMLDivElement>(null);

  const cerrada = causa.estado === "Cerrada";
  const urgency = getUrgency(causa.proximo_vencimiento, cerrada);
  const esTitular = causa.user_id === userId;

  // Esc para cerrar
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") select(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [select]);

  // Bloquear scroll del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const revocar = async (share: CausaShareConUsuario) => {
    const nombre = share.usuario?.nombre_completo ?? share.usuario?.email ?? "este usuario";
    const ok = await confirmRequest({ title: "Quitar acceso", message: `¿Quitar el acceso de ${nombre} a esta causa?`, confirmLabel: "Quitar acceso", danger: true });
    if (!ok) return;
    const result = await quitarAcceso(share.id);
    showToast({ message: result.error ?? result.message ?? "Listo." });
    if (!result.error) { reloadShares(); router.refresh(); }
  };

  const ultimaActividad = causa.fecha_ultimo_movimiento ?? causa.created_at.slice(0, 10);
  const diasSinMovimiento = -(getDaysUntil(ultimaActividad) ?? 0);
  const inactiva = !cerrada && diasSinMovimiento >= causa.inactividad_dias;
  const ownerName = causa.owner?.nombre_completo ?? causa.owner?.email ?? "—";

  const datos: Field[] = [
    { label: "Nro Expediente", value: causa.nro_expediente ?? "—" },
    { label: "Fuero", value: causa.fuero ?? "—" },
    { label: "Tipo de juicio", value: causa.tipo_juicio ?? "—" },
    { label: "Juzgado / Cámara", value: causa.juzgado_camara ?? "—" },
    { label: "Parte actora", value: causa.parte_actora ?? "—" },
    { label: "Parte demandada", value: causa.parte_demandada ?? "—" },
    { label: "Fecha de inicio", value: formatDate(causa.fecha_inicio) },
    { label: "Monto reclamado", value: formatCurrency(causa.monto_reclamado) },
    {
      label: "Cliente",
      value: causa.cliente
        ? <Link href={`/clientes?id=${causa.cliente.id}`} className="text-blue hover:underline" onClick={() => select(null)}>{causa.cliente.nombre_completo}</Link>
        : "—",
    },
  ];
  if (causa.notas) datos.push({ label: "Notas", value: causa.notas, full: true });

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px]"
        onClick={() => select(null)}
        aria-hidden="true"
      />

      {/* Modal: 97vh en mobile, 95vh en desktop — siempre flotando sobre el backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={() => select(null)}>
        <div
          className="relative flex h-[92dvh] w-[calc(100%-16px)] flex-col overflow-hidden rounded-xl bg-bg shadow-2xl md:w-[95%] md:rounded-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header fijo */}
          <div className="shrink-0 border-b border-border bg-card px-5 pt-4 pb-3">
            {/* Título + botón cerrar */}
            <div className="mb-[10px] flex items-start gap-3">
              <h2 className="flex-1 text-[16px] font-bold leading-[1.35] text-text">
                {causa.nro_expediente && `${causa.nro_expediente} — `}{causa.caratula}
              </h2>
              <button
                type="button"
                onClick={() => select(null)}
                title="Cerrar (Esc)"
                className="mt-[2px] shrink-0 cursor-pointer rounded-lg p-[5px] text-sub transition-colors"
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <X size={17} />
              </button>
            </div>

            {/* Badges + acciones */}
            <div className="flex flex-wrap items-center gap-[6px]">
              <Badge estado={causa.estado} size="lg" />
              {causa.fuero && (
                <span className="rounded-[4px] px-2 py-[2px] text-[12px] font-medium text-sub" style={{ background: "var(--color-border)" }}>
                  {causa.fuero}
                </span>
              )}
              {causa.juzgado_camara && (
                <span className="hidden rounded-[4px] px-2 py-[2px] text-[12px] font-medium text-sub sm:inline" style={{ background: "var(--color-border)" }}>
                  {causa.juzgado_camara}
                </span>
              )}
              <span
                className="rounded-[4px] px-2 py-[2px] text-[12px] font-medium"
                style={{ background: "var(--color-amb-lt)", color: "var(--color-amb)" }}
                title={ownerName}
              >
                {getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase())}
              </span>
              {!esTitular && (
                <span className="rounded-[4px] bg-pur-lt px-2 py-[2px] text-[12px] font-medium text-pur">
                  Compartida conmigo
                </span>
              )}
              {esTitular && shares.length > 0 && (
                <span className="rounded-[4px] bg-pur-lt px-2 py-[2px] text-[12px] font-medium text-pur">
                  Compartida con {shares.length}
                </span>
              )}

              {/* Acciones */}
              <span className="ml-auto flex items-center gap-4">
                {esTitular && (
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-blue hover:underline"
                  >
                    <Share2 size={13} /> Compartir
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => openEdit(causa.id)}
                  className="flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-blue hover:underline"
                >
                  <Pencil size={12} /> Editar
                </button>
              </span>
            </div>
          </div>

          {/* Cuerpo scrollable */}
          <div className="flex-1 overflow-y-auto">
            {/* Alertas urgentes siempre visibles */}
            {(urgency === "red" || urgency === "amber") && (
              <AlertCard
                variant={causa.tipo_vencimiento === "Recordatorio" ? "blue" : urgency === "red" ? "red" : "amber"}
                title={`${getDeadlineLabel(causa.proximo_vencimiento, causa.tipo_vencimiento)}${causa.motivo_vencimiento ? ` — ${causa.motivo_vencimiento}` : ""}`}
                description={`${causa.tipo_vencimiento ?? "Vencimiento"} ${formatDate(causa.proximo_vencimiento)} · Aviso con ${causa.anticipacion_alerta} de anticipación`}
              />
            )}
            {inactiva && (
              <AlertCard
                variant="amber"
                title={`Sin movimientos hace ${diasSinMovimiento} días`}
                description={`Alerta de inactividad configurada en ${causa.inactividad_dias} días`}
              />
            )}

            {/* Secciones colapsables */}
            <div className="py-3">
              <CollapsibleSection title="Datos del expediente" defaultOpen>
                <FieldGrid fields={datos} />
                {causa.link_drive && (
                  <div className="px-[14px] pb-3">
                    <DriveLink href={causa.link_drive} label="Carpeta Drive" />
                  </div>
                )}
              </CollapsibleSection>

              <CollapsibleSection
                title="Historial de movimientos"
                defaultOpen
                headerAction={
                  <button
                    type="button"
                    onClick={() => movRef.current?.openForm()}
                    className="cursor-pointer text-[13px] font-semibold text-blue hover:underline"
                  >
                    + Agregar
                  </button>
                }
              >
                <MovimientosSection ref={movRef} causaId={causa.id} userId={userId} naked />
              </CollapsibleSection>

              <div ref={vencimientosRef} className="mb-[6px]">
              <CollapsibleSection
                title="Agenda / Vencimientos"
                titleInfo={<InfoTooltip text="Audiencias y vencimientos generan alertas por email y afectan el semáforo. Los recordatorios son avisos internos sin email." />}
              >
                <div className="px-[14px] pb-4 pt-2">
                  <VencimientosSection causaId={causa.id} esTitular={esTitular} />
                </div>
              </CollapsibleSection>
              </div>

              <GestionEconomicaSection causaId={causa.id} collapsible />

              <CollapsibleSection title="Tareas">
                <TodoList causaId={causa.id} />
              </CollapsibleSection>

              <CollapsibleSection
                title={`Acceso compartido${shares.length > 0 ? ` (${shares.length})` : ""}`}
              >
                <ColaboradoresList
                  owner={causa.owner}
                  shares={shares}
                  loading={sharesLoading}
                  esTitular={esTitular}
                  onRevoke={revocar}
                  naked
                />
              </CollapsibleSection>
            </div>

            {causa.editor && (
              <p className="px-5 py-3 text-[12px] text-muted">
                Última edición: {causa.editor.nombre_completo ?? causa.editor.email} · {formatDate(causa.updated_at)}
                {causa.campo_editado && ` · ${causa.campo_editado}`}
              </p>
            )}
          </div>
        </div>
      </div>

      {shareOpen && (
        <ShareCausaModal
          causaId={causa.id}
          caratula={causa.caratula}
          onClose={() => setShareOpen(false)}
          onShared={(message) => {
            setShareOpen(false);
            showToast({ message });
            reloadShares();
            router.refresh();
          }}
        />
      )}
      {confirmDialog}
    </>
  );
}

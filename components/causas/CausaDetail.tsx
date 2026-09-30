"use client";

import { ArrowLeft } from "lucide-react";
import AlertCard from "@/components/ui/AlertCard";
import Badge from "@/components/ui/Badge";
import CardSection from "@/components/ui/CardSection";
import DriveLink from "@/components/ui/DriveLink";
import FieldGrid, { type Field } from "@/components/ui/FieldGrid";
import HonorariosCard from "@/components/honorarios/HonorariosCard";
import MovimientosSection from "@/components/movimientos/MovimientosSection";
import { useCausasStore } from "@/store/causasStore";
import { formatCurrency, formatDate, getDaysUntil, getInitials } from "@/utils/formatters";
import { getDeadlineLabel, getUrgency } from "@/utils/urgencyHelpers";
import type { CausaConRelaciones } from "@/types";

interface CausaDetailProps {
  causa: CausaConRelaciones;
  userId: string;
  className?: string;
}

export default function CausaDetail({ causa, userId, className = "" }: CausaDetailProps) {
  const openEdit = useCausasStore((s) => s.openEdit);
  const select = useCausasStore((s) => s.select);

  const cerrada = causa.estado === "Cerrada";
  const urgency = getUrgency(causa.proximo_vencimiento, cerrada);
  const esCompartida = causa.user_id !== userId;
  const ownerName = causa.owner?.nombre_completo ?? causa.owner?.email ?? "—";

  // Inactividad: días desde el último movimiento (o desde el alta si no hay)
  const ultimaActividad = causa.fecha_ultimo_movimiento ?? causa.created_at.slice(0, 10);
  const diasSinMovimiento = -(getDaysUntil(ultimaActividad) ?? 0);
  const inactiva = !cerrada && diasSinMovimiento >= causa.inactividad_dias;

  const datos: Field[] = [
    { label: "Nro Expediente", value: causa.nro_expediente ?? "—", variant: "mono" },
    { label: "Fuero", value: causa.fuero ?? "—" },
    { label: "Tipo de juicio", value: causa.tipo_juicio ?? "—" },
    { label: "Juzgado / Cámara", value: causa.juzgado_camara ?? "—" },
    { label: "Parte actora", value: causa.parte_actora ?? "—" },
    { label: "Parte demandada", value: causa.parte_demandada ?? "—" },
    { label: "Fecha de inicio", value: formatDate(causa.fecha_inicio) },
    { label: "Monto reclamado", value: formatCurrency(causa.monto_reclamado) },
    { label: "Cliente", value: causa.cliente?.nombre_completo ?? "—" },
  ];
  if (causa.notas) datos.push({ label: "Notas", value: causa.notas, full: true });

  const vencimientos: Field[] = [
    {
      label: causa.tipo_vencimiento === "Alerta" ? "Próxima alerta" : "Próximo vencimiento",
      value: causa.proximo_vencimiento
        ? `${formatDate(causa.proximo_vencimiento)}${causa.motivo_vencimiento ? ` — ${causa.motivo_vencimiento}` : ""}`
        : "Sin vencimiento cargado",
      variant: urgency === "red" ? "danger" : "default",
    },
    { label: "Anticipación configurada", value: causa.anticipacion_alerta },
    { label: "Último movimiento", value: formatDate(causa.fecha_ultimo_movimiento) },
    { label: "Alerta inactividad", value: `${causa.inactividad_dias} días sin movimiento` },
  ];

  return (
    <div className={`min-w-0 overflow-y-auto bg-bg pb-5 ${className}`}>
      <div className="sticky top-0 z-[5] border-b border-border bg-card px-[18px] pt-[14px] pb-3">
        <button
          type="button"
          onClick={() => select(null)}
          className="mb-2 flex cursor-pointer items-center gap-1 text-[13px] font-semibold text-blue md:hidden"
        >
          <ArrowLeft size={13} /> Volver al listado
        </button>
        <h2 className="mb-2 text-[17px] leading-[1.3] font-bold text-text">{causa.caratula}</h2>
        <div className="flex flex-wrap items-center gap-[6px]">
          <Badge estado={causa.estado} size="lg" />
          {(causa.fuero || causa.juzgado_camara) && (
            <span className="rounded-[4px] bg-slate-100 px-2 py-[2px] text-[12px] font-medium text-sub">
              {[causa.fuero, causa.juzgado_camara].filter(Boolean).join(" — ")}
            </span>
          )}
          <span
            className="rounded-[4px] bg-[#FEF9C3] px-2 py-[2px] text-[12px] font-medium text-[#713F12]"
            title={ownerName}
          >
            Titular: {getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase())}
          </span>
          {esCompartida && (
            <span className="rounded-[4px] bg-pur-lt px-2 py-[2px] text-[12px] font-medium text-pur">
              Compartida conmigo
            </span>
          )}
          <button
            type="button"
            onClick={() => openEdit(causa.id)}
            className="ml-auto cursor-pointer whitespace-nowrap text-[13px] font-semibold text-blue hover:underline"
          >
            Editar causa
          </button>
        </div>
      </div>

      {(urgency === "red" || urgency === "amber") && (
        <AlertCard
          variant={urgency === "red" ? "red" : "amber"}
          title={`${getDeadlineLabel(causa.proximo_vencimiento, causa.tipo_vencimiento)}${causa.motivo_vencimiento ? ` — ${causa.motivo_vencimiento}` : ""}`}
          description={`${causa.tipo_vencimiento ?? "Vencimiento"} ${formatDate(causa.proximo_vencimiento)} · Aviso configurado con ${causa.anticipacion_alerta} de anticipación`}
        />
      )}
      {inactiva && (
        <AlertCard
          variant="amber"
          title={`Sin movimientos hace ${diasSinMovimiento} días`}
          description={`Alerta de inactividad configurada en ${causa.inactividad_dias} días`}
        />
      )}

      <CardSection title="Datos del expediente">
        <FieldGrid fields={datos} />
      </CardSection>

      {causa.link_drive && (
        <DriveLink href={causa.link_drive} label={`Carpeta Drive — ${causa.caratula}`} />
      )}

      <HonorariosCard causaId={causa.id} />

      <CardSection title="Vencimientos">
        <FieldGrid fields={vencimientos} />
      </CardSection>

      <MovimientosSection causaId={causa.id} userId={userId} />

      {causa.editor && (
        <p className="mx-3 mt-3 text-[12px] text-muted">
          Última edición: {causa.editor.nombre_completo ?? causa.editor.email} · {formatDate(causa.updated_at)}
        </p>
      )}
    </div>
  );
}

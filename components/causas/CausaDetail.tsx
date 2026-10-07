"use client";

import { useRef, useState } from "react";
import { useConfirm } from "@/components/ui/ConfirmDialog";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Share2 } from "lucide-react";
import { revokeAccess } from "@/app/(app)/causas/shareActions";
import ColaboradoresList from "@/components/shares/ColaboradoresList";
import ShareCausaModal from "@/components/shares/ShareCausaModal";
import { useShares } from "@/hooks/useCausaData";
import { useUIStore } from "@/store/uiStore";
import AlertCard from "@/components/ui/AlertCard";
import Badge from "@/components/ui/Badge";
import CardSection from "@/components/ui/CardSection";
import DriveLink from "@/components/ui/DriveLink";
import FieldGrid, { type Field } from "@/components/ui/FieldGrid";
import GestionEconomicaSection from "./GestionEconomicaSection";
import MovimientosSection from "@/components/movimientos/MovimientosSection";
import VencimientosSection from "./VencimientosSection";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { useCausasStore } from "@/store/causasStore";
import { formatCurrency, formatDate, getDaysUntil, getInitials } from "@/utils/formatters";
import { getDeadlineLabel, getUrgency } from "@/utils/urgencyHelpers";
import type { CausaConRelaciones, CausaShareConUsuario } from "@/types";

interface CausaDetailProps {
  causa: CausaConRelaciones;
  userId: string;
  className?: string;
}

export default function CausaDetail({ causa, userId, className = "" }: CausaDetailProps) {
  const router = useRouter();
  const vencimientosRef = useRef<HTMLElement>(null);
  const openEdit = useCausasStore((s) => s.openEdit);
  const select = useCausasStore((s) => s.select);
  const showToast = useUIStore((s) => s.showToast);
  const { data: shares, loading: sharesLoading, reload: reloadShares } = useShares(causa.id);
  const { request: confirmRequest, dialog: confirmDialog } = useConfirm();
  const [shareOpen, setShareOpen] = useState(false);

  const cerrada = causa.estado === "Cerrada";
  const urgency = getUrgency(causa.proximo_vencimiento, cerrada);
  const esTitular = causa.user_id === userId;
  const esCompartida = !esTitular;

  const revocar = async (share: CausaShareConUsuario) => {
    const nombre = share.usuario?.nombre_completo ?? share.usuario?.email ?? "este usuario";
    const ok = await confirmRequest({ title: "Quitar acceso", message: `¿Quitar el acceso de ${nombre} a esta causa?`, confirmLabel: "Quitar acceso", danger: true });
    if (!ok) return;
    const result = await revokeAccess(share.id);
    showToast({ message: result.error ?? result.message ?? "Listo." });
    if (!result.error) {
      reloadShares();
      router.refresh();
    }
  };
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
    {
      label: "Parte/s demandada/s",
      value: causa.parte_demandada
        ? causa.parte_demandada.split("\n").filter(Boolean).join(" · ")
        : "—",
    },
    { label: "Fecha de inicio", value: formatDate(causa.fecha_inicio) },
    { label: "Monto reclamado", value: formatCurrency(causa.monto_reclamado) },
    {
      label: "Cliente",
      value: causa.cliente
        ? <Link href={`/clientes?id=${causa.cliente.id}`} className="text-blue hover:underline">{causa.cliente.nombre_completo}</Link>
        : "—",
    },
  ];
  if (causa.notas) datos.push({ label: "Notas", value: causa.notas, full: true });

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
            <span className="rounded-[4px] px-2 py-[2px] text-[12px] font-medium text-sub" style={{ background: "var(--color-border)" }}>
              {[causa.fuero, causa.juzgado_camara].filter(Boolean).join(" — ")}
            </span>
          )}
          <span
            className="rounded-[4px] px-2 py-[2px] text-[12px] font-medium"
            style={{ background: "var(--color-amb-lt)", color: "var(--color-amb)" }}
            title={ownerName}
          >
            Titular: {getInitials(causa.owner?.nombre_completo, causa.owner?.email[0]?.toUpperCase())}
          </span>
          {esCompartida && (
            <span className="rounded-[4px] bg-pur-lt px-2 py-[2px] text-[12px] font-medium text-pur">
              Compartida conmigo
            </span>
          )}
          {esTitular && shares.length > 0 && (
            <span className="rounded-[4px] bg-pur-lt px-2 py-[2px] text-[12px] font-medium text-pur">
              Compartida con {shares.length}
            </span>
          )}
          <span className="ml-auto flex items-center gap-4">
            {esTitular && (
              <button
                type="button"
                onClick={() => setShareOpen(true)}
                className="flex cursor-pointer items-center gap-1 whitespace-nowrap text-[13px] font-semibold text-blue hover:underline"
              >
                <Share2 size={13} /> Compartir
              </button>
            )}
            <button
              type="button"
              onClick={() => openEdit(causa.id)}
              className="cursor-pointer whitespace-nowrap text-[13px] font-semibold text-blue hover:underline"
            >
              Editar causa
            </button>
          </span>
        </div>
      </div>

      {(urgency === "red" || urgency === "amber") && (
        <AlertCard
          variant={causa.tipo_vencimiento === "Recordatorio" ? "blue" : urgency === "red" ? "red" : "amber"}
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

      <CardSection
        title="Agenda / Vencimientos"
        titleInfo={<InfoTooltip text="Audiencias y vencimientos generan alertas por email y afectan el semáforo. Los recordatorios son avisos internos sin email." />}
        ref={vencimientosRef}
      >
        <div className="px-[14px] pb-4 pt-2">
          <VencimientosSection causaId={causa.id} esTitular={esTitular} />
        </div>
      </CardSection>

      <ColaboradoresList
        owner={causa.owner}
        shares={shares}
        loading={sharesLoading}
        esTitular={esTitular}
        onRevoke={revocar}
      />

      <MovimientosSection causaId={causa.id} userId={userId} />

      <GestionEconomicaSection causaId={causa.id} />

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

      {causa.editor && (
        <p className="mx-3 mt-3 text-[12px] text-muted">
          Última edición: {causa.editor.nombre_completo ?? causa.editor.email} · {formatDate(causa.updated_at)}
          {causa.campo_editado && ` · ${causa.campo_editado}`}
        </p>
      )}
      {confirmDialog}
    </div>
  );
}

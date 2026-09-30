import { ClipboardList } from "lucide-react";
import OpenCausaButton from "@/components/causas/OpenCausaButton";
import EmptyState from "@/components/ui/EmptyState";
import { createClient } from "@/services/supabase/server";
import { formatDateTime, getInitials } from "@/utils/formatters";
import type { MovimientoConAutor } from "@/types";

type MovimientoConCausa = MovimientoConAutor & { causa: { id: string; caratula: string } | null };

// Actividad reciente de todas las causas (propias y compartidas)
export default async function MovimientosPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("movimientos")
    .select(
      "*, autor:profiles!movimientos_autor_id_fkey(id, nombre_completo, email), causa:causas(id, caratula)",
    )
    .order("fecha", { ascending: false })
    .limit(100)
    .returns<MovimientoConCausa[]>();

  if (error) throw new Error(`No se pudieron cargar los movimientos: ${error.message}`);

  if (data.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Todavía no hay movimientos"
        description="Cuando cargues movimientos en tus causas, vas a ver acá la actividad reciente."
      />
    );
  }

  return (
    <div className="mx-auto max-w-[760px] p-3">
      <div className="overflow-hidden rounded-[7px] border border-border bg-card">
        <div className="border-b border-border px-[13px] py-[9px] text-[12px] font-bold tracking-[.4px] text-sub uppercase">
          Actividad reciente ({data.length})
        </div>
        {data.map((m) => {
          const autor = m.autor?.nombre_completo ?? m.autor?.email ?? "—";
          return (
            <div key={m.id} className="border-b border-slate-100 px-[13px] py-[10px] last:border-b-0">
              {m.causa && (
                <OpenCausaButton causaId={m.causa.id} className="mb-[2px] block max-w-full truncate text-[12.5px] font-semibold text-blue hover:underline">
                  {m.causa.caratula}
                </OpenCausaButton>
              )}
              <div className="text-[13.5px] leading-[1.4] break-words whitespace-pre-line text-text">{m.descripcion}</div>
              <div className="mt-[2px] text-[12px] text-muted">
                {formatDateTime(m.fecha)} · <span title={autor}>{getInitials(m.autor?.nombre_completo, autor[0]?.toUpperCase())}</span>
                {m.tipo && ` · ${m.tipo}`}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

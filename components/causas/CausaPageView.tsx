"use client";

import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useCausasStore } from "@/store/causasStore";
import type { ClienteOption } from "@/services/supabase/clientes";
import type { CausaConRelaciones } from "@/types";
import CausaDetalle from "./CausaDetalle";
import CausaForm from "./CausaForm";
import type { Liquidacion, OrdenPago } from "@/utils/liquidaciones";

interface Props {
  causa: CausaConRelaciones;
  clientes: ClienteOption[];
  userId: string;
  finanzas: { liquidaciones: Liquidacion[]; ordenes: OrdenPago[] };
}

// Página de una causa: enlace para volver al listado arriba, y el detalle debajo.
export default function CausaPageView({ causa, clientes, userId, finanzas }: Props) {
  const formOpen = useCausasStore((s) => s.formOpen);
  const editingId = useCausasStore((s) => s.editingId);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-4 py-4 sm:px-6">
      <Link href="/causas" className="mb-3 inline-flex items-center gap-1 text-[13px] font-semibold text-blue hover:underline">
        <ChevronLeft size={15} strokeWidth={2} aria-hidden />
        Volver al listado
      </Link>

      <CausaDetalle causa={causa} userId={userId} finanzas={finanzas} />

      {formOpen && <CausaForm key={editingId ?? "nueva"} causa={causa} clientes={clientes} userId={userId} />}
    </div>
  );
}

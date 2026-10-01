"use client";

import { UserMinus } from "lucide-react";
import CardSection from "@/components/ui/CardSection";
import { getInitials } from "@/utils/formatters";
import type { CausaShareConUsuario } from "@/types";

interface ColaboradoresListProps {
  owner: { nombre_completo: string | null; email: string } | null;
  shares: CausaShareConUsuario[];
  loading: boolean;
  esTitular: boolean; // solo el titular puede quitar accesos
  onRevoke: (share: CausaShareConUsuario) => void;
}

function Persona({ nombre, email, etiqueta, action }: { nombre: string | null; email: string; etiqueta?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] border-b border-slate-100 px-[13px] py-[9px] last:border-b-0">
      <span className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-full bg-linear-135 from-blue to-pur text-[12px] font-bold text-white">
        {getInitials(nombre, email[0]?.toUpperCase())}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-text">{nombre ?? email}</span>
        {nombre && <span className="block truncate text-[12.5px] text-muted">{email}</span>}
      </span>
      {etiqueta && (
        <span className="shrink-0 rounded-[4px] bg-[#FEF9C3] px-2 py-[2px] text-[12px] font-medium text-[#713F12]">{etiqueta}</span>
      )}
      {action}
    </div>
  );
}

// Quiénes tienen acceso a la causa: titular + colaboradores
export default function ColaboradoresList({ owner, shares, loading, esTitular, onRevoke }: ColaboradoresListProps) {
  // Una causa sin colaboradores no necesita esta tarjeta (solo se ve cuando está compartida)
  if (!loading && shares.length === 0) return null;

  return (
    <CardSection title="Acceso compartido">
      {owner && <Persona nombre={owner.nombre_completo} email={owner.email} etiqueta="Titular" />}
      {loading ? (
        <div className="px-[13px] py-3">
          <div className="h-[14px] w-1/2 animate-pulse rounded bg-slate-100" />
        </div>
      ) : (
        shares.map((s) =>
          s.usuario ? (
            <Persona
              key={s.id}
              nombre={s.usuario.nombre_completo}
              email={s.usuario.email}
              action={
                esTitular && (
                  <button
                    type="button"
                    onClick={() => onRevoke(s)}
                    aria-label={`Quitar acceso a ${s.usuario.nombre_completo ?? s.usuario.email}`}
                    title="Quitar acceso"
                    className="flex cursor-pointer text-muted hover:text-red"
                  >
                    <UserMinus size={16} />
                  </button>
                )
              }
            />
          ) : null,
        )
      )}
    </CardSection>
  );
}

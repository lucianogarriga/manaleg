"use client";

import { UserMinus } from "lucide-react";
import CardSection from "@/components/ui/CardSection";
import { getInitials } from "@/utils/formatters";
import type { CausaShareConUsuario } from "@/types";

function Persona({ nombre, email, etiqueta, action }: { nombre: string | null; email: string; etiqueta?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-[10px] py-[8px] last:pb-0">
      <span className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-border bg-card text-[9px] font-semibold text-sub shadow-sm">
        {getInitials(nombre, email[0]?.toUpperCase())}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14px] font-medium text-text">{nombre ?? email}</span>
        {nombre && <span className="block truncate text-[12.5px] text-muted">{email}</span>}
      </span>
      {etiqueta && (
        <span className="shrink-0 rounded-[4px] px-2 py-[2px] text-[12px] font-medium" style={{ background: "var(--color-amb-lt)", color: "var(--color-amb)" }}>{etiqueta}</span>
      )}
      {action}
    </div>
  );
}

interface ColaboradoresListProps {
  owner: { nombre_completo: string | null; email: string } | null;
  shares: CausaShareConUsuario[];
  loading: boolean;
  esTitular: boolean;
  onRevoke: (share: CausaShareConUsuario) => void;
  naked?: boolean; // si true, no envuelve en CardSection
}

const PersonasList = ({ owner, shares, loading, esTitular, onRevoke }: Omit<ColaboradoresListProps, "naked">) => (
  <>
    {owner && <Persona nombre={owner.nombre_completo} email={owner.email} etiqueta="Titular" />}
    {loading ? (
      <div className="py-2">
        <div className="h-[14px] w-1/2 animate-pulse rounded bg-border" />
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
  </>
);

// Quiénes tienen acceso a la causa: titular + colaboradores
export default function ColaboradoresList({ naked = false, ...props }: ColaboradoresListProps) {
  if (!props.loading && props.shares.length === 0) return null;

  if (naked) {
    return (
      <div className="px-[14px] pb-3 pt-1">
        <PersonasList {...props} />
      </div>
    );
  }

  return (
    <CardSection title="Acceso compartido">
      <div className="px-[13px] py-[6px]">
        <PersonasList {...props} />
      </div>
    </CardSection>
  );
}

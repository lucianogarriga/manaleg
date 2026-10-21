"use client";

import { useState, useTransition } from "react";
import Modal from "@/components/ui/Modal";
import { TextField } from "@/components/ui/FormControls";
import { actualizarValorJusCordoba, guardarValorJus } from "@/app/(app)/ajustes/actions";
import { useAuthStore } from "@/store/authStore";
import { useUIStore } from "@/store/uiStore";

function parseValor(texto: string): number | null {
  const limpio = texto.trim();
  if (limpio === "") return null;
  return Number(limpio.replace(/\./g, "").replace(",", "."));
}

export default function ValorJusModal({ onClose }: { onClose: () => void }) {
  const profile = useAuthStore((s) => s.profile);
  const setProfile = useAuthStore((s) => s.setProfile);
  const showToast = useUIStore((s) => s.showToast);
  const [referencia, setReferencia] = useState(profile?.jus_referencia ?? "");
  const [valor, setValor] = useState(profile?.jus_valor != null ? String(profile.jus_valor) : "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const traerDelColegio = () => {
    setError(null);
    startTransition(async () => {
      const r = await actualizarValorJusCordoba();
      if (r.error || r.valor === undefined) {
        setError(r.error ?? "No se pudo actualizar el valor.");
        return;
      }
      if (profile) {
        setProfile({ ...profile, jus_referencia: "Córdoba", jus_valor: r.valor, jus_valor_fecha: r.fecha ?? null });
      }
      showToast({ message: "Valor del JUS actualizado desde el Colegio de Abogados de Córdoba." });
      onClose();
    });
  };

  const guardar = () => {
    const n = parseValor(valor);
    if (n !== null && (!Number.isFinite(n) || n <= 0)) {
      setError("Ingresá un valor en pesos mayor a cero, o dejalo vacío para borrarlo.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await guardarValorJus({ referencia, valor: n });
      if (r.error) {
        setError(r.error);
        return;
      }
      if (profile) {
        setProfile({ ...profile, jus_referencia: referencia.trim() || null, jus_valor: n, jus_valor_fecha: r.fecha ?? null });
      }
      showToast({ message: n === null ? "Valor del JUS borrado." : "Valor del JUS guardado." });
      onClose();
    });
  };

  return (
    <Modal
      open
      title="Valor del JUS"
      onClose={onClose}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button type="button" onClick={traerDelColegio} disabled={pending}
            className="cursor-pointer rounded-[6px] border border-blue px-3 py-[6px] text-[12.5px] font-semibold text-blue hover:bg-blue-lt disabled:opacity-50">
            Actualizar desde el Colegio (Córdoba)
          </button>
          <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-[6px] px-3 py-[6px] text-[13px] text-sub hover:text-text">
            Cancelar
          </button>
          <button type="button" onClick={guardar} disabled={pending}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50">
            {pending ? "Guardando…" : "Guardar"}
          </button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3 p-4">
        <p className="text-[13px] text-sub">
          Se muestra en la parte superior del dashboard y se sugiere al cargar honorarios en JUS. Actualizalo a mano cada 30 o 60 días.
        </p>
        <TextField label="Jurisdicción" value={referencia} onChange={(e) => setReferencia(e.target.value)} placeholder="Córdoba" maxLength={60} />
        <TextField label="Valor en pesos" value={valor} onChange={(e) => setValor(e.target.value)} inputMode="decimal" placeholder="45000" />
        {error && <p className="text-[12.5px] text-red">{error}</p>}
      </div>
    </Modal>
  );
}

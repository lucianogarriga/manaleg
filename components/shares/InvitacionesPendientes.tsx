"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/ui/Modal";
import {
  aceptarInvitaciones,
  listarInvitacionesPendientes,
  rechazarInvitaciones,
  type InvitacionPendiente,
} from "@/app/(app)/causas/invitacionesActions";
import { useUIStore } from "@/store/uiStore";

export default function InvitacionesPendientes() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);
  const [pendientes, setPendientes] = useState<InvitacionPendiente[]>([]);
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set());
  const [abierto, setAbierto] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let vivo = true;
    listarInvitacionesPendientes()
      .then((lista) => {
        if (!vivo || lista.length === 0) return;
        setPendientes(lista);
        setSeleccion(new Set(lista.map((i) => i.id)));
        setAbierto(true);
      })
      .catch(() => undefined);
    return () => { vivo = false; };
  }, []);

  const alternar = (id: string) => {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) nuevo.delete(id);
      else nuevo.add(id);
      return nuevo;
    });
  };

  const procesar = (ids: string[], accion: "aceptar" | "rechazar") => {
    if (ids.length === 0) return;
    startTransition(async () => {
      const r = accion === "aceptar" ? await aceptarInvitaciones(ids) : await rechazarInvitaciones(ids);
      if (r.error) {
        showToast({ message: r.error });
        return;
      }
      showToast({
        message: accion === "aceptar"
          ? `${ids.length} ${ids.length === 1 ? "causa agregada" : "causas agregadas"} a tu lista.`
          : "Invitación rechazada.",
      });
      const restantes = pendientes.filter((i) => !ids.includes(i.id));
      setPendientes(restantes);
      setSeleccion(new Set(restantes.map((i) => i.id)));
      if (restantes.length === 0) setAbierto(false);
      router.refresh();
    });
  };

  const elegidas = [...seleccion];

  return (
    <Modal
      open={abierto && pendientes.length > 0}
      title={pendientes.length === 1 ? "Tenés una invitación a una causa" : `Tenés ${pendientes.length} invitaciones a causas`}
      onClose={() => setAbierto(false)}
      footer={
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button type="button" onClick={() => setAbierto(false)}
            className="cursor-pointer rounded-[6px] px-3 py-[6px] text-[13px] text-sub hover:text-text">
            Más tarde
          </button>
          <button type="button" disabled={pending || elegidas.length === 0} onClick={() => procesar(elegidas, "rechazar")}
            className="cursor-pointer rounded-[6px] border border-border bg-card px-3 py-[6px] text-[13px] font-medium text-sub hover:bg-bg disabled:opacity-50">
            Rechazar
          </button>
          <button type="button" disabled={pending || elegidas.length === 0} onClick={() => procesar(elegidas, "aceptar")}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[13px] font-semibold text-on-primary hover:opacity-90 disabled:opacity-50">
            {pending ? "Procesando…" : `Aceptar${elegidas.length > 1 ? ` (${elegidas.length})` : ""}`}
          </button>
        </div>
      }
    >
      <p className="mb-3 text-[13px] text-sub">
        Al aceptar, las causas se suman a tu lista con acceso compartido. Podés desmarcar las que no quieras.
      </p>
      <ul className="flex flex-col divide-y divide-border rounded-[8px] border border-border">
        {pendientes.map((i) => (
          <li key={i.id}>
            <label className="flex cursor-pointer items-start gap-3 px-3 py-[10px]">
              <input
                type="checkbox"
                checked={seleccion.has(i.id)}
                onChange={() => alternar(i.id)}
                className="mt-[3px] h-[14px] w-[14px] shrink-0 accent-blue"
              />
              <span className="min-w-0">
                <span className="block truncate text-[14px] font-semibold text-text">{i.caratula}</span>
                <span className="block text-[12px] text-muted">
                  {i.nro_expediente ? `${i.nro_expediente} · ` : ""}Invitado por {i.invitado_por}
                </span>
              </span>
            </label>
          </li>
        ))}
      </ul>
    </Modal>
  );
}

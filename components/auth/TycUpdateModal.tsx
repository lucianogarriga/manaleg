"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Scale } from "lucide-react";
import { acceptUpdatedTyc } from "@/app/tyc-update/actions";
import { CURRENT_TYC_VERSION } from "@/utils/constants";

// Modal bloqueante: aparece sobre la app a quien aceptó una versión anterior de T&C o PP.
// Hasta que tilde y acepte, no puede seguir usando la aplicación.
export default function TycUpdateModal() {
  const router = useRouter();
  const [acepta, setAcepta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function aceptar() {
    setError(null);
    startTransition(async () => {
      const res = await acceptUpdatedTyc();
      if (res.error) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tyc-update-titulo"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
    >
      <div className="max-h-[90dvh] w-full max-w-[520px] overflow-y-auto rounded-[12px] border border-border bg-card p-6 shadow-lg">
        <div className="mb-5 flex items-center gap-2">
          <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-blue">
            <Scale size={16} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-[16px] font-bold tracking-[.4px] text-text">MANALEG</span>
        </div>

        <h2 id="tyc-update-titulo" className="mb-2 text-[20px] font-bold text-text">
          Actualizamos los Términos y la Política de Privacidad
        </h2>
        <p className="mb-4 text-[13.5px] leading-[1.6] text-sub">
          Publicamos la versión <strong className="text-text">{CURRENT_TYC_VERSION}</strong>, vigente desde el 18 de octubre de 2026. Antes de seguir usando MANALEG, leela y aceptala.
        </p>

        <p className="mb-2 text-[13px] font-semibold text-text">Qué cambió:</p>
        <ul className="mb-4 list-disc space-y-2 pl-5 text-[13px] leading-[1.55] text-sub">
          <li>
            <strong className="text-text">Presencia en causas compartidas:</strong> quienes comparten una causa pueden ver, con tu nombre, que la tenés abierta. Viene desactivada por defecto: solo se muestra si la activás en cada causa.
          </li>
          <li>
            <strong className="text-text">Panel de estadísticas internas:</strong> aclaramos que no procesa datos personales.
          </li>
          <li>
            <strong className="text-text">Plazos y proveedores:</strong> actualizamos el plazo de respuesta a solicitudes de acceso y la descripción de los proveedores.
          </li>
        </ul>

        <div className="mb-5 flex flex-wrap gap-4">
          <Link href="/legal/terminos" target="_blank" className="text-[13px] font-semibold text-blue hover:underline">
            Términos y Condiciones →
          </Link>
          <Link href="/legal/privacidad" target="_blank" className="text-[13px] font-semibold text-blue hover:underline">
            Política de Privacidad →
          </Link>
        </div>

        <label className="mb-5 flex cursor-pointer items-start gap-2.5 text-[13px] leading-[1.5] text-text">
          <input
            type="checkbox"
            checked={acepta}
            onChange={(e) => setAcepta(e.target.checked)}
            className="mt-[3px] h-[14px] w-[14px] shrink-0 accent-blue"
          />
          <span>
            Leí y acepto los Términos y Condiciones y la Política de Privacidad, versión {CURRENT_TYC_VERSION}.
          </span>
        </label>

        {error && (
          <p className="mb-4 rounded-[8px] px-3 py-2 text-[13px]" style={{ background: "var(--color-red-lt)", color: "var(--color-red)" }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={aceptar}
          disabled={!acepta || pending}
          className="w-full cursor-pointer rounded-[8px] bg-blue py-[10px] text-[14px] font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? "Registrando..." : "Aceptar y continuar"}
        </button>
      </div>
    </div>
  );
}

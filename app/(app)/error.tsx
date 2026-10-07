"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AppError({ error, reset }: ErrorProps) {
  const router = useRouter();

  useEffect(() => {
    // Loguear el error para debugging (en producción reemplazar con Sentry u otro)
    console.error("[AppError]", error);
  }, [error]);

  return (
    <div
      className="flex min-h-full flex-col items-center justify-center px-6 py-20"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Ícono */}
      <div
        className="mb-6 flex h-16 w-16 items-center justify-center rounded-[18px]"
        style={{ background: "color-mix(in srgb, var(--color-red) 10%, transparent)", border: "1px solid color-mix(in srgb, var(--color-red) 20%, transparent)" }}
      >
        <AlertTriangle size={28} style={{ color: "var(--color-red)" }} strokeWidth={1.5} />
      </div>

      {/* Texto */}
      <h1
        className="mb-2 text-center text-[22px] font-bold"
        style={{ color: "var(--color-text)" }}
      >
        Algo salió mal
      </h1>
      <p
        className="mb-1 max-w-[400px] text-center text-[14px] leading-relaxed"
        style={{ color: "var(--color-sub)" }}
      >
        Ocurrió un error inesperado al cargar esta sección. Puede ser un problema temporal de conexión.
      </p>

      {/* Digest para soporte */}
      {error.digest && (
        <p className="mb-8 text-center text-[11px]" style={{ color: "var(--color-muted)" }}>
          Código de referencia: <span className="font-mono">{error.digest}</span>
        </p>
      )}
      {!error.digest && <div className="mb-8" />}

      {/* Acciones */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="flex items-center gap-2 rounded-[8px] px-4 py-[9px] text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "var(--color-blue)" }}
        >
          <RotateCcw size={14} strokeWidth={2.5} />
          Reintentar
        </button>
        <button
          type="button"
          onClick={() => router.push("/")}
          className="flex items-center gap-2 rounded-[8px] border px-4 py-[9px] text-[13.5px] font-medium transition-colors"
          style={{
            borderColor: "var(--color-border)",
            color: "var(--color-sub)",
            background: "var(--color-card)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-row)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "var(--color-card)")}
        >
          <Home size={14} strokeWidth={2} />
          Ir al inicio
        </button>
      </div>
    </div>
  );
}

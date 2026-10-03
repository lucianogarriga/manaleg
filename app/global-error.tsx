"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

// global-error.tsx reemplaza el layout raíz completo cuando hay un error
// catastrófico (ej. falla el propio layout/AppLayout). Por eso no puede usar
// las CSS custom properties del layout y define sus propios estilos inline.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          background: "#0f172a",
          color: "#f1f5f9",
          fontFamily: "-apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
          padding: "24px",
        }}
      >
        {/* Logo */}
        <div
          style={{
            width: 44,
            height: 44,
            background: "#2563eb",
            borderRadius: 11,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 800,
            fontSize: 20,
            color: "#fff",
            marginBottom: 28,
          }}
        >
          M
        </div>

        {/* Ícono de error */}
        <div
          style={{
            width: 60,
            height: 60,
            background: "rgba(220,38,38,.15)",
            border: "1px solid rgba(220,38,38,.3)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
          }}
        >
          <AlertTriangle size={26} color="#f87171" strokeWidth={1.5} />
        </div>

        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            margin: "0 0 8px",
            textAlign: "center",
          }}
        >
          Error crítico de la aplicación
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "#94a3b8",
            textAlign: "center",
            maxWidth: 380,
            lineHeight: 1.6,
            margin: "0 0 6px",
          }}
        >
          Ocurrió un error inesperado que impide cargar MANALEG. Intentá recargar la página.
        </p>

        {error.digest && (
          <p style={{ fontSize: 11, color: "#475569", margin: "0 0 28px", fontFamily: "monospace" }}>
            Ref: {error.digest}
          </p>
        )}
        {!error.digest && <div style={{ marginBottom: 28 }} />}

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={reset}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <RotateCcw size={14} strokeWidth={2.5} />
            Reintentar
          </button>
          <button
            onClick={() => window.location.href = "/"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background: "transparent",
              color: "#94a3b8",
              border: "1px solid #334155",
              borderRadius: 8,
              padding: "10px 20px",
              fontSize: 13.5,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Ir al inicio
          </button>
        </div>
      </body>
    </html>
  );
}

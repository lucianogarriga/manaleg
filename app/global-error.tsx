"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f8fafc" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100dvh",
            padding: "2rem",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "rgba(220,38,38,.1)",
              border: "1px solid rgba(220,38,38,.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              fontSize: 28,
            }}
          >
            ⚠
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: "#0f172a" }}>
            Error crítico
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 400, lineHeight: 1.6, marginBottom: 8 }}>
            Ocurrió un error inesperado. Por favor recargá la página.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, color: "#94a3b8", marginBottom: 32, fontFamily: "monospace" }}>
              Ref: {error.digest}
            </p>
          )}
          {!error.digest && <div style={{ marginBottom: 32 }} />}
          <button
            onClick={reset}
            style={{
              background: "#2563eb",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "9px 20px",
              fontSize: 13.5,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}

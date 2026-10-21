"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/services/supabase/client";

// Verificación en dos pasos (TOTP) para el panel de admin.
// Si no hay factor configurado, muestra el QR para registrarlo. Si ya existe, pide el código.
export default function MfaAdmin() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [secreto, setSecreto] = useState<string | null>(null);
  const [codigo, setCodigo] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    (async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        setError("No se pudieron leer los factores de verificación.");
        setCargando(false);
        return;
      }
      const verificado = data.totp[0]; // listFactors().totp solo trae factores verificados
      if (verificado) {
        setFactorId(verificado.id);
        setCargando(false);
        return;
      }
      // Sin factor verificado: se registra uno nuevo (descartando intentos sin terminar).
      for (const f of data.all.filter((x) => x.factor_type === "totp" && x.status === "unverified")) {
        await supabase.auth.mfa.unenroll({ factorId: f.id });
      }
      const { data: nuevo, error: errEnroll } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Admin MANALEG",
      });
      if (errEnroll || !nuevo) {
        setError("No se pudo iniciar la configuración de la verificación en dos pasos.");
        setCargando(false);
        return;
      }
      setFactorId(nuevo.id);
      setQr(nuevo.totp.qr_code);
      setSecreto(nuevo.totp.secret);
      setCargando(false);
    })();
  }, []);

  const verificar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setCargando(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: codigo.trim() });
    if (error) {
      setError("Código incorrecto o vencido. Probá con el código actual de tu app.");
      setCargando(false);
      return;
    }
    // La sesión pasa a aal2: se vuelve a renderizar el panel del servidor.
    router.refresh();
  };

  return (
    <div className="mx-auto flex max-w-[480px] flex-col gap-4 p-6">
      <h1 className="text-[20px] font-bold text-text">Verificación en dos pasos</h1>

      {qr && (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
          <p className="text-center text-[13px] text-sub">
            Escaneá este código con tu app de autenticación (Google Authenticator, Authy, Microsoft Authenticator, etc.).
          </p>
          {/* qr_code es un SVG que genera Supabase */}
          <img src={qr} alt="Código QR para la verificación en dos pasos" className="h-[180px] w-[180px] bg-white p-2" />
          {secreto && (
            <p className="text-center text-[12px] text-muted">
              Si no podés escanearlo, ingresá esta clave manualmente: <span className="font-mono text-sub">{secreto}</span>
            </p>
          )}
        </div>
      )}

      {!cargando && factorId && (
        <form onSubmit={verificar} className="flex flex-col gap-3">
          <label className="text-[13px] font-semibold text-text" htmlFor="codigo-mfa">
            Código de 6 dígitos
          </label>
          <input
            id="codigo-mfa"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]{6}"
            maxLength={6}
            required
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.replace(/\D/g, ""))}
            className="rounded-[6px] border border-border bg-card px-3 py-2 text-center font-mono text-[18px] tracking-[.3em] text-text"
          />
          <button
            type="submit"
            disabled={cargando || codigo.length !== 6}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-2 text-[14px] font-semibold text-bg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? "Verificando…" : "Verificar"}
          </button>
        </form>
      )}

      {error && <p className="text-[13px] text-red">{error}</p>}
    </div>
  );
}

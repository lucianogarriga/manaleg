"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useActionState } from "react";
import { Mail, Lock, Scale, AlertCircle } from "lucide-react";
import { login } from "../actions";
import AuthField from "@/components/auth/AuthField";
import FormAlert from "@/components/auth/FormAlert";
import SubmitButton from "@/components/auth/SubmitButton";

// Debe coincidir con el rate limit configurado en Supabase Dashboard → Auth → Rate Limits
const MAX_INTENTOS = 5;

const ERROR_CREDENCIALES = "Email o contraseña incorrectos.";

function LoginTransition() {
  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <div
          className="auth-glow-1 absolute h-[640px] w-[640px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,.16) 0%, transparent 68%)" }}
        />
        <div
          className="auth-glow-2 absolute h-[420px] w-[420px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(96,165,250,.12) 0%, transparent 68%)" }}
        />
        <div
          className="auth-glow-1 absolute h-[240px] w-[240px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(37,99,235,.22) 0%, transparent 68%)", animationDelay: "0.8s" }}
        />
      </div>
      <div className="auth-fade-in relative flex flex-col items-center gap-5">
        <div className="auth-logo flex h-[56px] w-[56px] items-center justify-center rounded-[16px] bg-blue">
          <Scale size={26} strokeWidth={2} className="text-white" />
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[18px] font-bold text-text">Manaleg</span>
          <span className="text-[13px] text-muted">
            <span className="auth-dots">Preparando tu espacio</span>
          </span>
        </div>
        <div className="mt-2 h-[3px] w-[160px] overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-blue"
            style={{ width: "40%", animation: "auth-progress 1.4s ease-in-out infinite" }}
          />
        </div>
      </div>
      <style>{`@keyframes auth-progress { 0% { margin-left:-40%; } 100% { margin-left:140%; } }`}</style>
    </div>
  );
}

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});
  const [showTransition, setShowTransition] = useState(false);
  const [intentos, setIntentos] = useState(0);

  useEffect(() => {
    if (pending) setShowTransition(true);
  }, [pending]);

  // Cuenta solo los errores de credenciales incorrectas (no rate limit, no email sin confirmar, etc.)
  useEffect(() => {
    if (state.error === ERROR_CREDENCIALES) {
      setIntentos((n) => n + 1);
    }
  }, [state]);

  const restantes = MAX_INTENTOS - intentos;
  const esBloqueoPorRateLimit = state.error?.toLowerCase().includes("demasiados intentos");
  const mostrarRestantes = intentos > 0 && restantes > 0 && state.error === ERROR_CREDENCIALES;

  return (
    <>
      {showTransition && <LoginTransition />}

      <form action={action} className="space-y-5">
        <div className="mb-2">
          <h1 className="text-[24px] font-bold" style={{ color: "#0f172a" }}>Bienvenido</h1>
          <p className="mt-1 text-[13.5px]" style={{ color: "#94a3b8" }}>Ingresá a tu cuenta para continuar</p>
        </div>

        {/* Error general — excepto el de credenciales, que se muestra inline */}
        {state.error && !esBloqueoPorRateLimit && state.error !== ERROR_CREDENCIALES && (
          <FormAlert state={state} />
        )}

        {/* Bloqueo por rate limit */}
        {esBloqueoPorRateLimit && (
          <div
            className="flex items-start gap-2 rounded-[9px] px-3 py-[10px] text-[13px]"
            style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c" }}
          >
            <AlertCircle size={14} className="mt-[1px] shrink-0" />
            <span>{state.error}</span>
          </div>
        )}

        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@email.com"
          defaultValue={state.values?.email}
          icon={Mail}
          required
        />

        <div className="space-y-[6px]">
          <AuthField
            label="Contraseña"
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            icon={Lock}
            required
          />
          {/* Mensaje de intentos restantes */}
          {mostrarRestantes && (
            <p className="flex items-center gap-[5px] text-[12px] font-medium" style={{ color: "#b91c1c" }}>
              <AlertCircle size={12} className="shrink-0" />
              Contraseña incorrecta.{" "}
              {restantes === 1
                ? "Te queda 1 intento antes de quedar bloqueado."
                : `Te quedan ${restantes} intentos.`}
            </p>
          )}
        </div>

        <SubmitButton pending={pending} pendingText="Ingresando…">
          Ingresar
        </SubmitButton>

        <p className="pt-1 text-center text-[13px]" style={{ color: "#64748b" }}>
          ¿No tenés cuenta?{" "}
          <Link href="/register" className="font-semibold hover:underline" style={{ color: "#2563eb" }}>
            Registrate gratis
          </Link>
        </p>
      </form>
    </>
  );
}

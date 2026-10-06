"use client";

import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { User, Mail, Lock } from "lucide-react";
import { register } from "../actions";
import AuthField from "@/components/auth/AuthField";
import FormAlert from "@/components/auth/FormAlert";
import SubmitButton from "@/components/auth/SubmitButton";
import LegalModal from "@/components/ui/LegalModal";

export default function RegisterPage() {
  const [state, action] = useActionState(register, {});
  const [, startTransition] = useTransition();
  const [legalModal, setLegalModal] = useState<"terminos" | "privacidad" | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);

  if (state.message) {
    return (
      <div className="space-y-4">
        <div className="mb-2">
          <h1 className="text-[24px] font-bold" style={{ color: "#0f172a" }}>Revisá tu email</h1>
          <p className="mt-1 text-[13.5px]" style={{ color: "#94a3b8" }}>Te enviamos un link de confirmación.</p>
        </div>
        <FormAlert state={state} />
        <Link href="/login" className="block text-center text-[13px] font-semibold hover:underline" style={{ color: "#2563eb" }}>
          Volver a ingresar
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const errs: Record<string, string> = {};

    const nombre = (fd.get("nombre") as string ?? "").trim();
    const email = (fd.get("email") as string ?? "").trim();
    const password = fd.get("password") as string ?? "";
    const confirm = fd.get("confirm") as string ?? "";
    const tyc = fd.get("tyc");

    if (!nombre) errs.nombre = "Ingresá tu nombre completo.";
    if (!email) errs.email = "Ingresá tu email.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "El email no es válido.";
    if (!password) errs.password = "Ingresá una contraseña.";
    else if (password.length < 8) errs.password = "Mínimo 8 caracteres.";
    if (!confirm) errs.confirm = "Repetí la contraseña.";
    else if (password && password !== confirm) errs.confirm = "Las contraseñas no coinciden.";
    if (!tyc) errs.tyc = "Debés aceptar los términos y condiciones para continuar.";

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setFieldErrors({});
    setPending(true);
    startTransition(() => {
      action(fd);
      setPending(false);
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <div className="mb-2">
          <h1 className="text-[24px] font-bold" style={{ color: "#0f172a" }}>Crear cuenta</h1>
          <p className="mt-1 text-[13.5px]" style={{ color: "#94a3b8" }}>Empezá a gestionar tus causas hoy</p>
        </div>

        <FormAlert state={state} />

        <AuthField
          label="Nombre completo"
          name="nombre"
          autoComplete="name"
          placeholder="Juan Pérez"
          defaultValue={state.values?.nombre}
          icon={User}
          error={fieldErrors.nombre}
        />
        <AuthField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="nombre@email.com"
          defaultValue={state.values?.email}
          icon={Mail}
          error={fieldErrors.email}
        />
        <AuthField
          label="Contraseña"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          icon={Lock}
          error={fieldErrors.password}
        />
        <AuthField
          label="Repetir contraseña"
          name="confirm"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={Lock}
          error={fieldErrors.confirm}
        />

        {/* Checkbox T&C */}
        <div>
          <label className="flex cursor-pointer select-none items-start gap-[10px]">
            <input
              type="checkbox"
              name="tyc"
              value="on"
              style={{ colorScheme: "light", accentColor: "#2563eb" }}
              className="mt-[3px] h-[15px] w-[15px] shrink-0 cursor-pointer"
              onChange={() => {
                if (fieldErrors.tyc) setFieldErrors((p) => ({ ...p, tyc: "" }));
              }}
            />
            <span className="text-[12.5px] leading-[1.5]" style={{ color: "#64748b" }}>
              Leí y acepto los{" "}
              <button
                type="button"
                onClick={() => setLegalModal("terminos")}
                className="cursor-pointer font-semibold hover:underline"
                style={{ color: "#2563eb" }}
              >
                Términos y Condiciones
              </button>{" "}
              y la{" "}
              <button
                type="button"
                onClick={() => setLegalModal("privacidad")}
                className="cursor-pointer font-semibold hover:underline"
                style={{ color: "#2563eb" }}
              >
                Política de Privacidad
              </button>
              .
            </span>
          </label>
          {fieldErrors.tyc && (
            <p className="mt-[5px] text-[12px]" style={{ color: "#ef4444" }}>{fieldErrors.tyc}</p>
          )}
        </div>

        <SubmitButton pending={pending} pendingText="Creando cuenta…">
          Crear cuenta
        </SubmitButton>

        <p className="pt-1 text-center text-[13px]" style={{ color: "#64748b" }}>
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: "#2563eb" }}>
            Ingresá
          </Link>
        </p>
      </form>
      {legalModal && <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />}
    </>
  );
}

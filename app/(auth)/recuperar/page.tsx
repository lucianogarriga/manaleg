"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { solicitarRecuperacion } from "../actions";
import AuthField from "@/components/auth/AuthField";
import FormAlert from "@/components/auth/FormAlert";
import SubmitButton from "@/components/auth/SubmitButton";

export default function RecuperarPage() {
  const [state, action, pending] = useActionState(solicitarRecuperacion, {});

  return (
    <form action={action} className="space-y-5">
      <div className="mb-2">
        <h1 className="text-[24px] font-bold" style={{ color: "#0f172a" }}>Recuperar contraseña</h1>
        <p className="mt-1 text-[13.5px]" style={{ color: "#94a3b8" }}>
          Ingresá el email de tu cuenta y te enviamos un enlace para cambiarla.
        </p>
      </div>

      <FormAlert state={state} />

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

      <SubmitButton pending={pending} pendingText="Enviando…">
        Enviar enlace
      </SubmitButton>

      <p className="pt-1 text-center text-[13px]" style={{ color: "#64748b" }}>
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "#0284c7" }}>
          Volver a ingresar
        </Link>
      </p>
    </form>
  );
}

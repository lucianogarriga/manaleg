"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Mail } from "lucide-react";
import { solicitarRecuperacion } from "../actions";
import AuthField from "@/components/auth/AuthField";
import FormAlert from "@/components/auth/FormAlert";
import SubmitButton from "@/components/auth/SubmitButton";
import Turnstile from "@/components/auth/Turnstile";

export default function RecuperarPage() {
  const [state, action, pending] = useActionState(solicitarRecuperacion, {});

  return (
    <form action={action} className="space-y-5">
      <div className="mb-2">
        <h1 className="text-[24px] font-bold" style={{ color: "var(--color-text)" }}>Recuperar contraseña</h1>
        <p className="mt-1 text-[13.5px]" style={{ color: "var(--color-muted)" }}>
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

      <Turnstile />
      <SubmitButton pending={pending} pendingText="Enviando…">
        Enviar enlace
      </SubmitButton>

      <p className="pt-1 text-center text-[13px]" style={{ color: "var(--color-sub)" }}>
        <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--color-blue)" }}>
          Volver a ingresar
        </Link>
      </p>
    </form>
  );
}

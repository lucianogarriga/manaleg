"use client";

import Link from "next/link";
import { useActionState } from "react";
import { register } from "../actions";
import AuthField from "@/components/auth/AuthField";
import FormAlert from "@/components/auth/FormAlert";
import SubmitButton from "@/components/auth/SubmitButton";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, {});

  if (state.message) {
    return (
      <div className="space-y-3">
        <h1 className="text-[16px] font-bold text-text">Revisá tu email</h1>
        <FormAlert state={state} />
        <Link href="/login" className="block text-center text-[13px] font-semibold text-blue">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-3">
      <h1 className="text-[16px] font-bold text-text">Crear cuenta</h1>
      <FormAlert state={state} />
      <AuthField
        label="Nombre completo"
        name="nombre"
        autoComplete="name"
        defaultValue={state.values?.nombre}
        required
      />
      <AuthField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        required
      />
      <AuthField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <AuthField
        label="Repetir contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <SubmitButton pending={pending} pendingText="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
      <p className="text-center text-[13px] text-sub">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-blue">
          Ingresá
        </Link>
      </p>
    </form>
  );
}

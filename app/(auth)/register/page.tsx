"use client";

import Link from "next/link";
import { useActionState } from "react";
import { User, Mail, Lock } from "lucide-react";
import { register } from "../actions";
import AuthField from "@/components/auth/AuthField";
import FormAlert from "@/components/auth/FormAlert";
import SubmitButton from "@/components/auth/SubmitButton";

export default function RegisterPage() {
  const [state, action, pending] = useActionState(register, {});

  if (state.message) {
    return (
      <div className="space-y-4">
        <div className="mb-2">
          <h1 className="text-[24px] font-bold text-text">Revisá tu email</h1>
          <p className="mt-1 text-[13.5px] text-muted">Te enviamos un link de confirmación.</p>
        </div>
        <FormAlert state={state} />
        <Link href="/login" className="block text-center text-[13px] font-semibold text-blue hover:underline">
          Volver a ingresar
        </Link>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      <div className="mb-2">
        <h1 className="text-[24px] font-bold text-text">Crear cuenta</h1>
        <p className="mt-1 text-[13.5px] text-muted">Empezá a gestionar tus causas hoy</p>
      </div>

      <FormAlert state={state} />

      <AuthField
        label="Nombre completo"
        name="nombre"
        autoComplete="name"
        placeholder="Juan Pérez"
        defaultValue={state.values?.nombre}
        icon={User}
        required
      />
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
      <AuthField
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="Mínimo 8 caracteres"
        icon={Lock}
        minLength={8}
        required
      />
      <AuthField
        label="Repetir contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        icon={Lock}
        minLength={8}
        required
      />

      <SubmitButton pending={pending} pendingText="Creando cuenta…">
        Crear cuenta
      </SubmitButton>

      <p className="pt-1 text-center text-[13px] text-sub">
        ¿Ya tenés cuenta?{" "}
        <Link href="/login" className="font-semibold text-blue hover:underline">
          Ingresá
        </Link>
      </p>
    </form>
  );
}

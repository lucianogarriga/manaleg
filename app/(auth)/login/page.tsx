"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login } from "../actions";
import AuthField from "@/components/auth/AuthField";
import FormAlert from "@/components/auth/FormAlert";
import SubmitButton from "@/components/auth/SubmitButton";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, {});

  return (
    <form action={action} className="space-y-3">
      <h1 className="text-[16px] font-bold text-text">Ingresar</h1>
      <FormAlert state={state} />
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
        autoComplete="current-password"
        required
      />
      <SubmitButton pending={pending} pendingText="Ingresando…">
        Ingresar
      </SubmitButton>
      <p className="text-center text-[13px] text-sub">
        ¿No tenés cuenta?{" "}
        <Link href="/register" className="font-semibold text-blue">
          Registrate
        </Link>
      </p>
    </form>
  );
}

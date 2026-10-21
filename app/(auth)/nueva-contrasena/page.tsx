"use client";

import { useActionState } from "react";
import { Lock } from "lucide-react";
import { cambiarContrasena } from "../actions";
import AuthField from "@/components/auth/AuthField";
import FormAlert from "@/components/auth/FormAlert";
import SubmitButton from "@/components/auth/SubmitButton";

export default function NuevaContrasenaPage() {
  const [state, action, pending] = useActionState(cambiarContrasena, {});

  return (
    <form action={action} className="space-y-5">
      <div className="mb-2">
        <h1 className="text-[24px] font-bold" style={{ color: "var(--color-text)" }}>Nueva contraseña</h1>
        <p className="mt-1 text-[13.5px]" style={{ color: "var(--color-muted)" }}>
          Mínimo 8 caracteres, con mayúsculas, minúsculas y números.
        </p>
      </div>

      <FormAlert state={state} />

      <AuthField
        label="Nueva contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        icon={Lock}
        required
      />

      <AuthField
        label="Repetir contraseña"
        name="confirm"
        type="password"
        autoComplete="new-password"
        placeholder="••••••••"
        icon={Lock}
        required
      />

      <SubmitButton pending={pending} pendingText="Guardando…">
        Guardar contraseña
      </SubmitButton>
    </form>
  );
}

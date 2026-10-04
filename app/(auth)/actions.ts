"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import type { FormState } from "@/types";

function traducirError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (message.includes("Email not confirmed"))
    return "Tenés que confirmar tu email antes de ingresar. Revisá tu bandeja de entrada.";
  if (message.includes("User already registered")) return "Ya existe una cuenta con ese email.";
  if (message.includes("Password should be at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (message.toLowerCase().includes("rate limit"))
    return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
  return "Ocurrió un error. Intentá de nuevo.";
}

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const values = { email };

  if (!email || !password) return { error: "Completá email y contraseña.", values };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) return { error: traducirError(error.message), values };

  redirect("/");
}

export async function register(_prev: FormState, formData: FormData): Promise<FormState> {
  const nombre = String(formData.get("nombre") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  const tyc = formData.get("tyc");

  const values = { nombre, email };

  if (!nombre || !email || !password) return { error: "Completá todos los campos.", values };
  if (password.length < 8)
    return { error: "La contraseña debe tener al menos 8 caracteres.", values };
  if (password !== confirm) return { error: "Las contraseñas no coinciden.", values };
  if (tyc !== "on") return { error: "Debés aceptar los Términos y Condiciones.", values };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre_completo: nombre,
        tyc_accepted_at: new Date().toISOString(),
        tyc_version: "1.0",
      },
      emailRedirectTo: `${origin}/api/auth/callback`,
    },
  });

  if (error) return { error: traducirError(error.message), values };

  // Si "Confirm email" está desactivado en Supabase, ya hay sesión
  if (data.session) redirect("/");

  return {
    message: `Te enviamos un email a ${email}. Confirmá tu cuenta desde el link para poder ingresar.`,
  };
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

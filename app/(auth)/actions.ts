"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import type { FormState } from "@/types";
import { dentroDelLimite, ipCliente } from "@/services/security/limites";
import { validarPassword } from "@/utils/password";

// Token del CAPTCHA (Turnstile). Undefined si el widget no está activo.
function captcha(formData: FormData): string | undefined {
  return String(formData.get("captcha_token") ?? "") || undefined;
}

function traducirError(message: string): string {
  if (message.includes("Invalid login credentials")) return "Email o contraseña incorrectos.";
  if (message.includes("Email not confirmed"))
    return "Tenés que confirmar tu email antes de ingresar. Revisá tu bandeja de entrada.";
  if (message.includes("User already registered")) return "Ya existe una cuenta con ese email.";
  if (message.includes("Password should be at least"))
    return "La contraseña debe tener al menos 6 caracteres.";
  if (message.toLowerCase().includes("rate limit"))
    return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
  if (message.toLowerCase().includes("captcha"))
    return "No pudimos verificar que sos una persona. Recargá la página e intentá de nuevo.";
  if (message.toLowerCase().includes("database error") || message.toLowerCase().includes("unexpected"))
    return "El servicio no responde en este momento. Intentá de nuevo en unos minutos.";
  return `No pudimos completar la operación (${message}). Intentá de nuevo.`;
}

const ERROR_CONEXION = "No pudimos conectarnos con el servidor. Revisá tu conexión a internet e intentá de nuevo.";

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  const values = { email };

  if (!email || !password) return { error: "Completá email y contraseña.", values };

  if (!(await dentroDelLimite(`login:${await ipCliente()}`, 20, 900)))
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a probar.", values };

  const supabase = await createClient();
  // Si no hay conexión, la librería lanza una excepción en vez de devolver error.
  let error;
  try {
    ({ error } = await supabase.auth.signInWithPassword({ email, password, options: { captchaToken: captcha(formData) } }));
  } catch {
    return { error: ERROR_CONEXION, values };
  }

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
  const errorPassword = validarPassword(password);
  if (errorPassword) return { error: errorPassword, values };
  if (password !== confirm) return { error: "Las contraseñas no coinciden.", values };
  if (tyc !== "on") return { error: "Debés aceptar los Términos y Condiciones.", values };

  if (!(await dentroDelLimite(`registro:${await ipCliente()}`, 5, 3600)))
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a probar.", values };

  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        nombre_completo: nombre,
      },
      emailRedirectTo: `${origin}/api/auth/callback`,
      captchaToken: captcha(formData),
    },
  });

  if (error) return { error: traducirError(error.message), values };

  // Si "Confirm email" está desactivado en Supabase, ya hay sesión
  if (data.session) redirect("/");

  return {
    message: `Te enviamos un email a ${email}. Confirmá tu cuenta desde el link para poder ingresar.`,
  };
}

export async function solicitarRecuperacion(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim();
  const values = { email };

  if (!email) return { error: "Ingresá tu email.", values };

  const origin = process.env.NEXT_PUBLIC_SITE_URL ?? (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/api/auth/confirm?next=/nueva-contrasena`,
    captchaToken: captcha(formData),
  });

  if (error && error.message.toLowerCase().includes("rate limit")) {
    return { error: traducirError(error.message), values };
  }

  return {
    message: "Si el email está registrado, te enviamos un enlace para cambiar la contraseña.",
    values,
  };
}

export async function cambiarContrasena(_prev: FormState, formData: FormData): Promise<FormState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const errorPassword = validarPassword(password);
  if (errorPassword) return { error: errorPassword };
  if (password !== confirm) return { error: "Las contraseñas no coinciden." };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: traducirError(error.message) };

  redirect("/causas");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

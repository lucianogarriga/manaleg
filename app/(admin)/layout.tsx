import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import AdminShell from "@/components/admin/AdminShell";
import MfaAdmin from "@/components/admin/MfaAdmin";
import { createClient } from "@/services/supabase/server";

// Área de administración: propia del resto de la app.
// Primero verifica que sea admin (si no, no existe la ruta) y después que tenga MFA verificado.
export const metadata: Metadata = {
  title: "Administración",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile.es_admin) notFound();

  const supabase = await createClient();
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal?.currentLevel !== "aal2") return <MfaAdmin />;

  return <AdminShell>{children}</AdminShell>;
}

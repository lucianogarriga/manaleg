import { notFound } from "next/navigation";
import CausaPageView from "@/components/causas/CausaPageView";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { getCausaById } from "@/services/supabase/causas";
import { getFinanzasJudiciales } from "@/services/supabase/liquidaciones";

export default async function CausaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [profile, causa] = await Promise.all([getCurrentProfile(), getCausaById(id)]);
  if (!causa) notFound();

  // Liquidaciones y órdenes de pago solo existen en causas judiciales
  const finanzas = causa.via_proceso === "Judicial"
    ? await getFinanzasJudiciales(id)
    : { liquidaciones: [], ordenes: [] };

  return <CausaPageView causa={causa} userId={profile.id} finanzas={finanzas} />;
}

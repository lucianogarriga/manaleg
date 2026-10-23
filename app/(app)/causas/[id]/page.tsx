import { notFound } from "next/navigation";
import CausaPageView from "@/components/causas/CausaPageView";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { getCausaById } from "@/services/supabase/causas";
import { getClienteOptions } from "@/services/supabase/clientes";
import { getFinanzasJudiciales } from "@/services/supabase/liquidaciones";

export default async function CausaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const [causa, clientes, finanzas] = await Promise.all([
    getCausaById(id),
    getClienteOptions(),
    getFinanzasJudiciales(id),
  ]);
  if (!causa) notFound();

  return <CausaPageView causa={causa} clientes={clientes} userId={profile.id} finanzas={finanzas} />;
}

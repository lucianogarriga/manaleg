import { notFound } from "next/navigation";
import CausaPageView from "@/components/causas/CausaPageView";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { getCausaById } from "@/services/supabase/causas";
import { getClienteOptions } from "@/services/supabase/clientes";

export default async function CausaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await getCurrentProfile();
  const [causa, clientes] = await Promise.all([getCausaById(id), getClienteOptions()]);
  if (!causa) notFound();

  return <CausaPageView causa={causa} clientes={clientes} userId={profile.id} />;
}

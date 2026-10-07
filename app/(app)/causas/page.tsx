import CausasView from "@/components/causas/CausasView";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { getCausas } from "@/services/supabase/causas";
import { getClienteOptions } from "@/services/supabase/clientes";

export default async function CausasPage() {
  const [profile, { causas, totalEnBD }, clientes] = await Promise.all([
    getCurrentProfile(),
    getCausas(),
    getClienteOptions(),
  ]);

  return (
    <CausasView
      causas={causas}
      totalEnBD={totalEnBD}
      clientes={clientes}
      userId={profile.id}
      causasMax={profile.causas_max}
    />
  );
}

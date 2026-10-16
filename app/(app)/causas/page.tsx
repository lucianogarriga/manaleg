import CausasView from "@/components/causas/CausasView";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { contarCausasPropias, getCausas } from "@/services/supabase/causas";
import { getClienteOptions } from "@/services/supabase/clientes";

export default async function CausasPage() {
  const [profile, { causas, totalEnBD }, clientes] = await Promise.all([
    getCurrentProfile(),
    getCausas(),
    getClienteOptions(),
  ]);
  // Conteo real de causas propias (la lista se limita a 60 filas, el conteo no)
  const causasPropias = await contarCausasPropias(profile.id);

  return (
    <CausasView
      causas={causas}
      totalEnBD={totalEnBD}
      clientes={clientes}
      userId={profile.id}
      causasMax={profile.causas_max}
      causasPropias={causasPropias}
    />
  );
}

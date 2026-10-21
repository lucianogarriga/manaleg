import CausasView from "@/components/causas/CausasView";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { contarCausasPropias, getCausas } from "@/services/supabase/causas";
import { getClienteOptions } from "@/services/supabase/clientes";

export default async function CausasPage() {
  const profile = await getCurrentProfile();
  // El conteo real de causas propias (la lista se limita a 60 filas) va en paralelo
  const [{ causas, totalEnBD }, clientes, causasPropias] = await Promise.all([
    getCausas(),
    getClienteOptions(),
    contarCausasPropias(profile.id),
  ]);

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

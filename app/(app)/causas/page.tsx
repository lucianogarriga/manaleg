import CausasView from "@/components/causas/CausasView";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { contarCausasPropias, getCausas } from "@/services/supabase/causas";

export default async function CausasPage() {
  const profile = await getCurrentProfile();
  // El conteo real de causas propias (la lista se limita a 60 filas) va en paralelo
  const [{ causas, totalEnBD }, causasPropias] = await Promise.all([
    getCausas(),
    contarCausasPropias(profile.id),
  ]);

  return (
    <CausasView
      causas={causas}
      totalEnBD={totalEnBD}
      userId={profile.id}
      causasMax={profile.causas_max}
      causasPropias={causasPropias}
    />
  );
}

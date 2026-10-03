import { getCurrentProfile } from "@/components/auth/AuthGuard";
import DashboardView from "@/components/dashboard/DashboardView";
import { getLayoutCounts } from "@/services/supabase/layoutCounts";
import { getProximosEventos } from "@/services/supabase/eventos";

export default async function DashboardPage() {
  const [profile, counts, eventos] = await Promise.all([
    getCurrentProfile(),
    getLayoutCounts(),
    getProximosEventos(30),
  ]);

  return (
    <DashboardView
      nombre={profile.nombre_completo ?? profile.email}
      causasActivas={counts.causasActivas}
      alertas={counts.alertas}
      eventos={eventos}
    />
  );
}

import { getCurrentProfile } from "@/components/auth/AuthGuard";
import DashboardView from "@/components/dashboard/DashboardView";
import { cargarNovedadesCacheada } from "@/services/supabase/novedades";

export default async function DashboardPage() {
  const profile = await getCurrentProfile();
  // Si falla el cálculo, la pantalla muestra el aviso con "Reintentar" en vez de romperse.
  const inicial = await cargarNovedadesCacheada("mes").catch((err) => {
    console.error("[Dashboard] no se pudieron cargar los indicadores", err);
    return null;
  });

  return <DashboardView inicial={inicial} preferencia={profile.preferencia_graficos} nombre={profile.nombre_completo ?? ""} />;
}

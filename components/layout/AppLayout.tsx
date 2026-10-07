import AuthHydrator from "@/components/auth/AuthHydrator";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { getLayoutCounts } from "@/services/supabase/layoutCounts";
import { createClient } from "@/services/supabase/server";
import { formatLongDate, todayISO } from "@/utils/formatters";
import Toaster from "@/components/ui/Toaster";
import WelcomeModal from "@/components/ui/WelcomeModal";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import TitleUpdater from "./TitleUpdater";
import NavigationProgress from "./NavigationProgress";

// Estructura base: Sidebar fijo + columna principal (Topbar + contenido).
// Cada página maneja su propio scroll dentro del área de contenido.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const defaultCounts = { causasActivas: 0, vencimientosProximos: 0, alertas: [], notificaciones: [], notificacionesSinLeer: 0 };
  const [profile, counts, { data: userData }] = await Promise.all([
    getCurrentProfile(),
    getLayoutCounts().catch((e) => { console.error("[AppLayout] getLayoutCounts falló:", e); return defaultCounts; }),
    supabase.auth.getUser(),
  ]);
  const hasSeenWelcome = userData?.user?.user_metadata?.has_seen_welcome === true;

  return (
    <div className="flex h-dvh w-full overflow-hidden md:gap-2 md:p-3 md:pl-2">
      <AuthHydrator profile={profile} />
      <Sidebar profile={profile} counts={counts} />
      {/* Área derecha: topbar + contenido sobre bg (sin card wrapper) */}
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden md:rounded-xl"
        style={{ background: "var(--color-bg)" }}
      >
        <Topbar
          fecha={formatLongDate(todayISO())}
          alertas={counts.alertas}
          urgentes={counts.vencimientosProximos}
          notificaciones={counts.notificaciones}
          sinLeer={counts.notificacionesSinLeer}
          profile={profile}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <TitleUpdater urgentes={counts.vencimientosProximos} />
      <NavigationProgress />
      <Toaster />
      {!hasSeenWelcome && <WelcomeModal />}
    </div>
  );
}

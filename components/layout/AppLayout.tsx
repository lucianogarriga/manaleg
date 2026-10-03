import AuthHydrator from "@/components/auth/AuthHydrator";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { getLayoutCounts } from "@/services/supabase/layoutCounts";
import { formatLongDate, todayISO } from "@/utils/formatters";
import Toaster from "@/components/ui/Toaster";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

// Estructura base: Sidebar fijo + columna principal (Topbar + contenido).
// Cada página maneja su propio scroll dentro del área de contenido.
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [profile, counts] = await Promise.all([getCurrentProfile(), getLayoutCounts()]);

  return (
    <div className="flex h-screen w-full overflow-hidden gap-2 p-3 pl-2">
      <AuthHydrator profile={profile} />
      <Sidebar profile={profile} counts={counts} />
      {/* Área derecha: topbar + contenido sobre bg (sin card wrapper) */}
      <div
        className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-xl"
        style={{ background: "var(--color-bg)" }}
      >
        <Topbar
          fecha={formatLongDate(todayISO())}
          alertas={counts.alertas}
          urgentes={counts.vencimientosProximos}
          notificaciones={counts.notificaciones}
          sinLeer={counts.notificacionesSinLeer}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
      <Toaster />
    </div>
  );
}

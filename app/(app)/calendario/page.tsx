import CalendarView from "@/components/calendario/CalendarView";
import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { getAvisosCausas } from "@/services/supabase/causas";
import { getTareasCalendario } from "@/services/supabase/tareasCalendario";
import { getDiasInhabiles } from "@/services/supabase/diasInhabiles";
import { todayISO } from "@/utils/formatters";

// Vista mensual con las alertas y vencimientos de todas las causas
export default async function CalendarioPage() {
  const [profile, avisos, tareas, inhabiles] = await Promise.all([
    getCurrentProfile(),
    getAvisosCausas(),
    getTareasCalendario(),
    getDiasInhabiles(),
  ]);

  return <CalendarView hoy={todayISO()} avisos={[...avisos, ...tareas]} inhabiles={inhabiles} userId={profile.id} />;
}

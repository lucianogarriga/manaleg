import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { getCausas } from "@/services/supabase/causas";
import KanbanView from "@/components/kanban/KanbanView";

export default async function KanbanPage() {
  const [profile, causas] = await Promise.all([getCurrentProfile(), getCausas()]);
  return <KanbanView causas={causas} userId={profile.id} />;
}

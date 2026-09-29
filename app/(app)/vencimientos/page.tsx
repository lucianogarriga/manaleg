import { CalendarDays } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function VencimientosPage() {
  return (
    <EmptyState
      icon={CalendarDays}
      title="Vencimientos"
      description="Próximamente: todos los vencimientos de tus causas (Fase F)."
    />
  );
}

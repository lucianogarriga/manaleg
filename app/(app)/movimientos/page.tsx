import { ClipboardList } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function MovimientosPage() {
  return (
    <EmptyState
      icon={ClipboardList}
      title="Movimientos"
      description="Próximamente: historial de movimientos de todas tus causas (Fase D)."
    />
  );
}

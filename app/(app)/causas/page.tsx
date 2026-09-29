import { Scale } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

// Placeholder: la vista master-detail se construye en la Fase C
export default function CausasPage() {
  return (
    <EmptyState
      icon={Scale}
      title="Causas"
      description="Acá va a ir la lista de causas con el panel de detalle (Fase C)."
    />
  );
}

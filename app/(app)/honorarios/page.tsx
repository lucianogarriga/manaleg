import { Wallet } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function HonorariosPage() {
  return (
    <EmptyState
      icon={Wallet}
      title="Honorarios"
      description="Próximamente: honorarios acordados y pagos por causa (Fase E)."
    />
  );
}

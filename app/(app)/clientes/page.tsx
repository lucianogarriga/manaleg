import { User } from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";

export default function ClientesPage() {
  return (
    <EmptyState
      icon={User}
      title="Clientes"
      description="Próximamente: alta y gestión de clientes (Fase F)."
    />
  );
}

import ClientesView from "@/components/clientes/ClientesView";
import { getClientes } from "@/services/supabase/clientes";

export default async function ClientesPage() {
  const clientes = await getClientes();
  return <ClientesView clientes={clientes} />;
}

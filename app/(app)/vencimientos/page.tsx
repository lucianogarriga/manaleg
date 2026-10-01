import VencimientosView from "@/components/vencimientos/VencimientosView";
import { getAllVencimientos } from "@/services/supabase/vencimientos";

export default async function VencimientosPage() {
  const items = await getAllVencimientos();
  return <VencimientosView items={items} />;
}

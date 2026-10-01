import CalculadoraView from "@/components/calculadora/CalculadoraView";
import { getDiasInhabiles } from "@/services/supabase/diasInhabiles";
import { createClient } from "@/services/supabase/server";
import { todayISO } from "@/utils/formatters";

// Calculadora de plazos: hábiles / corridos, según feriados y días inhábiles cargados
export default async function CalculadoraPage() {
  const supabase = await createClient();
  const [inhabiles, causas] = await Promise.all([
    getDiasInhabiles(),
    supabase
      .from("causas")
      .select("id, caratula")
      .neq("estado", "Cerrada")
      .order("caratula")
      .returns<{ id: string; caratula: string }[]>(),
  ]);

  if (causas.error) throw new Error(`No se pudieron cargar las causas: ${causas.error.message}`);

  return <CalculadoraView hoy={todayISO()} inhabiles={inhabiles} causas={causas.data} />;
}

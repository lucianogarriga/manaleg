import { ESTADO_STYLES } from "@/utils/constants";
import type { EstadoCausa } from "@/types";

// Status badge de la causa. size="lg" es la variante del header del detalle.
export default function Badge({ estado, size = "sm" }: { estado: EstadoCausa; size?: "sm" | "lg" }) {
  const style = ESTADO_STYLES[estado] ?? ESTADO_STYLES.Iniciada;
  const sizing = size === "lg" ? "px-[9px] py-[3px] text-[13px]" : "px-[6px] py-[1.5px] text-[10.5px]";
  return (
    <span className={`whitespace-nowrap rounded-full font-bold ${sizing} ${style.bg} ${style.text}`}>
      {estado}
    </span>
  );
}

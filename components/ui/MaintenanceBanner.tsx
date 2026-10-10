import { AlertTriangle } from "lucide-react";
import { todayISO } from "@/utils/formatters";

const START = "2026-10-08";
const END   = "2026-10-12";

const MSG = "Entre los días 08/10/2026 y 12/10/2026 el sitio experimentará tareas de desarrollo y mantenimiento, por lo que puede experimentar comportamientos indeseados. Disculpe las molestias si esto entorpece su experiencia con la plataforma. Muchas gracias.";

interface Props {
  compact?: boolean; // texto más chico + justificado, sin mx-3 lateral
}

export default function MaintenanceBanner({ compact = false }: Props) {
  const today = todayISO();
  if (today < START || today > END) return null;

  if (compact) {
    return (
      <div className="mb-5 flex items-start gap-[9px] rounded-[7px] border border-amb-bd bg-amb-lt px-[13px] py-[10px]">
        <AlertTriangle size={14} className="mt-[2px] shrink-0 text-amb" />
        <div className="min-w-0 flex-1">
          <div className="text-[12.5px] font-bold text-amb">Tareas de mantenimiento en curso</div>
          <div className="mt-[2px] text-[11.5px] text-sub text-justify leading-[1.5]">{MSG}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 mt-[10px] flex items-start gap-[9px] rounded-[7px] border border-amb-bd bg-amb-lt px-[13px] py-[10px]">
      <AlertTriangle size={16} className="mt-px shrink-0 text-amb" />
      <div className="min-w-0 flex-1">
        <div className="text-[13.5px] font-bold text-amb">Tareas de mantenimiento en curso</div>
        <div className="mt-px text-[12.5px] text-sub break-words">{MSG}</div>
      </div>
    </div>
  );
}

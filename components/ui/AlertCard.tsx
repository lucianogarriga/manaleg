import { AlertTriangle, Siren } from "lucide-react";

interface AlertCardProps {
  variant: "red" | "amber";
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const STYLES = {
  red: { box: "bg-red-lt border-red-bd", title: "text-red", Icon: Siren },
  amber: { box: "bg-amb-lt border-amb-bd", title: "text-amb", Icon: AlertTriangle },
};

export default function AlertCard({ variant, title, description, action }: AlertCardProps) {
  const s = STYLES[variant];
  return (
    <div className={`mx-3 mt-[10px] flex items-start gap-[9px] rounded-[7px] border px-[13px] py-[10px] ${s.box}`}>
      <s.Icon size={16} className={`mt-px shrink-0 ${s.title}`} />
      <div className="flex-1 min-w-0">
        <div className={`text-[13.5px] font-bold ${s.title}`}>{title}</div>
        {description && <div className="mt-px text-[12.5px] text-sub">{description}</div>}
        {action && <div className="mt-[4px]">{action}</div>}
      </div>
    </div>
  );
}

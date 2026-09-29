import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode; // acción opcional (botón)
}

export default function EmptyState({ icon: Icon, title, description, children }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-card text-muted ring-1 ring-border">
        <Icon size={18} />
      </div>
      <div className="text-[13px] font-semibold text-text">{title}</div>
      {description && <p className="mt-1 max-w-xs text-[11.5px] text-sub">{description}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

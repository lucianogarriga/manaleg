import { FolderOpen } from "lucide-react";

export default function DriveLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mx-3 mt-[10px] flex items-center gap-2 rounded-[7px] border border-dashed border-slate-300 bg-card px-3 py-[9px] text-[13.5px] font-medium text-blue hover:bg-blue-lt/50"
    >
      <FolderOpen size={14} className="shrink-0" />
      <span className="truncate">{label}</span>
      <span className="ml-auto shrink-0 text-[12px] text-muted">↗ Abrir</span>
    </a>
  );
}

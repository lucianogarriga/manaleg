export default function Spinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="mx-auto flex flex-col items-center gap-3 py-12" role="status" aria-label={label}>
      <div className="h-[36px] w-[36px] animate-spin rounded-full border-[3px] border-border border-t-blue" />
      <span className="text-[12px] font-semibold text-sub">{label}</span>
    </div>
  );
}

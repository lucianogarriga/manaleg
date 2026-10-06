export default function Spinner({ label = "Cargando..." }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-blue"
        role="status"
        aria-label={label}
      />
      <p className="text-[13px] text-muted">{label}</p>
    </div>
  );
}

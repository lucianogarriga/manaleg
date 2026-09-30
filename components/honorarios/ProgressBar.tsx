// Barra de progreso de honorarios cobrados (0–100).
export default function ProgressBar({ percent }: { percent: number }) {
  const value = Math.max(0, Math.min(100, percent));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="mb-1 h-[5px] overflow-hidden rounded-[3px] bg-slate-200"
    >
      <div className="h-full rounded-[3px] bg-linear-to-r from-grn to-[#059669]" style={{ width: `${value}%` }} />
    </div>
  );
}

export default function MovimientosLoading() {
  return (
    <div className="flex flex-col gap-[10px] p-[14px] animate-pulse">
      <div className="h-[36px] rounded-[8px] bg-panel2" />
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="h-[56px] rounded-[10px] bg-panel2" />
      ))}
    </div>
  );
}

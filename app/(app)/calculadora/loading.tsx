export default function CalculadoraLoading() {
  return (
    <div className="flex flex-col gap-4 p-4 animate-pulse">
      <div className="h-[36px] w-[260px] rounded-[8px] bg-(--color-sidebar)" />
      <div className="h-[120px] rounded-[10px] bg-(--color-sidebar)" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[56px] rounded-[8px] bg-(--color-sidebar)" />
        ))}
      </div>
    </div>
  );
}

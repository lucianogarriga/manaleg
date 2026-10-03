export default function VencimientosLoading() {
  return (
    <div className="flex flex-col gap-[10px] p-[14px] animate-pulse">
      <div className="h-[36px] w-[200px] rounded-[8px] bg-(--color-sidebar)" />
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-[56px] rounded-[10px] bg-(--color-sidebar)" />
      ))}
    </div>
  );
}

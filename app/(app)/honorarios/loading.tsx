export default function HonorariosLoading() {
  return (
    <div className="flex flex-col gap-[10px] p-[14px] animate-pulse">
      <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[72px] rounded-[10px] bg-(--color-sidebar)" />
        ))}
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-[56px] rounded-[10px] bg-(--color-sidebar)" />
      ))}
    </div>
  );
}

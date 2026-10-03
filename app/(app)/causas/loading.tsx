export default function CausasLoading() {
  return (
    <div className="flex flex-col animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-[10px] px-[14px] pt-[14px] pb-[10px] sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[64px] rounded-[8px] bg-(--color-sidebar)" />
        ))}
      </div>
      {/* Search/filter bar */}
      <div className="mx-[14px] mb-[10px] h-[36px] rounded-[8px] bg-(--color-sidebar)" />
      {/* List rows */}
      <div className="flex flex-col gap-[8px] px-[14px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[64px] rounded-[10px] bg-(--color-sidebar)" />
        ))}
      </div>
    </div>
  );
}

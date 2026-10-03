export default function CalendarioLoading() {
  return (
    <div className="flex flex-col gap-[12px] p-[14px] animate-pulse">
      {/* Calendar header */}
      <div className="flex items-center justify-between">
        <div className="h-[28px] w-[160px] rounded-[8px] bg-(--color-sidebar)" />
        <div className="flex gap-[8px]">
          <div className="h-[28px] w-[28px] rounded-[8px] bg-(--color-sidebar)" />
          <div className="h-[28px] w-[28px] rounded-[8px] bg-(--color-sidebar)" />
        </div>
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-[4px]">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-[44px] rounded-[6px] bg-(--color-sidebar)" />
        ))}
      </div>
    </div>
  );
}

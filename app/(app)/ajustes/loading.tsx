export default function Loading() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-[10px] px-[14px] pt-[14px] pb-[10px]">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-[56px] animate-pulse rounded-[8px] bg-border" />
        ))}
      </div>
      <div className="flex flex-col gap-[10px] px-[14px] pb-[14px]">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-[56px] animate-pulse rounded-[8px] bg-panel2" />
        ))}
      </div>
    </div>
  );
}

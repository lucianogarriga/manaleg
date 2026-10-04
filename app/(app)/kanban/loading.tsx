export default function KanbanLoading() {
  return (
    <div className="flex h-full gap-3 overflow-x-auto p-3 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex w-[240px] shrink-0 flex-col gap-2">
          <div className="h-[28px] rounded-[6px] bg-(--color-sidebar)" />
          {Array.from({ length: 3 }).map((_, j) => (
            <div key={j} className="h-[72px] rounded-[8px] bg-(--color-sidebar)" />
          ))}
        </div>
      ))}
    </div>
  );
}

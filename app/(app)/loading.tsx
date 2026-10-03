export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-[18px] p-[16px] sm:p-[24px] animate-pulse">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[80px] rounded-[10px] bg-(--color-sidebar)" />
        ))}
      </div>
      {/* Content blocks */}
      <div className="grid gap-[14px] sm:grid-cols-2">
        <div className="h-[220px] rounded-[10px] bg-(--color-sidebar)" />
        <div className="h-[220px] rounded-[10px] bg-(--color-sidebar)" />
      </div>
      <div className="h-[160px] rounded-[10px] bg-(--color-sidebar)" />
    </div>
  );
}

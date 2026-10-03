export default function ClientesLoading() {
  return (
    <div className="flex flex-col gap-[10px] p-[14px] animate-pulse">
      <div className="h-[36px] rounded-[8px] bg-(--color-sidebar)" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-[60px] rounded-[10px] bg-(--color-sidebar)" />
      ))}
    </div>
  );
}

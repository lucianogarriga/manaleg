import Spinner from "@/components/ui/Spinner";

export default function CausasLoading() {
  return (
    <div className="flex flex-col">
      {/* Skeleton stats */}
      <div className="grid grid-cols-2 gap-[10px] px-[14px] pt-[14px] pb-[10px] sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-[64px] animate-pulse rounded-[8px] bg-border" />
        ))}
      </div>
      <Spinner />
    </div>
  );
}

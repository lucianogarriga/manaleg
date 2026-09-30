import { Plus } from "lucide-react";

export default function FAB({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="fixed right-5 bottom-5 z-20 flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full bg-blue text-white shadow-[0_4px_14px_rgba(29,78,216,.45)] transition-transform hover:scale-105"
    >
      <Plus size={22} strokeWidth={2.2} />
    </button>
  );
}

import { Plus } from "lucide-react";

interface FABProps {
  onClick?: () => void;
  label: string;
  disabled?: boolean;
}

export default function FAB({ onClick, label, disabled = false }: FABProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      title={label}
      disabled={disabled}
      className="fixed right-5 bottom-5 z-20 flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full text-white shadow-[0_4px_14px_rgba(29,78,216,.45)] transition-transform"
      style={{
        background: disabled ? "var(--color-muted)" : "var(--color-blue)",
        cursor: disabled ? "not-allowed" : "pointer",
        transform: disabled ? "none" : undefined,
        boxShadow: disabled ? "none" : undefined,
      }}
    >
      <Plus size={22} strokeWidth={2.2} />
    </button>
  );
}

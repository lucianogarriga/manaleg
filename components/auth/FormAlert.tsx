import type { FormState } from "@/types";

export default function FormAlert({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <div
        className="rounded-[7px] px-3 py-2 text-[13px] font-medium"
        style={{
          background: "var(--color-red-lt)",
          border: "1px solid var(--color-red-bd)",
          color: "var(--color-red)",
        }}
      >
        {state.error}
      </div>
    );
  }
  if (state.message) {
    return (
      <div
        className="rounded-[7px] px-3 py-2 text-[13px] font-medium"
        style={{
          background: "var(--color-grn-lt)",
          border: "1px solid var(--color-grn)",
          color: "var(--color-grn)",
          opacity: 0.9,
        }}
      >
        {state.message}
      </div>
    );
  }
  return null;
}

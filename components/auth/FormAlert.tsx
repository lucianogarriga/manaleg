import type { FormState } from "@/types";

export default function FormAlert({ state }: { state: FormState }) {
  if (state.error) {
    return (
      <div className="rounded-[7px] border border-red-bd bg-red-lt px-3 py-2 text-[13px] font-medium text-red">
        {state.error}
      </div>
    );
  }
  if (state.message) {
    return (
      <div className="rounded-[7px] border border-grn/30 bg-grn-lt px-3 py-2 text-[13px] font-medium text-grn">
        {state.message}
      </div>
    );
  }
  return null;
}

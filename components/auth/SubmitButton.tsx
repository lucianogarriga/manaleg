export default function SubmitButton({
  pending,
  children,
  pendingText,
}: {
  pending: boolean;
  children: React.ReactNode;
  pendingText: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full cursor-pointer rounded-[6px] bg-blue py-[8px] text-[12.5px] font-semibold text-white shadow-[0_4px_14px_rgba(29,78,216,.25)] transition-opacity hover:opacity-90 disabled:cursor-default disabled:opacity-60"
    >
      {pending ? pendingText : children}
    </button>
  );
}

import { forwardRef } from "react";

interface CardSectionProps {
  title: string;
  titleInfo?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
}

const CardSection = forwardRef<HTMLElement, CardSectionProps>(function CardSection(
  { title, titleInfo, action, children },
  ref,
) {
  return (
    <section ref={ref} className="mx-3 mt-[10px] overflow-hidden rounded-[7px] border border-border bg-card last:mb-5">
      <div className="flex items-center gap-[6px] border-b border-border px-[13px] py-[9px] text-[12px] font-bold uppercase tracking-[.4px] text-sub">
        {title}
        {titleInfo}
        {action && <span className="ml-auto">{action}</span>}
      </div>
      {children}
    </section>
  );
});

export default CardSection;

export function CardAction({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer text-[13px] font-semibold normal-case tracking-normal text-blue hover:underline"
    >
      {children}
    </button>
  );
}

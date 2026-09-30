interface CardSectionProps {
  title: string;
  action?: React.ReactNode; // link de acción a la derecha del header ("+ Agregar")
  children: React.ReactNode;
}

export default function CardSection({ title, action, children }: CardSectionProps) {
  return (
    <section className="mx-3 mt-[10px] overflow-hidden rounded-[7px] border border-border bg-card last:mb-5">
      <div className="flex items-center justify-between border-b border-border px-[13px] py-[9px] text-[12px] font-bold uppercase tracking-[.4px] text-sub">
        {title}
        {action}
      </div>
      {children}
    </section>
  );
}

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

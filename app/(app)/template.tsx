import DominoReveal from "@/components/ui/DominoReveal";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <DominoReveal>
      <div className="page-enter h-full">{children}</div>
    </DominoReveal>
  );
}

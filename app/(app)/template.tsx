import DominoReveal from "@/components/ui/DominoReveal";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <DominoReveal>
      <div data-page className="page-enter h-full">{children}</div>
    </DominoReveal>
  );
}

import Link from "next/link";

export default function OpenCausaButton({
  causaId,
  className,
  children,
}: {
  causaId: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={`/causas/${causaId}`} className={`cursor-pointer text-left ${className ?? ""}`}>
      {children}
    </Link>
  );
}

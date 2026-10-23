"use client";

import { useRouter } from "next/navigation";

// Abre la página de la causa (desde las páginas globales de Movimientos, Honorarios, etc.).
export default function OpenCausaButton({
  causaId,
  className,
  children,
}: {
  causaId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const open = () => router.push(`/causas/${causaId}`);

  return (
    <button type="button" onClick={open} className={`cursor-pointer text-left ${className ?? ""}`}>
      {children}
    </button>
  );
}

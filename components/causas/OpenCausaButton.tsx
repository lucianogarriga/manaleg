"use client";

import { useRouter } from "next/navigation";
import { useCausasStore } from "@/store/causasStore";

// Lleva al listado de causas con esta causa seleccionada
// (desde las páginas globales de Movimientos, Honorarios, etc.).
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

  const open = () => {
    const { select, setFilter, setSearch } = useCausasStore.getState();
    setFilter("todas");
    setSearch("");
    select(causaId);
    router.push("/causas");
  };

  return (
    <button type="button" onClick={open} className={`cursor-pointer text-left ${className ?? ""}`}>
      {children}
    </button>
  );
}

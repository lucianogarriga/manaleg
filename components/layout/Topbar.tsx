"use client";

import { usePathname } from "next/navigation";
import { Bell, Menu, Search } from "lucide-react";
import { useUIStore } from "@/store/uiStore";
import { getPageTitle } from "./navigation";

interface TopbarProps {
  fecha: string; // ya formateada, ej. "Vie 11 sep 2026"
  alertas: number; // badge de la campana
}

export default function Topbar({ fecha, alertas }: TopbarProps) {
  const pathname = usePathname();
  const openSidebar = useUIStore((s) => s.openSidebar);

  return (
    <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-[9px]">
      <button
        type="button"
        onClick={openSidebar}
        className="-ml-1 flex cursor-pointer rounded p-1 text-sub md:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      <h1 className="flex-1 truncate text-[14px] font-bold">{getPageTitle(pathname)}</h1>

      {/* Búsqueda: se conecta al listado de causas en la Fase C */}
      <label className="hidden w-[185px] items-center gap-[6px] rounded-[6px] border border-border bg-bg px-[10px] py-[5px] text-[11.5px] text-muted sm:flex">
        <Search size={12} className="shrink-0" />
        <input
          type="search"
          placeholder="Buscar por carátula o expediente…"
          className="w-full min-w-0 bg-transparent text-text outline-none placeholder:text-muted"
        />
      </label>

      <div className="hidden whitespace-nowrap text-[11px] text-sub lg:block">{fecha}</div>

      <button
        type="button"
        className="relative flex h-[30px] w-[30px] shrink-0 cursor-pointer items-center justify-center rounded-full bg-amb-lt text-amb"
        aria-label={`${alertas} vencimientos próximos`}
      >
        <Bell size={15} />
        {alertas > 0 && (
          <span className="absolute -top-px -right-px flex h-[13px] min-w-[13px] items-center justify-center rounded-full bg-red px-[3px] text-[8px] font-bold text-white">
            {alertas}
          </span>
        )}
      </button>
    </header>
  );
}

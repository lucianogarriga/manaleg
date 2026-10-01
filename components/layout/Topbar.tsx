"use client";

import { usePathname, useRouter } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { useCausasStore } from "@/store/causasStore";
import { useUIStore } from "@/store/uiStore";
import type { AlertaItem, NotificacionItem } from "@/services/supabase/layoutCounts";
import AlertsBell from "./AlertsBell";
import { getPageTitle } from "./navigation";

interface TopbarProps {
  fecha: string; // ya formateada, ej. "Vie 11 sep 2026"
  alertas: AlertaItem[]; // lista de la campana
  urgentes: number; // alertas urgentes (badge)
  notificaciones: NotificacionItem[]; // avisos de colegas
  sinLeer: number;
}

export default function Topbar({ fecha, alertas, urgentes, notificaciones, sinLeer }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const openSidebar = useUIStore((s) => s.openSidebar);
  const search = useCausasStore((s) => s.search);
  const setSearch = useCausasStore((s) => s.setSearch);

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

      <h1 className="flex-1 truncate text-[16px] font-bold">{getPageTitle(pathname)}</h1>

      {/* Búsqueda: filtra el listado de causas */}
      <label className="hidden w-[260px] items-center gap-[6px] rounded-[6px] border border-border bg-bg px-[10px] py-[5px] text-[13.5px] text-muted sm:flex">
        <Search size={12} className="shrink-0" />
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!pathname.startsWith("/causas")) router.push("/causas");
          }}
          placeholder="Buscar por carátula o expediente…"
          className="w-full min-w-0 bg-transparent text-text outline-none placeholder:text-muted"
        />
      </label>

      <div className="hidden whitespace-nowrap text-[13px] text-sub lg:block">{fecha}</div>

      <AlertsBell alertas={alertas} urgentes={urgentes} notificaciones={notificaciones} sinLeer={sinLeer} />
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useCausasStore } from "@/store/causasStore";
import { useUIStore } from "@/store/uiStore";
import type { AlertaItem, NotificacionItem } from "@/services/supabase/layoutCounts";
import AlertsBell from "./AlertsBell";
import { getPageTitle } from "./navigation";

interface TopbarProps {
  fecha: string;
  alertas: AlertaItem[];
  urgentes: number;
  notificaciones: NotificacionItem[];
  sinLeer: number;
}

export default function Topbar({ fecha, alertas, urgentes, notificaciones, sinLeer }: TopbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const openSidebar = useUIStore((s) => s.openSidebar);
  const search = useCausasStore((s) => s.search);
  const setSearch = useCausasStore((s) => s.setSearch);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    const initial = saved ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  const toggleTheme = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  };

  return (
    <header
      className="flex shrink-0 items-center gap-3 border-b px-4 py-3"
      style={{ borderColor: "var(--color-border)" }}
    >
      {/* Hamburger mobile */}
      <button
        type="button"
        onClick={openSidebar}
        className="-ml-1 flex cursor-pointer rounded p-1 text-sub md:hidden"
        aria-label="Abrir menú"
      >
        <Menu size={18} />
      </button>

      {/* Título — lado izquierdo */}
      <h1 className="w-[160px] shrink-0 truncate text-[15px] font-bold text-text">
        {getPageTitle(pathname)}
      </h1>

      {/* Buscador centrado */}
      <div className="flex flex-1 justify-center">
        <label
          className="hidden w-full max-w-[340px] items-center gap-[6px] rounded-[7px] border px-[10px] py-[5px] text-[13px] sm:flex"
          style={{ borderColor: "var(--color-border)", background: "var(--color-bg)" }}
        >
          <Search size={12} className="shrink-0 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!pathname.startsWith("/causas")) router.push("/causas");
            }}
            placeholder="Buscar por carátula o expediente…"
            className="w-full min-w-0 bg-transparent text-[13px] text-text outline-none placeholder:text-muted"
          />
        </label>
      </div>

      {/* Acciones — lado derecho */}
      <div className="flex items-center gap-[6px]">
        <span className="hidden whitespace-nowrap text-[12px] text-sub lg:block">{fecha}</span>

        {/* Toggle tema */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "light" ? "Modo oscuro" : "Modo claro"}
          className="flex cursor-pointer items-center justify-center rounded-[7px] p-[6px] transition-colors"
          style={{ color: "var(--color-sub)" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-row)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "")}
        >
          {theme === "light" ? (
            <Moon size={15} style={{ color: "#6366f1" }} />
          ) : (
            <Sun size={15} style={{ color: "#fbbf24" }} />
          )}
        </button>

        <AlertsBell
          alertas={alertas}
          urgentes={urgentes}
          notificaciones={notificaciones}
          sinLeer={sinLeer}
        />
      </div>
    </header>
  );
}

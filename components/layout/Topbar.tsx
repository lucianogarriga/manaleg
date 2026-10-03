"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, Moon, Search, Sun } from "lucide-react";
import { useCausasStore } from "@/store/causasStore";
import { useUIStore } from "@/store/uiStore";
import type { AlertaItem, NotificacionItem } from "@/services/supabase/layoutCounts";
import type { Profile } from "@/types";
import AlertsBell from "./AlertsBell";
import UserSettings from "./UserSettings";
import { getPageTitle } from "./navigation";

interface TopbarProps {
  fecha: string;
  alertas: AlertaItem[];
  urgentes: number;
  notificaciones: NotificacionItem[];
  sinLeer: number;
  profile: Profile;
}

export default function Topbar({ fecha, alertas, urgentes, notificaciones, sinLeer, profile }: TopbarProps) {
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

        {/* Toggle tema — switch pill */}
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === "light" ? "Activar modo oscuro" : "Activar modo claro"}
          className="flex cursor-pointer items-center gap-[5px] rounded-full border px-[6px] py-[4px] transition-colors duration-200"
          style={{
            background: theme === "dark" ? "#1e293b" : "var(--color-bg)",
            borderColor: theme === "dark" ? "#334155" : "var(--color-border)",
          }}
        >
          {/* Ícono sol */}
          <Sun
            size={12}
            style={{
              color: theme === "light" ? "#f59e0b" : "#475569",
              transition: "color .2s",
            }}
          />
          {/* Pill track */}
          <span
            className="relative flex h-[14px] w-[24px] items-center rounded-full transition-colors duration-200"
            style={{ background: theme === "dark" ? "#6366f1" : "#cbd5e1" }}
          >
            {/* Thumb */}
            <span
              className="absolute h-[10px] w-[10px] rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ transform: theme === "dark" ? "translateX(12px)" : "translateX(2px)" }}
            />
          </span>
          {/* Ícono luna */}
          <Moon
            size={12}
            style={{
              color: theme === "dark" ? "#818cf8" : "#94a3b8",
              transition: "color .2s",
            }}
          />
        </button>

        <AlertsBell
          alertas={alertas}
          urgentes={urgentes}
          notificaciones={notificaciones}
          sinLeer={sinLeer}
        />
        <UserSettings profile={profile} />
      </div>
    </header>
  );
}

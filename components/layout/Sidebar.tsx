"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUIStore } from "@/store/uiStore";
import { useCausasStore } from "@/store/causasStore";
import type { Profile } from "@/types";
import type { LayoutCounts } from "@/services/supabase/layoutCounts";
import { NAV_SECTIONS, type NavItem } from "./navigation";

interface SidebarProps {
  profile: Profile;
  counts: LayoutCounts;
}

export default function Sidebar({ profile, counts }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar } = useUIStore();
  const selectCausa = useCausasStore((s) => s.select);
  const [hovered, setHovered] = useState(false);

  const exp = sidebarOpen || hovered;

  const pillFor = (item: NavItem) => {
    if (!exp) return null;
    if (item.badge === "causas" && counts.causasActivas > 0)
      return (
        <span className="ml-auto rounded-[10px] bg-blue/10 px-[5px] py-px text-[10.5px] font-bold text-blue">
          {counts.causasActivas}
        </span>
      );
    if (item.badge === "vencimientos" && counts.vencimientosProximos > 0)
      return (
        <span className="ml-auto rounded-[10px] bg-red/10 px-[5px] py-px text-[10.5px] font-bold text-red">
          {counts.vencimientosProximos}
        </span>
      );
    return null;
  };

  return (
    <>
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={closeSidebar} />
      )}

      {/* Wrapper — maneja el ancho, sin fondo propio */}
      <aside
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col p-2 transition-[width] duration-300 ease-in-out md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${exp ? "w-[208px]" : "md:w-[56px]"} w-[208px]`}
      >
        {/* Pill — la superficie flotante */}
        <div
          className="flex flex-1 flex-col overflow-hidden rounded-xl"
          style={{
            background: "var(--sb-bg)",
            boxShadow: "var(--sb-shadow)",
          }}
        >
          {/* Logo */}
          <div
            className={`flex h-[52px] shrink-0 items-center border-b overflow-hidden ${
              exp ? "px-[14px] gap-2" : "justify-center px-0"
            }`}
            style={{ borderColor: "var(--color-border)" }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[13px] font-bold text-white"
              style={{ background: "var(--color-blue)" }}
            >
              M
            </div>
            {exp && (
              <span
                className="whitespace-nowrap text-[14px] font-bold"
                style={{ color: "var(--color-blue)" }}
              >
                MANALEG
              </span>
            )}
          </div>

          {/* Nav */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
            {NAV_SECTIONS.map((section, i) => (
              <div key={section.title} className={i > 0 ? "mt-1" : undefined}>
                {/* Título de sección: solo cuando expandido */}
                <div
                  className={`overflow-hidden transition-[max-height,opacity] duration-150 ${
                    exp ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <div
                    className="px-[13px] pt-[10px] pb-[3px] text-[9px] font-bold uppercase tracking-[.9px]"
                    style={{ color: "var(--sb-fg)", opacity: 0.5 }}
                  >
                    {section.title}
                  </div>
                </div>

                {section.items.map((item) => {
                  const active =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={!exp ? item.label : undefined}
                      onClick={() => {
                        closeSidebar();
                        if (item.href === "/causas") selectCausa(null);
                      }}
                      className={`mx-[5px] my-px flex items-center rounded-[7px] py-[7px] overflow-hidden transition-colors duration-100 ${
                        exp ? "gap-[9px] pr-3 pl-[10px]" : "justify-center px-0"
                      }`}
                      style={{
                        background: active ? "var(--sb-act-bg)" : "transparent",
                        color: active ? "var(--sb-act-fg)" : "var(--sb-fg)",
                      }}
                    >
                      <Icon
                        size={15}
                        strokeWidth={2}
                        className="w-4 shrink-0"
                        style={{ color: active ? "var(--sb-act-fg)" : item.iconColor }}
                      />
                      <span
                        className={`whitespace-nowrap text-[12px] overflow-hidden transition-[opacity,max-width] duration-200 ${
                          exp ? "opacity-100 max-w-[140px]" : "opacity-0 max-w-0"
                        } ${active ? "font-semibold" : "font-medium"}`}
                      >
                        {item.label}
                      </span>
                      {pillFor(item)}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

        </div>
      </aside>
    </>
  );
}

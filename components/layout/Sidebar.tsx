"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { useUIStore } from "@/store/uiStore";
import { getInitials } from "@/utils/formatters";
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

  const pillFor = (item: NavItem) => {
    if (item.badge === "causas" && counts.causasActivas > 0)
      return <span className="ml-auto rounded-[10px] bg-white/10 px-[5px] py-px text-[10.5px] font-bold text-white/70">{counts.causasActivas}</span>;
    if (item.badge === "vencimientos" && counts.vencimientosProximos > 0)
      return <span className="ml-auto rounded-[10px] bg-amb px-[5px] py-px text-[10.5px] font-bold text-white">{counts.vencimientosProximos}</span>;
    return null;
  };

  return (
    <>
      {/* Overlay del drawer en mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-navy/40 md:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[228px] shrink-0 flex-col border-r border-white/5 bg-navy transition-transform md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-white/[.06] px-[15px] pt-4 pb-[13px]">
          <div className="text-[15px] font-bold tracking-[.2px] text-white">MANALEG</div>
          <div className="mt-px text-[11px] text-white/30">
            {profile.empresa ?? "Gestión Jurídica"}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {NAV_SECTIONS.map((section, i) => (
            <div key={section.title} className={i > 0 ? "mt-[6px]" : undefined}>
              <div className="px-[15px] pt-[10px] pb-1 text-[10px] font-bold uppercase tracking-[.9px] text-white/[.22]">
                {section.title}
              </div>
              {section.items.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeSidebar}
                    className={`mx-[6px] my-px flex items-center gap-[9px] rounded-[6px] py-[7.5px] pr-3 pl-[14px] text-[14.5px] transition-colors duration-100 ${
                      active
                        ? "bg-blue/35 font-semibold text-white"
                        : "text-white/55 hover:bg-white/[.07] hover:text-white/85"
                    }`}
                  >
                    <Icon size={14} strokeWidth={2} className="w-4 shrink-0" />
                    {item.label}
                    {pillFor(item)}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="flex items-center gap-[9px] border-t border-white/[.06] px-[14px] py-[11px]">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-linear-135 from-blue to-pur text-[12.5px] font-bold text-white">
            {getInitials(profile.nombre_completo, profile.email[0]?.toUpperCase())}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13.5px] font-medium text-white/80">
              {profile.nombre_completo ?? profile.email}
            </div>
            <div className="text-[11px] text-white/[.28]">
              {profile.plan === "pro" ? "Plan Pro" : "Plan Free"}
            </div>
          </div>
          <form action={logout}>
            <button
              type="submit"
              title="Cerrar sesión"
              className="flex cursor-pointer rounded p-1 text-white/30 transition-colors hover:bg-white/[.07] hover:text-white/80"
            >
              <LogOut size={13} />
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}

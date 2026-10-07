"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { useUIStore, loadPin } from "@/store/uiStore";
import { useCausasStore } from "@/store/causasStore";
import type { Profile } from "@/types";
import type { LayoutCounts } from "@/services/supabase/layoutCounts";
import { NAV_SECTIONS, type NavItem } from "./navigation";

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  textStyle: React.CSSProperties;
  pill: React.ReactNode;
  onClick: () => void;
}

function NavLink({ item, active, textStyle, pill, onClick }: NavLinkProps) {
  const [hovered, setHovered] = useState(false);
  const lit = hovered || active;
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className="mx-[5px] my-px flex items-center gap-[9px] overflow-hidden rounded-[7px] py-[7px] pl-[10px] pr-3 transition-colors duration-100"
      style={{
        background: lit ? "var(--sb-act-bg)" : undefined,
        color: lit ? "var(--sb-act-fg)" : "var(--sb-fg)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Icon
        size={15}
        strokeWidth={2}
        className="w-4 shrink-0"
        style={{ color: lit ? "var(--sb-act-fg)" : item.iconColor }}
      />
      <span
        className={`whitespace-nowrap text-[12px] ${lit ? "font-semibold" : "font-medium"}`}
        style={textStyle}
      >
        {item.label}
      </span>
      {pill}
    </Link>
  );
}

interface SidebarProps {
  profile: Profile;
  counts: LayoutCounts;
}

// Duración y curva compartidos por todos los elementos animados
const DUR = "260ms cubic-bezier(0.4,0,0.2,1)";
// Delay al abrir: texto aparece DESPUÉS de que el ancho empieza a crecer
const TEXT_DELAY_OPEN = "80ms";

export default function Sidebar({ profile, counts }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar, sidebarPinned, toggleSidebarPin } = useUIStore();
  const selectCausa = useCausasStore((s) => s.select);

  // Hidratar el pin desde localStorage en el cliente
  useEffect(() => {
    if (loadPin()) useUIStore.setState({ sidebarPinned: true });
  }, []);

  // El sidebar se expande solo cuando está fijado o abierto (mobile)
  // — sin hover, el usuario controla el estado explícitamente
  const exp = sidebarOpen || sidebarPinned;

  const pillFor = (item: NavItem) => {
    if (!exp) return null;
    if (item.badge === "vencimientos" && counts.vencimientosProximos > 0)
      return (
        <span className="ml-auto rounded-[10px] bg-red/10 px-[5px] py-px text-[10.5px] font-bold text-red">
          {counts.vencimientosProximos}
        </span>
      );
    return null;
  };

  // Estilos de texto (labels, títulos) que se desvanecen sin mover los íconos
  const textStyle: React.CSSProperties = {
    opacity: exp ? 1 : 0,
    pointerEvents: exp ? "auto" : "none",
    transition: `opacity ${DUR} ${exp ? TEXT_DELAY_OPEN : "0ms"}`,
  };

  return (
    <>
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col p-2 md:static md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${exp ? "w-[228px]" : "md:w-[56px]"} w-[228px]`}
        style={{ transition: `width ${DUR}` }}
      >
        {/* Pill — la superficie flotante */}
        <div
          className="flex flex-1 flex-col overflow-hidden rounded-xl"
          style={{ background: "var(--sb-bg)", boxShadow: "var(--sb-shadow)" }}
        >
          {/* ── Logo ─────────────────────────────────────────────────── */}
          <div
            className="flex h-[52px] shrink-0 items-center gap-2 overflow-hidden"
            style={{
              borderColor: "var(--color-border)",
              // paddingLeft anima entre centrado (6px) y alineado (14px)
              paddingLeft: exp ? 14 : 6,
              transition: `padding-left ${DUR}`,
            }}
          >
            <div
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[7px] text-[13px] font-bold text-white"
              style={{ background: "var(--color-blue)" }}
            >
              M
            </div>
            <span
              className="whitespace-nowrap text-[14px] font-bold"
              style={{ color: "var(--color-blue)", ...textStyle }}
            >
              MANALEG
            </span>
          </div>

          {/* ── Botón toggle — encima del primer ítem de nav ─────────── */}
          <div className="hidden shrink-0 md:block">
            <button
              type="button"
              onClick={toggleSidebarPin}
              title={sidebarPinned ? "Colapsar barra lateral" : "Expandir barra lateral"}
              className="mx-[5px] my-px flex w-[calc(100%-10px)] cursor-pointer items-center gap-[9px] overflow-hidden rounded-[7px] py-[7px] pl-[10px] pr-3 transition-colors hover:bg-black/5"
              style={{ color: "var(--sb-fg)", opacity: 0.6 }}
            >
              {sidebarPinned
                ? <PanelLeftClose size={15} strokeWidth={2} className="w-4 shrink-0" />
                : <PanelLeftOpen  size={15} strokeWidth={2} className="w-4 shrink-0" />
              }
              <span className="whitespace-nowrap text-[12px] font-medium" style={textStyle}>
                {sidebarPinned ? "Colapsar" : "Expandir"}
              </span>
            </button>
          </div>

          {/* ── Nav ──────────────────────────────────────────────────── */}
          <nav className="flex-1 overflow-y-auto overflow-x-hidden py-2">
            {NAV_SECTIONS.map((section, i) => (
              <div key={section.title} className={i > 0 ? "mt-1" : undefined}>
                {/* Título de sección */}
                <div
                  className="overflow-hidden"
                  style={{
                    maxHeight: exp ? "2rem" : "0px",
                    opacity: exp ? 1 : 0,
                    transition: `max-height ${DUR}, opacity ${DUR} ${exp ? TEXT_DELAY_OPEN : "0ms"}`,
                  }}
                >
                  <div
                    className="px-[13px] pt-[10px] pb-[3px] text-[9px] font-bold uppercase tracking-[.9px]"
                    style={{ color: "var(--sb-fg)", opacity: 0.5 }}
                  >
                    {section.title}
                  </div>
                </div>

                {section.items.map((item) => {
                  const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <NavLink
                      key={item.href}
                      item={item}
                      active={active}
                      textStyle={textStyle}
                      pill={pillFor(item)}
                      onClick={() => {
                        closeSidebar();
                        if (item.href === "/causas") selectCausa(null);
                      }}
                    />
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

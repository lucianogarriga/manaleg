"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUIStore, loadPin } from "@/store/uiStore";
import { useCausasStore } from "@/store/causasStore";
import type { Profile } from "@/types";
import type { LayoutCounts } from "@/services/supabase/layoutCounts";
import { NAV_SECTIONS, type NavItem } from "./navigation";
import UserSettings from "./UserSettings";

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  textStyle: React.CSSProperties;
  pill: React.ReactNode;
  onClick: () => void;
}

function NavLink({ item, active, expanded, textStyle, pill, onClick }: NavLinkProps) {
  const [hovered, setHovered] = useState(false);
  const lit = hovered || active;
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-label={item.label}
      className="mx-[5px] flex items-center overflow-hidden rounded-[7px] py-[4px]"
      style={{
        gap: expanded ? 7 : 0,
        color: lit ? "var(--sb-act-fg)" : "var(--sb-fg)",
        paddingLeft: expanded ? 10 : 9,
        paddingRight: expanded ? 10 : 9,
        justifyContent: expanded ? undefined : "center",
        transition: "color 120ms, padding-left 260ms cubic-bezier(0.4,0,0.2,1), padding-right 260ms cubic-bezier(0.4,0,0.2,1), gap 260ms cubic-bezier(0.4,0,0.2,1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Ícono con barra activa debajo (solo colapsado) */}
      <span
        className={`relative flex shrink-0 items-center justify-center ${expanded ? "w-[21px] md:w-[16px]" : "w-[28px]"}`}
        style={{ transition: `width ${DUR}` }}
      >
        <Icon
          size={expanded ? 17 : 18}
          className={expanded ? "h-[21px] w-[21px] md:h-[17px] md:w-[17px]" : "h-[18px] w-[18px]"}
          strokeWidth={1.8}
          style={{
            color: lit ? item.iconColor : "var(--sb-fg)",
            transform: lit ? "translateX(2px) scale(1.08)" : "none",
            transition: `color 120ms, font-size ${DUR}, transform 360ms cubic-bezier(.34,1.56,.64,1)`,
          }}
        />
        {active && !expanded && (
          <span
            className="nav-bar-in absolute -bottom-[7px] left-1/2 h-[2px] w-[12px] -translate-x-1/2 rounded-full"
            style={{ background: "var(--sb-accent)" }}
          />
        )}
      </span>

      {/* Texto con subrayado progresivo en hover/activo (solo expandido) */}
      <span
        className={`relative whitespace-nowrap text-[16px] md:text-[14px] ${lit ? "font-semibold" : "font-medium"}`}
        style={textStyle}
      >
        {item.label}
        {expanded && (
          <span
            className="absolute bottom-[-1px] left-0 h-[1.5px] rounded-full"
            style={{
              background: "var(--sb-accent)",
              width: lit ? "100%" : "0%",
              transition: lit ? "width 180ms cubic-bezier(0.4,0,0.2,1)" : "width 120ms ease",
            }}
          />
        )}
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
  const [hovered, setHovered] = useState(false);

  // Hidratar el pin desde localStorage en el cliente
  useEffect(() => {
    if (loadPin()) useUIStore.setState({ sidebarPinned: true });
  }, []);

  // Desktop: se expande al hacer hover o si está pinned
  // Mobile: se expande solo cuando está abierto (hamburger)
  const exp = sidebarOpen || sidebarPinned || hovered;

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

  // Estilos de texto: desaparecen en opacidad Y en ancho para no desplazar los íconos
  const textStyle: React.CSSProperties = {
    opacity: exp ? 1 : 0,
    maxWidth: exp ? "200px" : "0px",
    overflow: "hidden",
    pointerEvents: exp ? "auto" : "none",
    transition: `opacity ${DUR} ${exp ? TEXT_DELAY_OPEN : "0ms"}, max-width ${DUR}`,
  };

  return (
    <>
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col p-0 md:static md:translate-x-0 md:p-2 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${exp ? "md:w-[228px]" : "md:w-[56px]"} w-full`}
        style={{ transition: `width ${DUR}` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Pill — la superficie flotante */}
        <div
          className="flex flex-1 flex-col overflow-hidden rounded-none md:rounded-xl"
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
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] text-[15px] font-bold text-white md:h-7 md:w-7 md:text-[13px]"
              style={{ background: "var(--sb-accent)" }}
            >
              M
            </div>
            <span
              className="whitespace-nowrap text-[19px] font-bold md:text-[16px]"
              style={{ color: "var(--sb-accent)", ...textStyle }}
            >
              Manaleg
            </span>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
              className="ml-auto mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] md:hidden"
              style={{ color: "var(--sb-fg)" }}
            >
              <X size={22} strokeWidth={1.8} />
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
                    className="px-[13px] pt-[6px] pb-[1px] text-[12.5px] font-bold uppercase tracking-[.9px] md:text-[11px]"
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
                      expanded={exp}
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

          {/* ── Footer: pin + avatar ─────────────────────────────────── */}
          <div className="shrink-0 mx-[8px]" style={{ height: 1, background: "var(--color-border)" }} />
          <div className="shrink-0">
            {/* Pin toggle — solo desktop, solo cuando expandido */}
            {exp && (
              <div className="px-[5px] pt-[5px] pb-[2px]">
                <button
                  type="button"
                  onClick={toggleSidebarPin}
                  title={sidebarPinned ? "Colapsar menú" : "Fijar menú expandido"}
                  className="hidden md:flex w-full items-center overflow-hidden rounded-[7px] py-[4px] text-left transition-colors cursor-pointer"
                  style={{ gap: 9, paddingLeft: 10, paddingRight: 12, color: "var(--sb-fg)" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sb-act-fg)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sb-fg)"; }}
                >
                  {sidebarPinned
                    ? <PanelLeftClose size={14} strokeWidth={1.8} className="shrink-0" />
                    : <PanelLeftOpen  size={14} strokeWidth={1.8} className="shrink-0" />
                  }
                  <span className="whitespace-nowrap text-[13px] font-medium" style={textStyle}>
                    {sidebarPinned ? "Colapsar menú" : "Fijar menú"}
                  </span>
                </button>
              </div>
            )}

            {/* Avatar — centrado cuando colapsado, alineado izq cuando expandido */}
            <div
              className={`flex items-center pb-[10px] ${exp ? "mx-[5px] pt-[3px]" : "justify-center pt-[8px]"}`}
              style={{ paddingLeft: exp ? 10 : 0 }}
            >
              <UserSettings profile={profile} variant="sidebar" expanded={exp} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

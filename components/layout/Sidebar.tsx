"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useUIStore, loadPin } from "@/store/uiStore";
import { useCausasStore } from "@/store/causasStore";
import type { Profile } from "@/types";
import type { LayoutCounts } from "@/services/supabase/layoutCounts";
import { NAV_SECTIONS, type NavItem } from "./navigation";
import UserSettings from "./UserSettings";

// Los íconos ocupan siempre la misma columna (centro en x=24), abierto o cerrado:
// lo único que cambia al expandir es el ancho del panel y la aparición del texto.
const ICON_LEFT = 14; // ítems fuera de la tarjeta de navegación (pin)
const NAV_ICON_LEFT = 6; // ítems dentro de la tarjeta de navegación (padding px-2 de la tarjeta)
const ICON_BOX = 20;
const DUR = "260ms cubic-bezier(0.4,0,0.2,1)";
const SPRING = "520ms cubic-bezier(.34,1.3,.64,1)";
const TEXT_DELAY_OPEN = "80ms";

interface Medida { top: number; height: number }

const medidaDe = (el: HTMLElement): Medida => ({ top: el.offsetTop, height: el.offsetHeight });

interface NavLinkProps {
  item: NavItem;
  active: boolean;
  expanded: boolean;
  badge: React.ReactNode;
  onClick: () => void;
}

function NavLink({ item, active, expanded, badge, onClick }: NavLinkProps) {
  const [hovered, setHovered] = useState(false);
  const lit = hovered || active;
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      data-nav
      data-active={active}
      className="relative z-[1] flex h-[30px] items-center overflow-hidden rounded-[9px]"
      style={{
        paddingLeft: NAV_ICON_LEFT,
        paddingRight: 10,
        color: lit ? "var(--sb-act-fg)" : "var(--sb-fg)",
        transition: "color 160ms ease",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="flex shrink-0 items-center justify-center" style={{ width: ICON_BOX, height: ICON_BOX }}>
        <Icon
          size={18}
          strokeWidth={1.8}
          style={{
            color: lit ? item.iconColor : "var(--sb-fg)",
            transform: lit ? "translateX(2px) scale(1.1) rotate(-6deg)" : "none",
            transition: `color 160ms ease, transform 420ms ${SPRING}`,
          }}
        />
      </span>
      <span
        className={`min-w-0 flex-1 truncate whitespace-nowrap text-[15px] md:text-[13.5px] ${lit ? "font-semibold" : "font-medium"}`}
        style={{
          opacity: expanded ? 1 : 0,
          paddingLeft: expanded ? 10 : 0,
          transition: `opacity 200ms ${expanded ? TEXT_DELAY_OPEN : "0ms"}, padding-left ${DUR}`,
        }}
      >
        {item.label}
      </span>
      {badge}
    </Link>
  );
}

interface SidebarProps {
  profile: Profile;
  counts: LayoutCounts;
}

export default function Sidebar({ profile, counts }: SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen, closeSidebar, sidebarPinned, toggleSidebarPin } = useUIStore();
  const selectCausa = useCausasStore((s) => s.select);
  const [hovered, setHovered] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<Medida | null>(null);
  const [hoverPill, setHoverPill] = useState<Medida | null>(null);
  const [listo, setListo] = useState(false);

  // Hidratar el pin desde localStorage en el cliente
  useEffect(() => {
    if (loadPin()) useUIStore.setState({ sidebarPinned: true });
  }, []);

  // Desktop: se expande al hacer hover o si está pinned
  // Mobile: se expande solo cuando está abierto (hamburger)
  const exp = sidebarOpen || sidebarPinned || hovered;

  // La pastilla de la sección activa se mide antes de pintar y se desliza al cambiar de ruta
  const medirActivo = () => {
    const el = navRef.current?.querySelector<HTMLElement>('[data-active="true"]');
    setPill(el ? medidaDe(el) : null);
  };
  useLayoutEffect(() => { medirActivo(); }, [pathname]);
  useEffect(() => {
    medirActivo();
    window.addEventListener("resize", medirActivo);
    const id = requestAnimationFrame(() => setListo(true));
    return () => { window.removeEventListener("resize", medirActivo); cancelAnimationFrame(id); };
  }, []);

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

  const textoEntrada = (delay: boolean) => ({
    opacity: exp ? 1 : 0,
    transition: `opacity 200ms ${exp && delay ? TEXT_DELAY_OPEN : "0ms"}`,
  });

  return (
    <>
      {/* Backdrop mobile */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 md:hidden" onClick={closeSidebar} />
      )}

      <aside
        className={`sb-surface fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col md:static md:translate-x-0 md:p-2 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } ${exp ? "md:w-[232px]" : "md:w-[64px]"} w-full`}
        style={{ transition: `width ${DUR}` }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div className="flex h-full min-h-0 flex-col justify-center gap-0 md:gap-2">
          {/* ── Grupo 1: logo ─────────────────────────────────────── */}
          <div className="sb-card flex h-[52px] shrink-0 items-center overflow-hidden">
            <div className="flex shrink-0 items-center pl-[8px]">
              <div
                className="flex h-[32px] w-[32px] items-center justify-center rounded-[9px] text-[15px] font-bold text-white"
                style={{ background: "var(--sb-accent)" }}
              >
                M
              </div>
            </div>
            <span
              className="ml-[10px] whitespace-nowrap text-[18px] font-bold md:text-[15px]"
              style={{ color: "var(--sb-accent)", ...textoEntrada(true) }}
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

          {/* ── Grupo 2: navegación, centrada en el espacio disponible ── */}
          <nav className="sb-card flex min-h-0 shrink flex-col overflow-y-auto overflow-x-hidden">
            <div
              ref={navRef}
              className="relative px-2 py-1.5"
              onPointerOver={(e) => {
                const el = (e.target as Element).closest<HTMLElement>("[data-nav]");
                if (el && navRef.current?.contains(el)) setHoverPill(medidaDe(el));
              }}
              onPointerLeave={() => setHoverPill(null)}
            >
              {/* Pastilla de hover (sigue al cursor) */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-2 right-2 rounded-[10px]"
                style={{
                  top: hoverPill?.top ?? 0,
                  height: hoverPill?.height ?? 0,
                  opacity: hoverPill ? 1 : 0,
                  background: "var(--sb-act-bg)",
                  transition: listo
                    ? `top ${SPRING}, height ${SPRING}, opacity 200ms ease`
                    : "none",
                }}
              />
              {/* Pastilla de la sección activa: se desliza de una a otra */}
              <span
                aria-hidden
                className="pointer-events-none absolute left-2 right-2 rounded-[10px]"
                style={{
                  top: pill?.top ?? 0,
                  height: pill?.height ?? 0,
                  opacity: pill ? 1 : 0,
                  background: "var(--sb-act-bg)",
                  boxShadow: "inset 0 0 0 1px color-mix(in srgb, var(--sb-accent) 28%, transparent)",
                  transition: listo
                    ? `top ${SPRING}, height ${SPRING}, opacity 200ms ease`
                    : "none",
                }}
              >
                <span
                  className="absolute left-0 top-[8px] bottom-[8px] w-[3px] rounded-full"
                  style={{ background: "var(--sb-accent)" }}
                />
              </span>

              {NAV_SECTIONS.map((section, i) => (
                <div key={section.title}>
                  {/* Encabezado de sección: misma altura abierto o cerrado; cerrado muestra un separador */}
                  <div className="relative flex h-[20px] items-center px-[14px]">
                    <span
                      aria-hidden
                      className="absolute inset-x-[14px] top-1/2 h-px -translate-y-1/2 bg-border"
                      style={{ opacity: exp || i === 0 ? 0 : 0.8, transition: `opacity 200ms` }}
                    />
                    <span
                      className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[.9px]"
                      style={{ color: "var(--sb-fg)", ...textoEntrada(true), opacity: exp ? 0.5 : 0 }}
                    >
                      {section.title}
                    </span>
                  </div>

                  {section.items.map((item) => {
                    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                    return (
                      <NavLink
                        key={item.href}
                        item={item}
                        active={active}
                        expanded={exp}
                        badge={pillFor(item)}
                        onClick={() => {
                          closeSidebar();
                          if (item.href === "/causas") selectCausa(null);
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </nav>

          {/* ── Grupo 3: fijar menú + usuario ─────────────────────── */}
          <div className="sb-card flex shrink-0 flex-col py-[6px]">
            <button
              type="button"
              onClick={toggleSidebarPin}
              title={sidebarPinned ? "Colapsar menú" : "Fijar menú expandido"}
              aria-label={sidebarPinned ? "Colapsar menú" : "Fijar menú expandido"}
              className="sb-pin hidden h-[34px] items-center overflow-hidden rounded-[10px] md:flex"
              style={{ paddingLeft: ICON_LEFT, paddingRight: 10, color: "var(--sb-fg)" }}
            >
              <span className="flex shrink-0 items-center justify-center" style={{ width: ICON_BOX, height: ICON_BOX }}>
                {sidebarPinned
                  ? <PanelLeftClose size={16} strokeWidth={1.8} />
                  : <PanelLeftOpen size={16} strokeWidth={1.8} />}
              </span>
              <span
                className="whitespace-nowrap text-[13px] font-medium"
                style={{ paddingLeft: exp ? 10 : 0, ...textoEntrada(true), transition: `opacity 200ms ${exp ? TEXT_DELAY_OPEN : "0ms"}, padding-left ${DUR}` }}
              >
                {sidebarPinned ? "Colapsar menú" : "Fijar menú"}
              </span>
            </button>

            <div className="mx-[12px] my-[4px] hidden h-px bg-border md:block" />

            {/* Avatar: misma X que los íconos (centro en x=24) */}
            <div className="flex items-center pl-[12px] py-[4px]">
              <UserSettings profile={profile} variant="sidebar" expanded={exp} />
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

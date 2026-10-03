import {
  Calculator,
  Calendar,
  CalendarDays,
  ClipboardList,
  Kanban,
  LayoutDashboard,
  Scale,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  iconColor: string; // color del ícono (clase Tailwind o valor CSS)
  badge?: "causas" | "vencimientos";
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { href: "/",           label: "Dashboard",            icon: LayoutDashboard, iconColor: "#2563eb" },
      { href: "/causas",     label: "Causas",               icon: Scale,           iconColor: "#0891b2", badge: "causas" },
      { href: "/vencimientos",label: "Vencimientos",        icon: CalendarDays,    iconColor: "#b45309", badge: "vencimientos" },
      { href: "/clientes",   label: "Clientes",             icon: User,            iconColor: "#7c3aed" },
    ],
  },
  {
    title: "Finanzas",
    items: [
      { href: "/honorarios", label: "Honorarios",           icon: Wallet,          iconColor: "#059669" },
    ],
  },
  {
    title: "Actividad",
    items: [
      { href: "/movimientos",label: "Movimientos",          icon: ClipboardList,   iconColor: "#64748b" },
      { href: "/kanban",     label: "Kanban",               icon: Kanban,          iconColor: "#8b5cf6" },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { href: "/calendario", label: "Calendario",           icon: Calendar,        iconColor: "#0d9488" },
      { href: "/calculadora",label: "Calculadora de plazos",icon: Calculator,      iconColor: "#ea580c" },
    ],
  },
];

export function getPageTitle(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((i) =>
      i.href === "/" ? pathname === "/" : pathname.startsWith(i.href)
    );
    if (item) return item.label;
  }
  return "MANALEG";
}

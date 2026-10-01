import {
  Calculator,
  Calendar,
  CalendarDays,
  ClipboardList,
  Scale,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: "causas" | "vencimientos"; // qué contador muestra la pill
}

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "Principal",
    items: [
      { href: "/causas", label: "Causas", icon: Scale, badge: "causas" },
      { href: "/vencimientos", label: "Vencimientos", icon: CalendarDays, badge: "vencimientos" },
      { href: "/clientes", label: "Clientes", icon: User },
    ],
  },
  {
    title: "Finanzas",
    items: [{ href: "/honorarios", label: "Honorarios", icon: Wallet }],
  },
  {
    title: "Actividad",
    items: [{ href: "/movimientos", label: "Movimientos", icon: ClipboardList }],
  },
  {
    title: "Herramientas",
    items: [
      { href: "/calendario", label: "Calendario", icon: Calendar },
      { href: "/calculadora", label: "Calculadora de plazos", icon: Calculator },
    ],
  },
];

// Título del topbar según la ruta
export function getPageTitle(pathname: string): string {
  for (const section of NAV_SECTIONS) {
    const item = section.items.find((i) => pathname.startsWith(i.href));
    if (item) return item.label;
  }
  return "MANALEG";
}

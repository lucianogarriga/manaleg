"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldCheck } from "lucide-react";

const SECCIONES = [
  { href: "/admin", etiqueta: "Resumen" },
  { href: "/admin/usuarios", etiqueta: "Usuarios" },
  { href: "/admin/uso", etiqueta: "Uso de la app" },
  { href: "/admin/causas", etiqueta: "Causas" },
  { href: "/admin/auditoria", etiqueta: "Auditoría" },
];

// Cáscara visual del panel: distinta de la app de usuario, con su propio menú y un distintivo.
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3">
        <div className="flex items-center gap-2">
          <ShieldCheck size={18} className="text-amb" />
          <span className="text-[15px] font-bold text-text">Administración MANALEG</span>
        </div>
        <span className="rounded-full border border-amb/40 bg-amb/10 px-2.5 py-0.5 text-[11px] font-semibold text-amb">
          Modo administrador · solo lectura
        </span>
      </header>

      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-3">
        {SECCIONES.map((s) => {
          const activa = s.href === "/admin" ? pathname === "/admin" : pathname.startsWith(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors ${
                activa ? "border-amb text-text" : "border-transparent text-muted hover:text-sub"
              }`}
            >
              {s.etiqueta}
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto w-full max-w-[1100px] flex-1 p-4 md:p-6">{children}</main>
    </div>
  );
}

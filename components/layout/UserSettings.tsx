"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Settings, Bell, BellOff, FileText, ShieldCheck, LogOut } from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { toggleNotificacionesEmail } from "@/app/(app)/ajustes/actions";
import { getInitials } from "@/utils/formatters";
import type { Profile } from "@/types";

interface Props {
  profile: Profile;
}

export default function UserSettings({ profile }: Props) {
  const [open, setOpen] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(profile.notificaciones_email ?? true);
  const [isPending, startTransition] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const handleToggleEmail = () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    startTransition(async () => { await toggleNotificacionesEmail(next); });
  };

  return (
    <div ref={ref} className="relative">
      {/* Botón: avatar con iniciales + ícono gear superpuesto */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Ajustes"
        className="relative flex cursor-pointer items-center justify-center rounded-[7px] p-[5px] transition-colors"
        style={{ color: "var(--color-sub)" }}
        onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-row)")}
        onMouseLeave={(e) => (e.currentTarget.style.background = "")}
      >
        <div
          className="flex h-[26px] w-[26px] items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
        >
          {getInitials(profile.nombre_completo, profile.email[0]?.toUpperCase())}
        </div>
        {/* Mini gear badge */}
        <div
          className="absolute -bottom-[2px] -right-[2px] flex h-[14px] w-[14px] items-center justify-center rounded-full border"
          style={{ background: "var(--color-bg)", borderColor: "var(--color-border)" }}
        >
          <Settings size={8} strokeWidth={2.5} style={{ color: "var(--color-sub)" }} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-[calc(100%+8px)] z-50 w-[256px] overflow-hidden rounded-xl border shadow-lg"
          style={{ background: "var(--color-card)", borderColor: "var(--color-border)", boxShadow: "0 8px 32px rgba(0,0,0,.12)" }}
        >
          {/* Header usuario */}
          <div className="flex items-center gap-3 border-b px-4 py-3" style={{ borderColor: "var(--color-border)" }}>
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
              style={{ background: "linear-gradient(135deg, #2563eb, #7c3aed)" }}
            >
              {getInitials(profile.nombre_completo, profile.email[0]?.toUpperCase())}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-semibold text-text">
                {profile.nombre_completo ?? profile.email}
              </div>
              <div className="truncate text-[11.5px] text-muted">{profile.email}</div>
            </div>
          </div>

          {/* Notificaciones email toggle */}
          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-[10px] font-bold uppercase tracking-[.6px] text-muted px-1 pb-1">Notificaciones</div>
            <button
              type="button"
              onClick={handleToggleEmail}
              disabled={isPending}
              className="flex w-full items-center gap-3 rounded-[8px] px-2 py-[9px] transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-row)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              {emailEnabled
                ? <Bell size={14} strokeWidth={2} className="shrink-0 text-blue" />
                : <BellOff size={14} strokeWidth={2} className="shrink-0 text-muted" />
              }
              <span className="flex-1 text-left text-[13px] text-text">Alertas por email</span>
              {/* Toggle pill */}
              <span
                className="flex h-[18px] w-[32px] items-center rounded-full transition-colors duration-200"
                style={{ background: emailEnabled ? "var(--color-blue)" : "var(--color-border)" }}
              >
                <span
                  className="ml-[2px] h-[14px] w-[14px] rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ transform: emailEnabled ? "translateX(14px)" : "translateX(0)" }}
                />
              </span>
            </button>
            <p className="px-2 text-[11px] text-muted leading-tight">
              {emailEnabled
                ? "Recibís un email por día con todos los vencimientos del próximo día hábil."
                : "No se enviarán alertas por email."}
            </p>
          </div>

          {/* Legal */}
          <div className="px-3 py-2 border-b" style={{ borderColor: "var(--color-border)" }}>
            <div className="text-[10px] font-bold uppercase tracking-[.6px] text-muted px-1 pb-1">Legal</div>
            <Link
              href="/legal/terminos"
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-[8px] px-2 py-[8px] text-[13px] text-sub transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-row)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <FileText size={14} strokeWidth={2} className="shrink-0 text-muted" />
              Términos y Condiciones
            </Link>
            <Link
              href="/legal/privacidad"
              target="_blank"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-[8px] px-2 py-[8px] text-[13px] text-sub transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.background = "var(--hover-row)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "")}
            >
              <ShieldCheck size={14} strokeWidth={2} className="shrink-0 text-muted" />
              Política de Privacidad
            </Link>
          </div>

          {/* Logout */}
          <div className="px-3 py-2">
            <form action={logout}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-[8px] px-2 py-[8px] text-[13px] transition-colors"
                style={{ color: "var(--color-red)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--color-red-lt)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "")}
              >
                <LogOut size={14} strokeWidth={2} className="shrink-0" />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

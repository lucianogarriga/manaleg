"use client";

import { useGlobalLoading } from "@/hooks/useGlobalLoading";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  ArrowLeft, Bell, BellOff, Bug, ChevronRight, ExternalLink,
  FileText, LogOut, Mail, MessageSquare, ShieldCheck, Zap,
} from "lucide-react";
import { logout } from "@/app/(auth)/actions";
import { toggleNotificacionesEmail } from "@/app/(app)/ajustes/actions";
import { getInitials } from "@/utils/formatters";
import FeedbackModal from "./FeedbackModal";
import ContactModal from "./ContactModal";
import type { Profile } from "@/types";

interface Props {
  profile: Profile;
  variant?: "topbar" | "sidebar";
  expanded?: boolean;
  onTogglePin?: () => void;
  pinned?: boolean;
}

interface DropdownPos { bottom?: number; top?: number; left: number }

const MOBILE_QUERY = "(max-width: 767px)";
const DROPDOWN_WIDTH = 220;

function planLabel(profile: Profile): string {
  if (profile.estado_pago === "prueba") return "FREE";
  if (profile.plan === "full") return "FULL";
  if (profile.plan === "pro") return "PRO";
  return "FREE";
}

export default function UserSettings({ profile, variant = "topbar", expanded = true }: Props) {
  const isSidebar = variant === "sidebar";
  const [open, setOpen] = useState(false);
  const [masInfoOpen, setMasInfoOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(profile.notificaciones_email ?? true);
  const [isPending, startTransition] = useTransition();
  useGlobalLoading(isPending);
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMasInfoOpen(false);
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    if (isSidebar) {
      setPos({ bottom: window.innerHeight - r.top + 8, left: r.left });
    } else {
      setPos({ top: r.bottom + 8, left: r.right - DROPDOWN_WIDTH });
    }
  }, [open, isSidebar]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || dropRef.current?.contains(target) || subRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const handleToggleEmail = () => {
    const next = !emailEnabled;
    setEmailEnabled(next);
    startTransition(async () => { await toggleNotificacionesEmail(next); });
  };

  const initials = getInitials(profile.nombre_completo, profile.email[0]?.toUpperCase());
  const firstName = profile.nombre_completo?.split(" ")[0] ?? profile.email.split("@")[0];
  const plan = planLabel(profile);

  // En mobile el sidebar ocupa toda la pantalla: textos e íconos más grandes
  const txt = isSidebar ? "text-[15px] md:text-[12.5px]" : "text-[12.5px]";
  const ico = isSidebar ? "h-[18px] w-[18px] md:h-[13px] md:w-[13px]" : "h-[13px] w-[13px]";

  // ── Dropdown rows helpers ──────────────────────────────────────────────────
  const rowCls = `flex w-full items-center gap-[9px] rounded-[7px] px-[9px] py-[7px] text-left transition-colors cursor-pointer ${
    isSidebar ? "max-md:gap-[12px] max-md:px-[11px] max-md:py-[11px]" : ""
  }`;
  const rowStyle = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = ""; },
  };
  const separador = <div style={{ height: 1, background: "var(--color-border)", margin: "3px 0" }} />;

  // Anclaje vertical compartido por el menú principal y el submenú
  const anclaje: React.CSSProperties = pos
    ? (pos.bottom !== undefined ? { bottom: pos.bottom } : { top: pos.top })
    : {};
  const esMobile = typeof window !== "undefined" && window.matchMedia(MOBILE_QUERY).matches;

  // ── Menú principal ─────────────────────────────────────────────────────────
  const dropdown = pos && open && (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        zIndex: 9999,
        width: DROPDOWN_WIDTH,
        ...anclaje,
        left: pos.left,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,.16)",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-[10px] px-3 py-[10px]" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <div className="flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ width: 28, height: 28, background: "linear-gradient(135deg, #0284c7, #7c3aed)" }}>
          {initials}
        </div>
        <div className="min-w-0">
          <div className={`truncate font-semibold text-text leading-tight ${txt}`}>{profile.nombre_completo ?? profile.email}</div>
          {profile.nombre_completo && <div className={`truncate text-muted ${isSidebar ? "text-[13px] md:text-[11px]" : "text-[11px]"}`}>{profile.email}</div>}
        </div>
      </div>

      <div className="p-[5px]">
        {/* Alertas */}
        <button type="button" onClick={handleToggleEmail} disabled={isPending}
          className={rowCls} {...rowStyle}>
          {emailEnabled
            ? <Bell size={13} strokeWidth={1.8} className={`shrink-0 text-blue ${ico}`} />
            : <BellOff size={13} strokeWidth={1.8} className={`shrink-0 text-muted ${ico}`} />}
          <span className={`flex-1 text-sub ${txt}`}>Alertas por email</span>
          <span className="flex h-[15px] w-[26px] items-center rounded-full transition-colors duration-200"
            style={{ background: emailEnabled ? "var(--color-blue)" : "var(--color-border)" }}>
            <span className="ml-[2px] h-[11px] w-[11px] rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ transform: emailEnabled ? "translateX(11px)" : "translateX(0)" }} />
          </span>
        </button>

        {separador}

        {/* Mejorar plan / soporte */}
        <Link href="/planes" onClick={() => setOpen(false)} className={rowCls} {...rowStyle}>
          <Zap size={13} strokeWidth={1.8} className={`shrink-0 text-blue ${ico}`} />
          <span className={`flex-1 text-sub ${txt}`}>Mejorar plan</span>
        </Link>
        <button type="button" onClick={() => { setOpen(false); setFeedbackOpen(true); }}
          className={rowCls} {...rowStyle}>
          <Bug size={13} strokeWidth={1.8} className={`shrink-0 text-muted ${ico}`} />
          <span className={`text-sub ${txt}`}>Comunicar un error</span>
        </button>
        <button type="button" onClick={() => { setOpen(false); setContactOpen(true); }}
          className={rowCls} {...rowStyle}>
          <Mail size={13} strokeWidth={1.8} className={`shrink-0 text-muted ${ico}`} />
          <span className={`text-sub ${txt}`}>Contactanos</span>
        </button>

        {separador}

        {/* Más información: abre un submenú al costado (desktop) o superpuesto (mobile) */}
        <button type="button" onClick={() => setMasInfoOpen((v) => !v)} className={rowCls} {...rowStyle}
          aria-expanded={masInfoOpen}>
          <MessageSquare size={13} strokeWidth={1.8} className={`shrink-0 text-muted ${ico}`} />
          <span className={`flex-1 text-sub ${txt}`}>Más información</span>
          <ChevronRight size={12} className={`text-muted ${isSidebar ? "h-[16px] w-[16px] md:h-[12px] md:w-[12px]" : ""}`} />
        </button>

        {separador}

        {/* Logout */}
        <form action={logout}>
          <button type="submit" className={rowCls} style={{ color: "var(--color-red)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-red-lt)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
            <LogOut size={13} strokeWidth={1.8} className={`shrink-0 ${ico}`} />
            <span className={txt}>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </div>
  );

  // ── Submenú "Más información" ──────────────────────────────────────────────
  const submenu = pos && open && masInfoOpen && (
    <div
      ref={subRef}
      style={{
        position: "fixed",
        zIndex: 10000,
        ...(esMobile
          ? { left: 8, right: 8 }
          : { left: pos.left + DROPDOWN_WIDTH + 8, width: DROPDOWN_WIDTH }),
        ...anclaje,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,.16)",
        overflow: "hidden",
      }}
    >
      <div className="flex items-center gap-2 px-3 py-[9px]" style={{ borderBottom: "1px solid var(--color-border)" }}>
        <button type="button" onClick={() => setMasInfoOpen(false)}
          aria-label="Volver"
          className="flex cursor-pointer items-center justify-center rounded-md p-[3px] transition-colors"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
          <ArrowLeft size={13} className={`text-muted ${isSidebar ? "h-[18px] w-[18px] md:h-[13px] md:w-[13px]" : ""}`} />
        </button>
        <span className={`font-semibold text-text ${isSidebar ? "text-[15px] md:text-[12px]" : "text-[12px]"}`}>Más información</span>
      </div>

      <div className="p-[5px]">
        <Link href="/legal/terminos" target="_blank" onClick={() => setOpen(false)}
          className={rowCls} {...rowStyle}>
          <FileText size={13} strokeWidth={1.8} className={`shrink-0 text-muted ${ico}`} />
          <span className={`flex-1 text-sub ${txt}`}>Términos y Condiciones</span>
          <ExternalLink size={11} className="text-muted" />
        </Link>
        <Link href="/legal/privacidad" target="_blank" onClick={() => setOpen(false)}
          className={rowCls} {...rowStyle}>
          <ShieldCheck size={13} strokeWidth={1.8} className={`shrink-0 text-muted ${ico}`} />
          <span className={`flex-1 text-sub ${txt}`}>Política de Privacidad</span>
          <ExternalLink size={11} className="text-muted" />
        </Link>
        <Link href="/legal/privacidad#dpa" target="_blank" onClick={() => setOpen(false)}
          className={rowCls} {...rowStyle}>
          <ShieldCheck size={13} strokeWidth={1.8} className={`shrink-0 text-muted ${ico}`} />
          <span className={`flex-1 text-sub ${txt}`}>DPA</span>
          <ExternalLink size={11} className="text-muted" />
        </Link>
      </div>
    </div>
  );

  // ── Trigger ────────────────────────────────────────────────────────────────
  const avatarCircle = (
    <div className={`flex shrink-0 items-center justify-center rounded-full font-bold tracking-[.5px] ${
        isSidebar ? "h-[26px] w-[26px] text-[11px] md:h-[20px] md:w-[20px] md:text-[9px]" : "h-[20px] w-[20px] text-[9px]"
      }`}
      style={{ color: "var(--sb-bg)", background: "var(--sb-fg)" }}>
      {initials}
    </div>
  );

  return (
    <>
      {typeof document !== "undefined" && createPortal(
        <>
          {feedbackOpen && <FeedbackModal type="error" onClose={() => setFeedbackOpen(false)} />}
          {contactOpen  && <ContactModal onClose={() => setContactOpen(false)} />}
        </>,
        document.body,
      )}

      <button ref={triggerRef} type="button" onClick={() => setOpen((v) => !v)}
        title={profile.nombre_completo ?? profile.email}
        className="flex cursor-pointer items-center rounded-[7px] transition-opacity hover:opacity-75"
        style={{ gap: isSidebar && expanded ? 8 : 0, padding: 0 }}>
        {avatarCircle}
        {isSidebar && expanded && (
          <div className="flex min-w-0 items-baseline gap-[5px]">
            <span className="truncate font-bold leading-tight text-[15px] md:text-[11.5px]" style={{ color: "var(--sb-fg)" }}>
              {firstName}
            </span>
            <span className="shrink-0 text-[12.5px] italic md:text-[10px]" style={{ color: "var(--sb-fg)", opacity: 0.65 }}>
              {plan}
            </span>
          </div>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
      {typeof document !== "undefined" && createPortal(submenu, document.body)}
    </>
  );
}

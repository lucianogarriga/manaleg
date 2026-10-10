"use client";

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

type DropView = "main" | "more";
interface DropdownPos { bottom?: number; top?: number; left: number }

function planLabel(profile: Profile): string {
  if (profile.estado_pago === "prueba") return "Free";
  if (profile.plan === "pro") return "Pro";
  if (profile.plan === "intermedio") return "Inter";
  return "Free";
}

export default function UserSettings({ profile, variant = "topbar", expanded = true }: Props) {
  const isSidebar = variant === "sidebar";
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<DropView>("main");
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(profile.notificaciones_email ?? true);
  const [isPending, startTransition] = useTransition();
  const [pos, setPos] = useState<DropdownPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    if (isSidebar) {
      setPos({ bottom: window.innerHeight - r.top + 8, left: r.left });
    } else {
      setPos({ top: r.bottom + 8, left: r.right - 220 });
    }
    setView("main");
  }, [open, isSidebar]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node) || dropRef.current?.contains(e.target as Node)) return;
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

  // ── Dropdown rows helpers ──────────────────────────────────────────────────
  const rowCls = "flex w-full items-center gap-[9px] rounded-[7px] px-[9px] py-[7px] text-left transition-colors cursor-pointer";
  const rowStyle = {
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = ""; },
  };

  // ── Dropdown content ───────────────────────────────────────────────────────
  const dropdown = pos && open && (
    <div
      ref={dropRef}
      style={{
        position: "fixed",
        zIndex: 9999,
        width: 220,
        ...(pos.bottom !== undefined ? { bottom: pos.bottom } : { top: pos.top }),
        left: pos.left,
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,.16)",
        overflow: "hidden",
      }}
    >
      {view === "main" ? (
        <>
          {/* Header */}
          <div className="flex items-center gap-[10px] px-3 py-[10px]" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <div className="flex shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
              style={{ width: 28, height: 28, background: "linear-gradient(135deg, #0284c7, #7c3aed)" }}>
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold text-text leading-tight">{profile.nombre_completo ?? profile.email}</div>
              {profile.nombre_completo && <div className="truncate text-[11px] text-muted">{profile.email}</div>}
            </div>
          </div>

          <div className="p-[5px]">
            {/* Alertas */}
            <button type="button" onClick={handleToggleEmail} disabled={isPending}
              className={rowCls} {...rowStyle}>
              {emailEnabled
                ? <Bell size={13} strokeWidth={1.8} className="shrink-0 text-blue" />
                : <BellOff size={13} strokeWidth={1.8} className="shrink-0 text-muted" />}
              <span className="flex-1 text-[12.5px] text-sub">Alertas por email</span>
              <span className="flex h-[15px] w-[26px] items-center rounded-full transition-colors duration-200"
                style={{ background: emailEnabled ? "var(--color-blue)" : "var(--color-border)" }}>
                <span className="ml-[2px] h-[11px] w-[11px] rounded-full bg-white shadow-sm transition-transform duration-200"
                  style={{ transform: emailEnabled ? "translateX(11px)" : "translateX(0)" }} />
              </span>
            </button>

            <div style={{ height: 1, background: "var(--color-border)", margin: "3px 0" }} />

            {/* Mejorar plan / soporte */}
            <Link href="/planes" onClick={() => setOpen(false)} className={rowCls} {...rowStyle}>
              <Zap size={13} strokeWidth={1.8} className="shrink-0 text-blue" />
              <span className="flex-1 text-[12.5px] text-sub">Mejorar plan</span>
            </Link>
            <button type="button" onClick={() => { setOpen(false); setFeedbackOpen(true); }}
              className={rowCls} {...rowStyle}>
              <Bug size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="text-[12.5px] text-sub">Comunicar un error</span>
            </button>
            <button type="button" onClick={() => { setOpen(false); setContactOpen(true); }}
              className={rowCls} {...rowStyle}>
              <Mail size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="text-[12.5px] text-sub">Contactanos</span>
            </button>

            <div style={{ height: 1, background: "var(--color-border)", margin: "3px 0" }} />

            {/* Más información */}
            <button type="button" onClick={() => setView("more")} className={rowCls} {...rowStyle}>
              <MessageSquare size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="flex-1 text-[12.5px] text-sub">Más información</span>
              <ChevronRight size={12} className="text-muted" />
            </button>

            <div style={{ height: 1, background: "var(--color-border)", margin: "3px 0" }} />

            {/* Logout */}
            <form action={logout}>
              <button type="submit" className={rowCls} style={{ color: "var(--color-red)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-red-lt)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
                <LogOut size={13} strokeWidth={1.8} className="shrink-0" />
                <span className="text-[12.5px]">Cerrar sesión</span>
              </button>
            </form>
          </div>
        </>
      ) : (
        <>
          {/* Sub-header */}
          <div className="flex items-center gap-2 px-3 py-[9px]" style={{ borderBottom: "1px solid var(--color-border)" }}>
            <button type="button" onClick={() => setView("main")}
              className="flex cursor-pointer items-center justify-center rounded-md p-[3px] transition-colors"
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--hover-row)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}>
              <ArrowLeft size={13} className="text-muted" />
            </button>
            <span className="text-[12px] font-semibold text-text">Más información</span>
          </div>

          <div className="p-[5px]">
            {/* Legal */}
            <Link href="/legal/terminos" target="_blank" onClick={() => setOpen(false)}
              className={rowCls} {...rowStyle}>
              <FileText size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="flex-1 text-[12.5px] text-sub">Términos y Condiciones</span>
              <ExternalLink size={11} className="text-muted" />
            </Link>
            <Link href="/legal/privacidad" target="_blank" onClick={() => setOpen(false)}
              className={rowCls} {...rowStyle}>
              <ShieldCheck size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="flex-1 text-[12.5px] text-sub">Política de Privacidad</span>
              <ExternalLink size={11} className="text-muted" />
            </Link>
            <Link href="/legal/privacidad#dpa" target="_blank" onClick={() => setOpen(false)}
              className={rowCls} {...rowStyle}>
              <ShieldCheck size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="flex-1 text-[12.5px] text-sub">DPA</span>
              <ExternalLink size={11} className="text-muted" />
            </Link>

            <div style={{ height: 1, background: "var(--color-border)", margin: "3px 0" }} />

            {/* Planes */}
            <Link href="/planes" onClick={() => setOpen(false)} className={rowCls} {...rowStyle}>
              <Zap size={13} strokeWidth={1.8} className="shrink-0 text-blue" />
              <span className="flex-1 text-[12.5px] text-sub">Mejorar plan</span>
            </Link>

            <div style={{ height: 1, background: "var(--color-border)", margin: "3px 0" }} />

            {/* Soporte */}
            <button type="button" onClick={() => { setOpen(false); setFeedbackOpen(true); }}
              className={rowCls} {...rowStyle}>
              <Bug size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="text-[12.5px] text-sub">Comunicar un error</span>
            </button>
            <button type="button" onClick={() => { setOpen(false); setContactOpen(true); }}
              className={rowCls} {...rowStyle}>
              <Mail size={13} strokeWidth={1.8} className="shrink-0 text-muted" />
              <span className="text-[12.5px] text-sub">Contactanos</span>
            </button>
          </div>
        </>
      )}
    </div>
  );

  // ── Trigger ────────────────────────────────────────────────────────────────
  const avatarCircle = (
    <div className="flex shrink-0 items-center justify-center rounded-full font-bold"
      style={{ width: 20, height: 20, fontSize: 9, letterSpacing: ".5px", color: "var(--sb-bg)", background: "var(--sb-fg)" }}>
      {initials}
    </div>
  );

  return (
    <>
      {feedbackOpen && <FeedbackModal type="error" onClose={() => setFeedbackOpen(false)} />}
      {contactOpen  && <ContactModal onClose={() => setContactOpen(false)} />}

      <button ref={triggerRef} type="button" onClick={() => setOpen((v) => !v)}
        title={profile.nombre_completo ?? profile.email}
        className="flex cursor-pointer items-center rounded-[7px] transition-opacity hover:opacity-75"
        style={{ gap: isSidebar && expanded ? 8 : 0, padding: 0 }}>
        {avatarCircle}
        {isSidebar && expanded && (
          <div className="flex min-w-0 items-baseline gap-[5px]">
            <span className="truncate text-[11.5px] font-bold leading-tight" style={{ color: "var(--sb-fg)" }}>
              {firstName}
            </span>
            <span className="shrink-0 text-[10px] italic" style={{ color: "var(--sb-fg)", opacity: 0.65 }}>
              {plan}
            </span>
          </div>
        )}
      </button>

      {typeof document !== "undefined" && createPortal(dropdown, document.body)}
    </>
  );
}

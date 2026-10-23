import { BellDot, Users, FileText } from "lucide-react";
import FondoVivo from "@/components/layout/FondoVivo";

const FEATURES = [
  {
    icon: FileText,
    title: "Todos tus expedientes, sin caos",
    desc: "Seguí el estado de cada causa, cargá movimientos y tenés todo en un solo lugar.",
  },
  {
    icon: BellDot,
    title: "Nunca más un vencimiento perdido",
    desc: "Alertas automáticas con la anticipación que vos elegís. Siempre un paso adelante.",
  },
  {
    icon: Users,
    title: "Tu equipo, sincronizado",
    desc: "Delegá causas a colegas, gestioná accesos y trabajen juntos sin pisarse.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh" data-theme="light">
      {/* ── Panel izquierdo — marca. Mismo fondo desenfocado que la app ── */}
      <div
        className="relative isolate hidden flex-col justify-between overflow-hidden px-10 py-10 md:flex"
        style={{ width: "44%", background: "var(--color-bg)" }}
      >
        <FondoVivo />

        {/* Placeholder para mantener el justify-between */}
        <div className="relative" />

        {/* Headline + features */}
        <div className="relative">
          {/* Logo — icono + MANALEG justo arriba del título */}
          <div className="mb-4 flex items-center gap-[10px]">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] text-[17px] font-bold text-on-primary" style={{ background: "var(--color-blue)" }}>
              M
            </div>
            <span className="text-[20px] font-bold tracking-[.6px]" style={{ color: "var(--color-text)" }}>MANALEG</span>
          </div>
          <h1 className="mb-3 text-[26px] font-bold leading-[1.22]" style={{ color: "var(--color-text)" }}>
            Tu manager legal,<br />tus causas al día
          </h1>
          <p className="mb-8 max-w-[290px] text-[13px] leading-[1.65]" style={{ color: "var(--color-sub)" }}>
            Organizá tu estudio jurídico, seguí cada expediente y tomá el control de tu cartera de clientes desde un solo lugar.
          </p>

          <div className="flex flex-col gap-[16px]">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-[12px]">
                <div
                  className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] shadow-sm"
                  style={{ background: "var(--color-card)", border: "1px solid var(--color-border)" }}
                >
                  <Icon size={13} strokeWidth={2} style={{ color: "var(--color-blue)" }} />
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold leading-tight" style={{ color: "var(--color-text)" }}>{title}</div>
                  <div className="mt-[2px] text-[11.5px] leading-snug" style={{ color: "var(--color-muted)" }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-[10.5px]" style={{ color: "var(--color-muted)" }}>
          © {new Date().getFullYear()} Manaleg · Todos los derechos reservados
        </div>
      </div>

      {/* ── Panel derecho — card flotante sobre fondo claro ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8" style={{ background: "var(--color-bg)" }}>
        {/* Logo solo en mobile */}
        <div className="mb-6 flex flex-col items-center gap-2 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[18px] font-bold text-bg" style={{ background: "var(--color-blue)" }}>
            M
          </div>
          <div className="text-[17px] font-bold" style={{ color: "var(--color-text)" }}>MANALEG</div>
        </div>

        <div className="w-full max-w-[390px]">
          <div
            className="rounded-2xl p-8"
            style={{
              background: "var(--color-card)",
              border: "1px solid var(--color-border)",
              boxShadow: "0 4px 24px rgba(0,0,0,.08)",
            }}
          >
            {children}
          </div>
          <p className="mt-5 text-center text-[11.5px]" style={{ color: "var(--color-muted)" }}>
            Plataforma segura · Tus datos siempre protegidos
          </p>
        </div>
      </div>
    </main>
  );
}

import { BellDot, Users, FileText } from "lucide-react";

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
      {/* ── Panel izquierdo — marca ── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden px-10 py-10 md:flex"
        style={{
          width: "44%",
          background: "linear-gradient(160deg, #0a1628 0%, #0f2460 28%, #1e3a8a 62%, #2563eb 100%)",
        }}
      >
        {/* Orbe decorativo inferior-derecha */}
        <div
          className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(147,197,253,.12) 0%, transparent 65%)" }}
        />
        {/* Orbe superior */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-[240px] w-[240px] -translate-x-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(191,219,254,.07) 0%, transparent 70%)" }}
        />

        {/* Placeholder para mantener el justify-between */}
        <div className="relative" />

        {/* Headline + features */}
        <div className="relative">
          {/* Logo — icono + MANALEG justo arriba del título */}
          <div className="mb-4 flex items-center gap-[10px]">
            <div className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-white/15 text-[17px] font-bold text-white">
              M
            </div>
            <span className="text-[20px] font-bold tracking-[.6px] text-white">MANALEG</span>
          </div>
          <h1 className="mb-3 text-[26px] font-bold leading-[1.22] text-white">
            Tu manager legal,<br />tus causas al día
          </h1>
          <p className="mb-8 max-w-[290px] text-[13px] leading-[1.65] text-blue-100/65">
            Organizá tu estudio jurídico, seguí cada expediente y tomá el control de tu cartera de clientes desde un solo lugar.
          </p>

          <div className="flex flex-col gap-[16px]">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-[12px]">
                <div className="flex h-[28px] w-[28px] shrink-0 items-center justify-center rounded-[7px] bg-white/10 ring-1 ring-white/[.08]">
                  <Icon size={13} strokeWidth={2} className="text-blue-200" />
                </div>
                <div>
                  <div className="text-[12.5px] font-semibold leading-tight text-white">{title}</div>
                  <div className="mt-[2px] text-[11.5px] leading-snug text-blue-200/55">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-[10.5px] text-blue-300/40">
          © {new Date().getFullYear()} Manaleg · Todos los derechos reservados
        </div>
      </div>

      {/* ── Panel derecho — card flotante sobre fondo claro ── */}
      <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 py-8" style={{ background: "#f0f4f8" }}>
        {/* Logo solo en mobile */}
        <div className="mb-6 flex flex-col items-center gap-2 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] text-[18px] font-bold text-white" style={{ background: "#2563eb" }}>
            M
          </div>
          <div className="text-[17px] font-bold" style={{ color: "#0f172a" }}>MANALEG</div>
        </div>

        <div className="w-full max-w-[390px]">
          <div
            className="rounded-2xl p-8"
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 24px rgba(0,0,0,.08)",
            }}
          >
            {children}
          </div>
          <p className="mt-5 text-center text-[11.5px]" style={{ color: "#94a3b8" }}>
            Plataforma segura · Tus datos siempre protegidos
          </p>
        </div>
      </div>
    </main>
  );
}

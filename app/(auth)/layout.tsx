import { Scale, BellDot, Users, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Scale,
    title: "Expedientes organizados",
    desc: "Todas tus causas y datos procesales en un solo lugar.",
  },
  {
    icon: BellDot,
    title: "Alertas automáticas",
    desc: "Nunca pierdas un vencimiento. Configurá avisos con anticipación.",
  },
  {
    icon: Users,
    title: "Trabajo en equipo",
    desc: "Compartí causas con colegas y gestioná accesos.",
  },
  {
    icon: ShieldCheck,
    title: "Seguro y privado",
    desc: "Tus datos cifrados, accesibles solo para vos.",
  },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen">
      {/* ── Panel izquierdo — marca ── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden px-10 py-12 md:flex"
        style={{
          width: "44%",
          background: "linear-gradient(160deg, #0f2460 0%, #1e3a8a 45%, #1d4ed8 100%)",
        }}
      >
        {/* Fondo geométrico sutil */}
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[.06]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
        {/* Círculo decorativo */}
        <div
          className="pointer-events-none absolute -bottom-32 -right-32 h-[420px] w-[420px] rounded-full opacity-[.08]"
          style={{ background: "radial-gradient(circle, #93c5fd, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-white/15 backdrop-blur-sm">
            <Scale size={18} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-[18px] font-bold tracking-wide text-white">Manaleg</span>
        </div>

        {/* Headline */}
        <div className="relative">
          <h1 className="mb-3 text-[32px] font-bold leading-[1.2] text-white">
            Gestión legal<br />inteligente
          </h1>
          <p className="mb-10 text-[15px] leading-relaxed text-blue-200/80">
            La plataforma para estudios jurídicos que quieren trabajar con claridad y sin perder el control.
          </p>

          <div className="flex flex-col gap-5">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[8px] bg-white/12">
                  <Icon size={15} strokeWidth={2} className="text-blue-200" />
                </div>
                <div>
                  <div className="text-[13.5px] font-semibold text-white">{title}</div>
                  <div className="text-[12.5px] leading-snug text-blue-200/70">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-[11px] text-blue-300/60">
          © {new Date().getFullYear()} Manaleg · Todos los derechos reservados
        </div>
      </div>

      {/* ── Panel derecho — formulario ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-bg px-6 py-12">
        {/* Logo solo en mobile */}
        <div className="mb-8 flex flex-col items-center gap-2 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue">
            <Scale size={20} strokeWidth={2} className="text-white" />
          </div>
          <div className="text-[17px] font-bold text-text">Manaleg</div>
        </div>

        <div className="w-full max-w-[400px]">
          <div className="rounded-2xl border border-border bg-card px-8 py-9 shadow-sm">
            {children}
          </div>
          <p className="mt-5 text-center text-[12px] text-muted">
            Plataforma segura · Datos protegidos
          </p>
        </div>
      </div>
    </main>
  );
}

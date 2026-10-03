import { Scale, BellDot, Users, FileText } from "lucide-react";

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
    /* data-theme="light" fuerza colores claros en la pantalla de auth
       independientemente del modo del sistema operativo */
    <main className="flex min-h-screen" data-theme="light">
      {/* ── Panel izquierdo — marca ── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden px-11 py-12 md:flex"
        style={{
          width: "44%",
          background: "linear-gradient(160deg, #0a1628 0%, #0f2460 28%, #1e3a8a 62%, #2563eb 100%)",
        }}
      >
        {/* Orbe grande inferior-derecha */}
        <div
          className="pointer-events-none absolute -bottom-48 -right-48 h-[560px] w-[560px] rounded-full"
          style={{ background: "radial-gradient(circle, rgba(147,197,253,.13) 0%, transparent 65%)" }}
        />
        {/* Orbe pequeño superior */}
        <div
          className="pointer-events-none absolute top-0 left-1/2 h-[260px] w-[260px] -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(191,219,254,.08) 0%, transparent 70%)" }}
        />

        {/* Logo — solo icono + nombre, sin nada a la izquierda del texto */}
        <div className="relative">
          <div className="mb-2 flex h-[38px] w-[38px] items-center justify-center rounded-[10px] bg-white/15">
            <Scale size={19} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-[22px] font-bold tracking-[.5px] text-white">MANALEG</span>
        </div>

        {/* Headline + features */}
        <div className="relative">
          <p className="mb-2 text-[11.5px] font-semibold uppercase tracking-[1.4px] text-blue-300/60">
            El CRM legal que necesitás
          </p>
          <h1 className="mb-4 text-[28px] font-bold leading-[1.22] text-white">
            Tu manager de causas,<br />siempre al día
          </h1>
          <p className="mb-10 max-w-[300px] text-[13.5px] leading-[1.65] text-blue-100/70">
            Organizá tu estudio jurídico, seguí cada expediente y nunca más pierdas el hilo de lo que pasa en tu cartera de clientes.
          </p>

          <div className="flex flex-col gap-[20px]">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-start gap-[14px]">
                <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px] bg-white/10 ring-1 ring-white/[.08]">
                  <Icon size={14} strokeWidth={2} className="text-blue-200" />
                </div>
                <div>
                  <div className="text-[13px] font-semibold leading-tight text-white">{title}</div>
                  <div className="mt-[3px] text-[12px] leading-snug text-blue-200/60">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-[11px] text-blue-300/40">
          © {new Date().getFullYear()} Manaleg · Todos los derechos reservados
        </div>
      </div>

      {/* ── Panel derecho — card flotante (fondo neutro) ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-[#f0f4f8] px-6 py-12">
        {/* Logo solo en mobile */}
        <div className="mb-6 flex flex-col items-center gap-2 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-blue">
            <Scale size={20} strokeWidth={2} className="text-white" />
          </div>
          <div className="text-[17px] font-bold text-[#0f172a]">MANALEG</div>
        </div>

        <div className="w-full max-w-[390px]">
          <div className="rounded-2xl border border-[#e2e8f0] bg-white p-8 shadow-[0_4px_24px_rgba(0,0,0,.08)]">
            {children}
          </div>
          <p className="mt-5 text-center text-[11.5px] text-[#94a3b8]">
            Plataforma segura · Tus datos siempre protegidos
          </p>
        </div>
      </div>
    </main>
  );
}

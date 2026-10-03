export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen bg-bg">
      {/* Panel izquierdo — marca (42%) */}
      <div
        className="hidden flex-col items-center justify-center gap-6 px-12 md:flex"
        style={{
          width: "42%",
          background: "linear-gradient(160deg, #1e3a8a 0%, #1e40af 40%, #2563eb 100%)",
        }}
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 text-[32px] backdrop-blur-sm">
            ⚖
          </div>
          <div>
            <div className="text-[28px] font-bold tracking-wide text-white">MANALEG</div>
            <div className="mt-1 text-[15px] text-blue-200">Gestión de causas jurídicas</div>
          </div>
        </div>

        <div className="mt-4 flex max-w-[280px] flex-col gap-3">
          {[
            { icon: "📁", text: "Organizá tus causas y expedientes en un solo lugar" },
            { icon: "⏰", text: "Nunca pierdas un vencimiento con alertas automáticas" },
            { icon: "👥", text: "Compartí causas con tu equipo fácilmente" },
          ].map((item) => (
            <div key={item.text} className="flex items-start gap-3">
              <span className="text-[18px] leading-none mt-[2px]">{item.icon}</span>
              <p className="text-[13.5px] leading-snug text-blue-100">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 text-[11px] text-blue-300">
          © {new Date().getFullYear()} Manaleg · Todos los derechos reservados
        </div>
      </div>

      {/* Panel derecho — formulario (58%) */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Logo solo en mobile */}
        <div className="mb-6 flex flex-col items-center gap-2 md:hidden">
          <div className="flex h-10 w-10 items-center justify-center rounded-[9px] bg-blue text-[20px] text-white">
            ⚖
          </div>
          <div className="text-[18px] font-bold text-text">MANALEG</div>
        </div>

        <div className="w-full max-w-[380px]">
          <div className="rounded-xl border border-border bg-card p-7 shadow-sm">
            {children}
          </div>
        </div>
      </div>
    </main>
  );
}

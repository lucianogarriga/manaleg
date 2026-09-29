export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-[360px]">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-[9px] bg-navy text-[18px] text-white">
            ⚖
          </div>
          <div className="text-[18px] font-bold tracking-[.2px] text-text">MANALEG</div>
          <div className="text-[11.5px] text-muted">Gestión de causas jurídicas</div>
        </div>
        <div className="rounded-[7px] border border-border bg-card p-5">{children}</div>
      </div>
    </main>
  );
}

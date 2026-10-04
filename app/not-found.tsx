import Link from "next/link";

export default function NotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--color-bg)" }}
    >
      <p className="mb-2 text-[64px] font-bold leading-none" style={{ color: "var(--color-blue)" }}>
        404
      </p>
      <h1 className="mb-2 text-[20px] font-bold" style={{ color: "var(--color-text)" }}>
        Página no encontrada
      </h1>
      <p className="mb-8 text-[14px]" style={{ color: "var(--color-sub)" }}>
        La URL que ingresaste no existe.
      </p>
      <Link
        href="/"
        className="rounded-[8px] px-5 py-[9px] text-[13.5px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: "var(--color-blue)" }}
      >
        Ir al inicio
      </Link>
    </div>
  );
}

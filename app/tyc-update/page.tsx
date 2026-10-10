import { Scale } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/services/supabase/server";
import { acceptUpdatedTyc } from "./actions";
import { CURRENT_TYC_VERSION } from "@/utils/constants";

export const metadata = { title: "Actualización de Términos — MANALEG" };

export default async function TycUpdatePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  // Verificar que hay sesión activa; si no, al login
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) redirect("/login");

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-[500px] rounded-[12px] border border-border bg-card p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-[32px] w-[32px] items-center justify-center rounded-[8px] bg-blue">
            <Scale size={16} strokeWidth={2} className="text-white" />
          </div>
          <span className="text-[16px] font-bold tracking-[.4px] text-text">MANALEG</span>
        </div>

        <h1 className="mb-2 text-[20px] font-bold text-text">Actualizamos nuestros Términos</h1>
        <p className="mb-5 text-[13.5px] leading-[1.6] text-sub">
          Publicamos la versión <strong className="text-text">{CURRENT_TYC_VERSION}</strong> de los Términos y Condiciones y la Política de Privacidad. Para continuar usando MANALEG, revisalos y confirmá tu aceptación.
        </p>

        <div className="mb-6 flex flex-wrap gap-4">
          <Link href="/legal/terminos" target="_blank" className="text-[13px] font-semibold text-blue hover:underline">
            Términos y Condiciones →
          </Link>
          <Link href="/legal/privacidad" target="_blank" className="text-[13px] font-semibold text-blue hover:underline">
            Política de Privacidad →
          </Link>
        </div>

        <p className="mb-5 text-[12px] text-muted leading-[1.5]">
          Al aceptar, otorgás consentimiento expreso al almacenamiento de tus datos en servidores ubicados en Brasil (art. 12 Ley 25.326) y a los términos del encargo de tratamiento descritos en la sección 4 de los T&C.
        </p>

        {error && (
          <p className="mb-4 rounded-[8px] px-3 py-2 text-[13px]" style={{ background: "var(--color-red-lt)", color: "var(--color-red)" }}>
            No se pudo registrar la aceptación. Intentá de nuevo.
          </p>
        )}

        <form action={acceptUpdatedTyc}>
          <button
            type="submit"
            className="w-full cursor-pointer rounded-[8px] bg-blue py-[10px] text-[14px] font-semibold text-white hover:opacity-90"
          >
            Leí y acepto la versión {CURRENT_TYC_VERSION}
          </button>
        </form>
      </div>
    </div>
  );
}

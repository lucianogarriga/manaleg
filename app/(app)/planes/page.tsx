import { getCurrentProfile } from "@/components/auth/AuthGuard";
import { Check, Clock, Zap } from "lucide-react";

export const metadata = { title: "Planes y Uso — MANALEG" };

const PLANS = [
  {
    id: "prueba",
    name: "Free",
    subtitle: "Para conocer MANALEG sin compromiso",
    priceLabel: "Gratis",
    priceSub: "15 días, sin tarjeta de crédito",
    highlight: false,
    features: [
      "Acceso completo a todas las funcionalidades",
      "Hasta 10 causas activas",
      "Alertas de vencimiento por email",
    ],
    comingSoon: [],
  },
  {
    id: "intermedio",
    name: "Intermedio",
    subtitle: "Para abogados que necesitan más herramientas",
    priceLabel: "$ ----",
    priceSub: "/ mes · renovación automática",
    highlight: true,
    features: [
      "Causas ilimitadas",
      "Compartir causas con colaboradores",
      "Alertas y vencimientos ilimitados",
      "Kanban y calendario integrado",
      "Gestión de honorarios y pagos",
      "Soporte prioritario por email",
    ],
    comingSoon: [
      "Carga de adjuntos",
      "Plantillas y modelos de escritos",
      "Sync con Google Calendar",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    subtitle: "Para estudios jurídicos y equipos",
    priceLabel: "$ ----",
    priceSub: "/ mes · renovación automática",
    highlight: false,
    features: [
      "Todo lo del plan Intermedio",
    ],
    comingSoon: [
      "Asistente IA para resumir causas",
      "Corrector de redacción en escritos",
      "Revisor de contratos",
      "Asistente lógico y de contradicciones",
    ],
  },
];

export default async function PlanesPage() {
  const profile = await getCurrentProfile();
  const esPrueba = profile.estado_pago === "prueba";
  const esPro = profile.plan === "pro" && profile.estado_pago === "activo";
  const esInter = profile.plan === "intermedio" && profile.estado_pago === "activo";

  return (
    <div className="mx-auto max-w-[980px] px-4 py-8">
      <div className="mb-8">
        <h1 className="text-[22px] font-bold text-text">Planes y Uso</h1>
        {!esPrueba && (
          <p className="mt-1 text-[13.5px] text-muted">
            {esPro
              ? "Tu plan Pro está activo."
              : esInter
              ? "Tu plan Intermedio está activo."
              : "Tu plan está vencido. Renovalo para continuar usando MANALEG."}
          </p>
        )}
        {esPrueba && (
          <p className="mt-2 text-[13px] italic text-muted">
            Has sido beneficiado para probar la fase BETA del software accediendo a todas las funcionalidades que cuenta el sistema actualmente de manera gratuita.
          </p>
        )}
      </div>

      {/* Estado actual */}
      <div
        className="mb-8 rounded-[10px] border px-5 py-4"
        style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
      >
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.5px] text-muted">Plan actual</p>
            <p className="mt-[2px] text-[15px] font-bold text-text">
              {esPrueba ? "BETA" : esPro ? "Pro" : esInter ? "Intermedio" : "Sin plan activo"}
            </p>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.5px] text-muted">Estado</p>
            <span
              className="mt-[2px] inline-block rounded-[5px] px-2 py-[2px] text-[12px] font-semibold"
              style={
                profile.estado_pago === "activo"
                  ? { background: "var(--color-grn-lt)", color: "var(--color-grn)" }
                  : profile.estado_pago === "prueba"
                  ? { background: "var(--color-blue-lt)", color: "var(--color-blue)" }
                  : { background: "var(--color-red-lt)", color: "var(--color-red)" }
              }
            >
              {profile.estado_pago === "activo" ? "Activo" : profile.estado_pago === "prueba" ? "Prueba" : "Vencido"}
            </span>
          </div>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[.5px] text-muted">Causas máx.</p>
            <p className="mt-[2px] text-[15px] font-bold text-text">
              {profile.causas_max === 9999 ? "Ilimitadas" : profile.causas_max}
            </p>
          </div>
        </div>
      </div>

      {/* Cards de planes */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANS.map((plan) => {
          const isCurrent =
            (plan.id === "prueba" && esPrueba) ||
            (plan.id === "pro" && esPro) ||
            (plan.id === "intermedio" && esInter);
          return (
            <div
              key={plan.id}
              className="relative flex flex-col rounded-[12px] border p-6"
              style={{
                borderColor: plan.highlight ? "var(--color-blue)" : "var(--color-border)",
                background: plan.highlight ? "var(--color-blue-lt)" : "var(--color-card)",
                boxShadow: plan.highlight ? "0 0 0 1px var(--color-blue)" : undefined,
              }}
            >
              {plan.highlight && (
                <div className="absolute -top-[11px] left-5 flex items-center gap-1 rounded-full bg-blue px-3 py-[2px] text-[10.5px] font-bold uppercase tracking-wide text-white">
                  <Zap size={9} strokeWidth={2.5} /> Más popular
                </div>
              )}

              <p className="text-[17px] font-bold uppercase tracking-[.5px] text-text">{plan.name}</p>
              <p className="mt-[3px] text-[12px] text-muted">{plan.subtitle}</p>

              <div className="my-5">
                <span className="block text-[26px] font-bold text-text">{plan.priceLabel}</span>
                <span className="mt-1 block text-[11.5px] text-muted">{plan.priceSub}</span>
              </div>

              <ul className="mb-4 flex flex-col gap-[7px]">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px] text-sub">
                    <Check size={12} strokeWidth={2.5} className="mt-[2px] shrink-0 text-blue" />
                    {f}
                  </li>
                ))}
                {plan.comingSoon.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-[12.5px] text-muted">
                    <Clock size={12} strokeWidth={2} className="mt-[2px] shrink-0 text-muted opacity-60" />
                    <span>
                      {f}{" "}
                      <span className="rounded-[4px] bg-amber-100 px-[5px] py-px text-[10px] font-semibold text-amber-600">
                        Proximamente
                      </span>
                    </span>
                  </li>
                ))}
              </ul>

              {isCurrent ? (
                <div
                  className="mt-auto rounded-[8px] py-[9px] text-center text-[13px] font-semibold"
                  style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
                >
                  Plan actual
                </div>
              ) : plan.id === "prueba" ? (
                <div
                  className="mt-auto rounded-[8px] py-[9px] text-center text-[13px] font-semibold"
                  style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
                >
                  Plan base
                </div>
              ) : (
                <a
                  href={`mailto:contacto@manaleg.com.ar?subject=Quiero%20contratar%20el%20Plan%20${plan.name}`}
                  className="mt-auto block rounded-[8px] bg-blue py-[9px] text-center text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Contratar Plan {plan.name}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <p className="mt-6 text-center text-[12px] text-muted">
        ¿Tenés preguntas sobre los planes? Escribinos a{" "}
        <a href="mailto:contacto@manaleg.com.ar" className="text-blue hover:underline">
          contacto@manaleg.com.ar
        </a>
      </p>
    </div>
  );
}

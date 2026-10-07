"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { saveVencimientoCausa } from "@/app/(app)/calculadora/actions";
import FormAlert from "@/components/auth/FormAlert";
import { SelectField, TextField } from "@/components/ui/FormControls";
import { useFormAction } from "@/hooks/useFormAction";
import { useUIStore } from "@/store/uiStore";
import { TIPOS_AVISO } from "@/utils/constants";
import { calcularPlazo } from "@/utils/diasHabiles";
import { formatDate, formatLongDate } from "@/utils/formatters";
import type { DiaInhabil } from "@/types";

interface CalculadoraViewProps {
  hoy: string;
  inhabiles: DiaInhabil[];
  causas: { id: string; caratula: string }[];
}

export default function CalculadoraView({ hoy, inhabiles, causas }: CalculadoraViewProps) {
  const [desde, setDesde] = useState(hoy);
  const [dias, setDias] = useState("10");
  const [tipo, setTipo] = useState<"habiles" | "corridos">("habiles");
  const showToast = useUIStore((s) => s.showToast);

  const setInhabiles = useMemo(() => new Set(inhabiles.map((d) => d.fecha)), [inhabiles]);
  const descripciones = useMemo(() => new Map(inhabiles.map((d) => [d.fecha, d.descripcion])), [inhabiles]);

  const cantidad = Number(dias);
  const valido = /^\d{4}-\d{2}-\d{2}$/.test(desde) && Number.isInteger(cantidad) && cantidad >= 1 && cantidad <= 365;
  const resultado = useMemo(
    () => (valido ? calcularPlazo(desde, cantidad, tipo, setInhabiles) : null),
    [valido, desde, cantidad, tipo, setInhabiles],
  );

  const { state, pending, onSubmit } = useFormAction(saveVencimientoCausa, (s) =>
    showToast({ message: s.message ?? "Guardado." }),
  );

  const anioSinFeriados = resultado && !inhabiles.some((d) => d.user_id === null && d.fecha.startsWith(resultado.vencimiento.slice(0, 4)));

  return (
    <div className="mx-auto grid max-w-[1000px] gap-3 p-3 md:grid-cols-[340px_1fr]">
      {/* ── Datos ── */}
      <section className="self-start rounded-[7px] border border-border bg-card">
        <div className="border-b border-border px-3 py-[9px] text-[13px] font-bold tracking-[.4px] text-sub uppercase">
          Datos del plazo
        </div>
        <div className="space-y-3 p-3">
          <TextField label="Fecha de notificación" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          <TextField
            label="Cantidad de días"
            type="number"
            min={1}
            max={365}
            value={dias}
            onChange={(e) => setDias(e.target.value)}
          />
          <SelectField
            label="Tipo de plazo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "habiles" | "corridos")}
            options={[
              { value: "habiles", label: "Días hábiles" },
              { value: "corridos", label: "Días corridos" },
            ]}
          />
          <p className="flex gap-2 text-[13px] text-muted">
            <Info size={15} className="mt-px shrink-0" />
            El plazo empieza a correr el día siguiente a la notificación. Los sábados, domingos, feriados y días
            inhábiles que cargaste no se cuentan.
          </p>
        </div>
      </section>

      {/* ── Resultado ── */}
      <section className="min-w-0 space-y-3">
        {!resultado ? (
          <div className="rounded-[7px] border border-border bg-card p-4 text-[14px] text-muted">
            Completá una fecha y una cantidad de días (entre 1 y 365).
          </div>
        ) : (
          <>
            <div className="rounded-[7px] border border-border bg-card p-4">
              <div className="text-[12px] font-bold tracking-[.4px] text-muted uppercase">El plazo vence el</div>
              <div className="mt-1 text-[26px] leading-tight font-extrabold text-blue">{formatLongDate(resultado.vencimiento)}</div>
              <div className="mt-1 text-[14px] text-sub">
                {cantidad} {cantidad === 1 ? "día" : "días"} {tipo === "habiles" ? "hábiles" : "corridos"} desde el{" "}
                {formatDate(desde)}
              </div>
              <div className="mt-3 rounded-[6px] bg-bg px-3 py-2 text-[13.5px] text-sub">
                <strong className="text-text">Plazo de gracia:</strong> hasta las primeras dos horas hábiles del{" "}
                <strong className="text-text">{formatLongDate(resultado.graciaHasta)}</strong> (según el código procesal
                aplicable).
              </div>
            </div>

            {resultado.omitidos.length > 0 && (
              <div className="overflow-hidden rounded-[7px] border border-border bg-card">
                <div className="border-b border-border px-3 py-[9px] text-[13px] font-bold tracking-[.4px] text-sub uppercase">
                  Días no computados ({resultado.omitidos.length})
                </div>
                <div className="grid gap-x-4 sm:grid-cols-2">
                  {resultado.omitidos.map((o) => (
                    <div key={o.fecha} className="flex items-baseline gap-2 border-b border-border px-3 py-[6px] text-[13.5px]">
                      <span className="w-[92px] shrink-0 font-medium text-text">{formatLongDate(o.fecha).split(" ").slice(0, 3).join(" ")}</span>
                      <span className="truncate text-muted">
                        {o.motivo === "Inhábil" ? (descripciones.get(o.fecha) ?? "Día inhábil") : o.motivo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cargar en una causa */}
            <form id="cargar-vencimiento" onSubmit={onSubmit} className="rounded-[7px] border border-border bg-card">
              <div className="border-b border-border px-3 py-[9px] text-[13px] font-bold tracking-[.4px] text-sub uppercase">
                Cargar en una causa
              </div>
              <div className="grid gap-3 p-3 sm:grid-cols-2">
                <input type="hidden" name="fecha" value={resultado.vencimiento} />
                {state.error && (
                  <div className="sm:col-span-2">
                    <FormAlert state={state} />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <SelectField
                    label="Causa"
                    name="causa_id"
                    placeholder={causas.length ? "Elegí una causa…" : "No tenés causas abiertas"}
                    options={causas.map((c) => ({ value: c.id, label: c.caratula }))}
                  />
                </div>
                <SelectField label="Tipo" name="tipo" options={TIPOS_AVISO} defaultValue="Vencimiento" />
                <TextField label="Motivo" name="motivo" placeholder="Contestación de demanda" />
                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={pending || causas.length === 0}
                    className="cursor-pointer rounded-[6px] bg-blue px-4 py-[7px] text-[14px] font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {pending ? "Guardando…" : `Cargar vencimiento del ${formatDate(resultado.vencimiento)}`}
                  </button>
                  <p className="mt-2 text-[12.5px] text-muted">
                    Reemplaza la próxima alerta o vencimiento que tenga esa causa.
                  </p>
                </div>
              </div>
            </form>

            <p className="text-[12.5px] text-muted">
              {anioSinFeriados && (
                <span className="mb-1 block font-semibold text-amb">
                  Atención: no hay feriados nacionales cargados para {resultado.vencimiento.slice(0, 4)}; el cálculo
                  puede diferir.
                </span>
              )}
              Herramienta de ayuda: verificá siempre el cómputo con el calendario del tribunal (ferias judiciales,
              asuetos y días inhábiles locales) y con el código procesal aplicable.
            </p>
          </>
        )}
      </section>
    </div>
  );
}

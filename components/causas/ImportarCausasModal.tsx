"use client";

import { useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { confirmarCausas, previsualizarCausas, type VistaPreviaCausas } from "@/app/(app)/causas/importActions";
import { COLUMNAS_CAUSA, MAX_FILAS_IMPORTACION } from "@/services/csv/importarCausas";
import { escribirCsv } from "@/utils/csv";

// Plantilla con el encabezado y una fila de ejemplo que el usuario puede reemplazar.
const EJEMPLO = {
  caratula: "Pérez c/ García s/ Daños y perjuicios",
  nro_expediente: "EXP-1234/2026",
  fuero: "Civil y Comercial",
  tipo_juicio: "Daños y perjuicios",
  juzgado_camara: "Juzgado Civil 3",
  fecha_inicio: "15/03/2026",
  monto_reclamado: "150000,50",
  link_drive: "https://drive.google.com/drive/folders/ejemplo",
  parte_actora: "Pérez, Carlos",
  parte_demandada: "García, Ana",
  estado: "Iniciada",
  notas: "Fila de ejemplo: borrarla antes de importar",
};

function descargarPlantilla() {
  const filas = [
    [...COLUMNAS_CAUSA],
    COLUMNAS_CAUSA.map((c) => EJEMPLO[c] ?? ""),
  ];
  const blob = new Blob([escribirCsv(filas)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla-causas.csv";
  a.click();
  URL.revokeObjectURL(url);
}

interface Props {
  open: boolean;
  onClose: () => void;
  onImported: (mensaje: string) => void;
}

export default function ImportarCausasModal({ open, onClose, onImported }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vista, setVista] = useState<VistaPreviaCausas | null>(null);
  const [seleccion, setSeleccion] = useState<Set<number>>(new Set());
  const [incluirDuplicadas, setIncluirDuplicadas] = useState(false);
  const [permitirErrores, setPermitirErrores] = useState(false);
  const [modoErrores, setModoErrores] = useState<"vacios" | "erroneo">("vacios");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Las filas válidas y no duplicadas vienen marcadas por defecto.
  const seleccionPorDefecto = (v: VistaPreviaCausas) =>
    new Set(v.filas.filter((f) => f.datos && !f.duplicada).map((f) => f.numero));

  // Filas que se pueden cargar: válidas, o con errores si el usuario eligió esa opción.
  const cargable = (f: VistaPreviaCausas["filas"][number]) =>
    (!!f.datos || (permitirErrores && f.reparable)) && (incluirDuplicadas || !f.duplicada);

  const cerrar = () => {
    setArchivo(null);
    setVista(null);
    setSeleccion(new Set());
    setIncluirDuplicadas(false);
    setPermitirErrores(false);
    setModoErrores("vacios");
    setError(null);
    onClose();
  };

  const analizar = async (f: File) => {
    setArchivo(f);
    setError(null);
    setCargando(true);
    const fd = new FormData();
    fd.append("archivo", f);
    const r = await previsualizarCausas(fd);
    setCargando(false);
    if (r.error) {
      setVista(null);
      setError(r.error);
      return;
    }
    setVista(r);
    setSeleccion(seleccionPorDefecto(r));
  };

  const alternar = (numero: number) => {
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      if (nuevo.has(numero)) nuevo.delete(numero);
      else nuevo.add(numero);
      return nuevo;
    });
  };

  const cargar = async () => {
    if (!archivo) return;
    setCargando(true);
    setError(null);
    const fd = new FormData();
    fd.append("archivo", archivo);
    seleccion.forEach((n) => fd.append("fila", String(n)));
    if (incluirDuplicadas) fd.append("incluirDuplicadas", "on");
    if (permitirErrores) {
      fd.append("permitirErrores", "on");
      fd.append("modoErrores", modoErrores);
    }
    const r = await confirmarCausas(fd);
    setCargando(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    onImported(r.message ?? "Causas importadas.");
    cerrar();
  };

  // Al tildar "duplicadas", se marcan las filas duplicadas que se pueden cargar; al destildarla, se desmarcan.
  const cambiarIncluirDuplicadas = (activo: boolean) => {
    setIncluirDuplicadas(activo);
    if (!vista) return;
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      for (const f of vista.filas) {
        if (!f.duplicada) continue;
        if (activo && (f.datos || (permitirErrores && f.reparable))) nuevo.add(f.numero);
        else nuevo.delete(f.numero);
      }
      return nuevo;
    });
  };

  // Al tildar la opción de errores, se marcan las filas con error reparable; al destildarla, se desmarcan.
  const cambiarPermitirErrores = (activo: boolean) => {
    setPermitirErrores(activo);
    if (!vista) return;
    setSeleccion((prev) => {
      const nuevo = new Set(prev);
      for (const f of vista.filas) {
        if (f.datos) continue;
        if (activo && f.reparable && (incluirDuplicadas || !f.duplicada)) nuevo.add(f.numero);
        else nuevo.delete(f.numero);
      }
      return nuevo;
    });
  };

  const aCargar = vista?.filas.filter((f) => cargable(f) && seleccion.has(f.numero)).length ?? 0;
  const libres = vista ? (vista.causasMax ?? 0) - (vista.causasPropias ?? 0) : 0;
  const excedeLimite = aCargar > libres;
  const conErrores = vista?.filas.filter((f) => f.errores.length > 0).length ?? 0;
  // Filas completas que se cargarían sin tocar ninguna opción.
  const listas = vista?.filas.filter((f) => f.datos && (incluirDuplicadas || !f.duplicada)).length ?? 0;
  const soloDuplicadas = !!vista && listas === 0 && vista.filas.some((f) => f.duplicada);
  const soloConErrores = !!vista && listas === 0 && !soloDuplicadas && conErrores > 0 && !permitirErrores;

  const seleccionarListas = () => {
    if (!vista) return;
    setSeleccion(new Set(vista.filas.filter(cargable).map((f) => f.numero)));
  };
  const seleccionarNinguna = () => setSeleccion(new Set());

  return (
    <Modal open={open} title="Importar causas desde CSV" onClose={cerrar} ancho="xl">
      <div className="flex flex-col gap-3 px-4 py-4 text-[13px] text-sub">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-bg/60 p-3">
          <span className="text-[12px] font-semibold text-muted">Columnas del archivo</span>
          <div className="flex flex-wrap gap-1.5">
            {COLUMNAS_CAUSA.map((c) => (
              <span
                key={c}
                className={`rounded-md border px-2 py-0.5 font-mono text-[11.5px] ${
                  c === "caratula" ? "border-blue/40 bg-blue-lt text-blue" : "border-border bg-card text-sub"
                }`}
              >
                {c}
              </span>
            ))}
          </div>
        </div>
        <p className="text-[11.5px] italic text-muted">
          Solo caratula es obligatoria. Fechas como DD/MM/AAAA. Hasta {MAX_FILAS_IMPORTACION} filas, 1 MB.
        </p>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={descargarPlantilla}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-grn/40 px-3 py-1.5 text-[12.5px] font-semibold text-grn transition-colors hover:bg-grn/10"
          >
            <FileSpreadsheet size={15} strokeWidth={1.8} />
            Descargar plantilla CSV
          </button>
        </div>

        <details className="rounded-lg border border-border bg-bg/60 px-3 py-2 text-[12.5px]">
          <summary className="cursor-pointer font-semibold text-blue">¿Cómo guardo mi planilla de Excel como CSV?</summary>
          <div className="mt-2 flex flex-col gap-2 text-sub">
            <p><strong>En Excel:</strong> Archivo → Guardar como → en <em>Tipo</em> elegí <strong>CSV UTF-8 (delimitado por comas)</strong>. Si no aparece, elegí <strong>CSV (delimitado por comas)</strong>. Aceptá los avisos de Excel.</p>
            <p><strong>En Google Sheets:</strong> Archivo → Descargar → <strong>Valores separados por comas (.csv)</strong>.</p>
            <p className="text-muted">Solo se guarda la hoja que está abierta. La primera fila tiene que ser el encabezado con los nombres de las columnas. Las fechas van como DD/MM/AAAA.</p>
          </div>
        </details>

        <div className="flex flex-col gap-1.5">
          <input
            id="archivo-csv-causas"
            type="file"
            accept=".csv,text/csv"
            disabled={cargando}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) analizar(f);
            }}
            className="sr-only"
          />
          <label
            htmlFor="archivo-csv-causas"
            className={`inline-flex w-fit items-center gap-2 rounded-[6px] border border-border bg-card px-3.5 py-[7px] text-[13.5px] font-semibold text-text transition-colors hover:bg-bg ${
              cargando ? "pointer-events-none opacity-50" : "cursor-pointer"
            }`}
          >
            <FileSpreadsheet size={15} strokeWidth={1.8} className="text-grn" />
            Elegir archivo
          </label>
          <span className="text-[12px] text-muted">
            {archivo ? archivo.name : "No se ha seleccionado ningún archivo"}
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-[13px] text-red">{error}</div>
        )}

        {vista && !vista.error && (
          <>
            {vista.columnasDesconocidas && vista.columnasDesconocidas.length > 0 && (
              <p className="text-[12px] text-muted">
                Columnas ignoradas: {vista.columnasDesconocidas.join(", ")}.
              </p>
            )}

            <div className="flex flex-wrap gap-3 text-[12px]">
              <span>Filas: <strong>{vista.filas.length}</strong></span>
              <span>Listas para cargar: <strong>{listas}</strong></span>
              <span>Duplicadas: <strong>{vista.filas.filter((f) => f.duplicada).length}</strong></span>
              <span className="text-red">Con errores: <strong>{conErrores}</strong></span>
              <span>Lugares libres en tu plan: <strong>{libres}</strong></span>
            </div>

            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={incluirDuplicadas}
                onChange={(e) => cambiarIncluirDuplicadas(e.target.checked)}
              />
              Cargar también las causas duplicadas (mismo número de expediente)
            </label>

            {conErrores > 0 && (
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-[13px] text-red">
                  <input
                    type="checkbox"
                    checked={permitirErrores}
                    onChange={(e) => cambiarPermitirErrores(e.target.checked)}
                  />
                  Cargar también las filas con errores
                </label>
                {permitirErrores && (
                  <div className="flex flex-col gap-1 pl-6 text-[12.5px]">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="modoErrores"
                        checked={modoErrores === "vacios"}
                        onChange={() => setModoErrores("vacios")}
                      />
                      Dejar vacíos los campos con error
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="modoErrores"
                        checked={modoErrores === "erroneo"}
                        onChange={() => setModoErrores("erroneo")}
                      />
                      Escribir <span className="font-mono">Campo erroneo</span> en los campos de texto con error
                    </label>
                    <span className="text-[11.5px] text-muted">
                      Fechas, montos y links con error quedan vacíos en ambos casos.
                    </span>
                  </div>
                )}
              </div>
            )}

            {excedeLimite && (
              <div className="rounded-lg border border-amb/30 bg-amb/10 px-3 py-2 text-[13px] text-amb">
                Tu plan permite {libres} causas más y elegiste {aCargar}. No se va a cargar ninguna: desmarcá filas o ampliá tu plan.
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 text-[12px]">
              <span className="text-muted">Filas marcadas para cargar: {aCargar}</span>
              <div className="flex gap-2">
                <button type="button" onClick={seleccionarListas} className="cursor-pointer rounded-md border border-border px-2 py-0.5 text-sub hover:bg-bg">
                  Marcar todas las cargables
                </button>
                <button type="button" onClick={seleccionarNinguna} className="cursor-pointer rounded-md border border-border px-2 py-0.5 text-sub hover:bg-bg">
                  Desmarcar todas
                </button>
              </div>
            </div>

            {soloDuplicadas && (
              <div className="rounded-lg border border-amb/30 bg-amb/10 px-3 py-2 text-[12.5px] text-amb">
                Todas las causas válidas ya existen en tu cuenta. Tildá "Cargar también las causas duplicadas" si querés cargarlas igual.
              </div>
            )}
            {soloConErrores && (
              <div className="rounded-lg border border-amb/30 bg-amb/10 px-3 py-2 text-[12.5px] text-amb">
                Todas las filas tienen errores. Tildá "Cargar también las filas con errores" para cargarlas con los campos marcados.
              </div>
            )}

            <div className="max-h-[320px] overflow-auto rounded-lg border border-border">
              <table className="w-full text-left text-[12px]">
                <thead className="sticky top-0 bg-card text-muted">
                  <tr>
                    <th className="px-2 py-1"></th>
                    <th className="px-2 py-1">Fila</th>
                    <th className="px-2 py-1">Carátula</th>
                    <th className="px-2 py-1">Expediente</th>
                    <th className="px-2 py-1">Estado</th>
                    <th className="px-2 py-1">Revisión</th>
                  </tr>
                </thead>
                <tbody>
                  {vista.filas.map((f) => {
                    const valida = !!f.datos;
                    const marcable = cargable(f);
                    return (
                      <tr key={f.numero} className={`border-t border-border ${valida ? "" : "bg-red/5"}`}>
                        <td className="px-2 py-1">
                          <input
                            type="checkbox"
                            disabled={!marcable}
                            checked={seleccion.has(f.numero)}
                            onChange={() => alternar(f.numero)}
                          />
                        </td>
                        <td className="px-2 py-1">{f.numero + 1}</td>
                        <td className="px-2 py-1">{(f.datos ?? f.datosVacios)?.caratula ?? "—"}</td>
                        <td className="px-2 py-1">{(f.datos ?? f.datosVacios)?.nro_expediente ?? "—"}</td>
                        <td className="px-2 py-1">{(f.datos ?? f.datosVacios)?.estado ?? "—"}</td>
                        <td className="px-2 py-1 text-[11px]">
                          {f.errores.length > 0 && <div className="text-red">{f.errores.join(" ")}</div>}
                          {f.errores.length > 0 && f.reparable && (
                            <div className="text-amb">Se puede cargar con los campos marcados.</div>
                          )}
                          {f.advertencias.map((a) => (
                            <div key={a} className="text-amb">{a}</div>
                          ))}
                          {f.duplicada && <div className="text-amb">Duplicada: ya existe ese expediente.</div>}
                          {valida && !f.duplicada && f.advertencias.length === 0 && <div className="text-grn">OK</div>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={cerrar}
            className="cursor-pointer rounded-[6px] border border-border bg-card px-3 py-[6px] text-[14px] font-medium text-sub hover:bg-bg"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={cargar}
            disabled={cargando || !vista || aCargar === 0 || excedeLimite}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[14px] font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? "Procesando…" : `Cargar ${aCargar} ${aCargar === 1 ? "causa" : "causas"}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

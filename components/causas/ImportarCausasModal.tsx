"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { confirmarCausas, previsualizarCausas, type VistaPreviaCausas } from "@/app/(app)/causas/importActions";
import { COLUMNAS_CAUSA, MAX_FILAS_IMPORTACION } from "@/services/csv/importarCausas";

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
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Las filas válidas y no duplicadas vienen marcadas por defecto.
  const seleccionPorDefecto = (v: VistaPreviaCausas) =>
    new Set(v.filas.filter((f) => f.datos && !f.duplicada).map((f) => f.numero));

  const cerrar = () => {
    setArchivo(null);
    setVista(null);
    setSeleccion(new Set());
    setIncluirDuplicadas(false);
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
    const r = await confirmarCausas(fd);
    setCargando(false);
    if (r.error) {
      setError(r.error);
      return;
    }
    onImported(r.message ?? "Causas importadas.");
    cerrar();
  };

  const filasElegibles = vista?.filas.filter((f) => f.datos && (incluirDuplicadas || !f.duplicada)) ?? [];
  const aCargar = filasElegibles.filter((f) => seleccion.has(f.numero)).length;
  const libres = vista ? (vista.causasMax ?? 0) - (vista.causasPropias ?? 0) : 0;
  const excedeLimite = aCargar > libres;
  const conErrores = vista?.filas.filter((f) => f.errores.length > 0).length ?? 0;

  return (
    <Modal open={open} title="Importar causas desde CSV" onClose={cerrar}>
      <div className="flex flex-col gap-3 px-4 py-4 text-[13px] text-sub">
        <p>
          Columnas: <span className="font-mono text-[12px]">{COLUMNAS_CAUSA.join(", ")}</span>. Solo <strong>caratula</strong> es obligatoria.
          Fechas como DD/MM/AAAA. Hasta {MAX_FILAS_IMPORTACION} filas, 1 MB.
        </p>

        <input
          type="file"
          accept=".csv,text/csv"
          disabled={cargando}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) analizar(f);
          }}
          className="text-[13px]"
        />

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
              <span>Válidas: <strong>{vista.filas.length - conErrores}</strong></span>
              <span className="text-red">Con errores: <strong>{conErrores}</strong></span>
              <span>Duplicadas: <strong>{vista.filas.filter((f) => f.duplicada).length}</strong></span>
              <span>Lugares libres en tu plan: <strong>{libres}</strong></span>
            </div>

            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                checked={incluirDuplicadas}
                onChange={(e) => setIncluirDuplicadas(e.target.checked)}
              />
              Cargar también las causas duplicadas (mismo número de expediente)
            </label>

            {excedeLimite && (
              <div className="rounded-lg border border-amb/30 bg-amb/10 px-3 py-2 text-[13px] text-amb">
                Tu plan permite {libres} causas más y elegiste {aCargar}. No se va a cargar ninguna: desmarcá filas o ampliá tu plan.
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
                    const marcable = valida && (incluirDuplicadas || !f.duplicada);
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
                        <td className="px-2 py-1">{f.datos?.caratula ?? "—"}</td>
                        <td className="px-2 py-1">{f.datos?.nro_expediente ?? "—"}</td>
                        <td className="px-2 py-1">{f.datos?.estado ?? "—"}</td>
                        <td className="px-2 py-1 text-[11px]">
                          {f.errores.length > 0 && <div className="text-red">{f.errores.join(" ")}</div>}
                          {f.duplicada && <div className="text-amb">Duplicada: ya existe ese expediente.</div>}
                          {valida && !f.duplicada && <div className="text-grn">OK</div>}
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
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[6px] text-[14px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando ? "Procesando…" : `Cargar ${aCargar} ${aCargar === 1 ? "causa" : "causas"}`}
          </button>
        </div>
      </div>
    </Modal>
  );
}

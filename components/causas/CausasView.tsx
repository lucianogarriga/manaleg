"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, FileSpreadsheet, Scale, Search, X } from "lucide-react";
import { CAUSAS_LIMIT, normalizeTipoJuicio } from "@/utils/constants";
import EmptyState from "@/components/ui/EmptyState";
import FilterChips from "./FilterChips";
import StatsRow from "./StatsRow";
import { useCausas } from "@/hooks/useCausas";
import { useEnLineaPorCausa } from "@/hooks/usePresence";
import { useCausasStore } from "@/store/causasStore";
import type { CausaConRelaciones } from "@/types";
import CausaForm from "./CausaForm";
import MaintenanceBanner from "@/components/ui/MaintenanceBanner";
import CausasTabla from "./CausasTabla";
import Paginacion, { CAUSAS_POR_PAGINA } from "./Paginacion";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import CausaCard from "./CausaCard";
import ImportarCausasModal from "./ImportarCausasModal";
import { COLUMNAS_CAUSA } from "@/services/csv/importarCausas";
import { escribirCsv } from "@/utils/csv";

type ViewMode = "list" | "grid";

interface CausasViewProps {
  causas: CausaConRelaciones[];
  totalEnBD: number;
  userId: string;
  causasMax: number;
  causasPropias: number; // conteo real en la base (no depende del tope de la lista)
}

export default function CausasView({ causas, totalEnBD, userId, causasMax, causasPropias }: CausasViewProps) {
  const { causas: visibles, total, counts } = useCausas(causas, userId);
  const enLineaPorCausa = useEnLineaPorCausa(causas.map((c) => c.id), userId);
  // Tipos de juicio únicos presentes en la lista (para el dropdown de filtros)
  const tiposJuicio = useMemo(() => {
    const seen = new Map<string, string>();
    for (const c of causas) {
      if (c.tipo_juicio) {
        const canonical = normalizeTipoJuicio(c.tipo_juicio);
        const key = canonical.toLowerCase();
        if (!seen.has(key)) seen.set(key, canonical);
      }
    }
    return [...seen.values()].sort();
  }, [causas]);
  const atLimit = causasPropias >= causasMax;
  const formOpen = useCausasStore((s) => s.formOpen);
  const editingId = useCausasStore((s) => s.editingId);
  const openCreate = useCausasStore((s) => s.openCreate);
  const router = useRouter();
  // Cada causa tiene su propia página: se abre en /causas/[id]
  const abrirCausa = (id: string) => router.push(`/causas/${id}`);
  const search = useCausasStore((s) => s.search);
  const setSearch = useCausasStore((s) => s.setSearch);
  const filtro = useCausasStore((s) => s.filter);
  const fueros = useCausasStore((s) => s.fueros);
  const tipoJuicioActivo = useCausasStore((s) => s.tipoJuicio);

  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [pagina, setPagina] = useState(1);
  // En mobile solo se muestran cards: la tabla no entra en pantalla
  const esMobile = useMediaQuery("(max-width: 767px)");
  const vistaEfectiva: ViewMode = esMobile ? "grid" : viewMode;
  const [importOpen, setImportOpen] = useState(false);
  const [avisoImport, setAvisoImport] = useState<string | null>(null);

  // El aviso de importación se cierra solo a los 5 segundos.
  useEffect(() => {
    if (!avisoImport) return;
    const t = setTimeout(() => setAvisoImport(null), 5000);
    return () => clearTimeout(t);
  }, [avisoImport]);

  // Exporta las causas propias cargadas en pantalla (hasta CAUSAS_LIMIT)
  const exportarCsv = () => {
    const filas = [
      [...COLUMNAS_CAUSA],
      ...causas
        .filter((c) => c.user_id === userId)
        .map((c) => [
          c.caratula,
          c.nro_expediente ?? "",
          c.fuero ?? "",
          c.tipo_juicio ?? "",
          c.juzgado_camara ?? "",
          c.fecha_inicio ?? "",
          c.monto_reclamado != null ? String(c.monto_reclamado) : "",
          c.link_drive ?? "",
          c.parte_actora ?? "",
          c.parte_demandada ?? "",
          c.estado,
          c.notas ?? "",
        ]),
    ];
    const blob = new Blob([escribirCsv(filas)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `causas-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("causas-view") as ViewMode | null;
      if (saved === "list" || saved === "grid") setViewMode(saved);
      // Sin preferencia guardada, en pantallas chicas la tabla no entra completa: se muestran cards
      else if (window.matchMedia("(max-width: 1023px)").matches) setViewMode("grid");
    } catch {}
  }, []);

  // Cualquier cambio de filtro o búsqueda vuelve a la primera página
  useEffect(() => {
    setPagina(1);
  }, [filtro, search, fueros, tipoJuicioActivo]);

  const totalPaginas = Math.max(1, Math.ceil(visibles.length / CAUSAS_POR_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const enPagina = visibles.slice((paginaActual - 1) * CAUSAS_POR_PAGINA, paginaActual * CAUSAS_POR_PAGINA);
  const cambiarPagina = (p: number) => {
    setPagina(p);
    document.querySelector("main")?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleView = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem("causas-view", mode); } catch {}
  };

  const editing = editingId ? (causas.find((c) => c.id === editingId) ?? null) : null;

  return (
    <>
      {total === 0 ? (
        <EmptyState
          icon={Scale}
          title="Todavía no cargaste causas"
          description="Creá tu primera causa para empezar a seguir vencimientos, movimientos y honorarios, o subí tus expedientes desde un archivo CSV."
        >
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-[6px] border border-grn/50 bg-grn/10 px-4 py-[7px] text-[14px] font-semibold text-grn hover:bg-grn/20"
          >
            <FileSpreadsheet size={15} strokeWidth={1.8} />
            Importar CSV
          </button>
          <button
            type="button"
            onClick={atLimit ? undefined : openCreate}
            disabled={atLimit}
            className="cursor-pointer rounded-[6px] bg-blue px-4 py-[7px] text-[14px] font-semibold text-on-primary hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Nueva causa
          </button>
          <button
            type="button"
            onClick={() => setImportOpen(true)}
            className="mt-2 cursor-pointer text-[13px] font-semibold text-blue hover:underline"
          >
            o importar desde un CSV
          </button>
        </EmptyState>
      ) : (
        <div className="flex flex-col">
          <MaintenanceBanner compact />
          {atLimit && (
            <div className="mx-3 mt-2 flex items-center gap-2 rounded-lg border border-red/30 bg-red/10 px-3 py-2 text-[12.5px] text-red">
              <AlertTriangle size={13} className="shrink-0" />
              <span>
                Alcanzaste el límite de <strong>{causasMax}</strong> causas de tu plan. No podés cargar más hasta ampliarlo.
              </span>
            </div>
          )}
          <StatsRow causas={causas} />

          {totalEnBD > CAUSAS_LIMIT && (
            <div className="mx-3 mb-1 mt-2 flex items-center gap-2 rounded-lg border border-amb/30 bg-amb/10 px-3 py-2 text-[12px] text-amb">
              <AlertTriangle size={13} className="shrink-0" />
              <span>
                Tenés <strong>{totalEnBD}</strong> causas pero solo se muestran las primeras <strong>{CAUSAS_LIMIT}</strong>.
                Los filtros y conteos pueden ser incompletos. Contactá al equipo para habilitar más.
              </span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 px-3 pt-2">
            {/* Buscador por carátula o expediente: a la izquierda, en la misma fila que las acciones */}
            <label
              className="flex w-full items-center gap-[6px] rounded-[7px] border px-[10px] py-[6px] text-[13px] sm:w-[340px]"
              style={{ borderColor: "var(--color-border)", background: "var(--color-card)" }}
            >
              <Search size={13} className="shrink-0 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por carátula o expediente…"
                className="w-full min-w-0 bg-transparent text-[13px] text-text outline-none placeholder:text-muted"
              />
            </label>
            <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-grn/50 bg-grn/10 px-3 py-1.5 text-[12.5px] font-semibold text-grn transition-colors hover:bg-grn/20"
            >
              <FileSpreadsheet size={15} strokeWidth={1.8} />
              Importar CSV
            </button>
            <button
              type="button"
              onClick={exportarCsv}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-grn/40 px-3 py-1.5 text-[12.5px] font-semibold text-grn transition-colors hover:bg-grn/10"
            >
              <FileSpreadsheet size={15} strokeWidth={1.8} />
              Exportar CSV
            </button>
            </div>
          </div>
          {avisoImport && (
            <div className="mx-3 mt-2 flex items-start gap-2 rounded-lg border border-grn/30 bg-grn/10 px-3 py-2 text-[12px] text-grn">
              <span className="flex-1">{avisoImport}</span>
              <button
                type="button"
                onClick={() => setAvisoImport(null)}
                aria-label="Cerrar aviso"
                className="shrink-0 cursor-pointer rounded p-0.5 text-grn hover:bg-grn/20"
              >
                <X size={14} />
              </button>
            </div>
          )}

          <FilterChips
            total={total}
            counts={counts}
            tiposJuicio={tiposJuicio}
            causasPropias={causasPropias}
            causasMax={causasMax}
            viewMode={vistaEfectiva}
            onViewChange={esMobile ? undefined : toggleView}
          />

          {/* Lista o grid */}
          {vistaEfectiva === "list" ? (
            <div className="px-3 py-1 pb-16 sm:px-4">
              <CausasTabla causas={enPagina} enLineaPorCausa={enLineaPorCausa} onSelect={abrirCausa} />
              {visibles.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px] text-muted">
                  {search ? `No hay causas que coincidan con "${search}".` : "No hay causas en este filtro."}
                </p>
              )}
            </div>
          ) : (
            <div className="px-4 py-3 pb-16 sm:px-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" data-reveal-group>
                {enPagina.map((causa) => (
                  <CausaCard
                    key={causa.id}
                    causa={causa}
                    onSelect={() => abrirCausa(causa.id)}
                  />
                ))}
              </div>
              {visibles.length === 0 && (
                <p className="px-4 py-8 text-center text-[13px] text-muted">
                  {search ? `No hay causas que coincidan con "${search}".` : "No hay causas en este filtro."}
                </p>
              )}
            </div>
          )}
          <Paginacion
            pagina={paginaActual}
            totalPaginas={totalPaginas}
            total={visibles.length}
            porPagina={CAUSAS_POR_PAGINA}
            onChange={cambiarPagina}
          />
        </div>
      )}

      <ImportarCausasModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={(m) => setAvisoImport(m)}
      />
      {formOpen && (
        <CausaForm key={editingId ?? "new"} causa={editing} userId={userId} />
      )}
    </>
  );
}

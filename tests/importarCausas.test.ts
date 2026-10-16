import { describe, expect, it } from "vitest";
import { analizarCsvCausas } from "@/services/csv/importarCausas";

const sinExistentes = new Set<string>();

describe("analizarCsvCausas", () => {
  it("carga una fila válida con monto, fecha dd/mm/aaaa y link https", () => {
    const csv = [
      "caratula,nro_expediente,fuero,fecha_inicio,monto_reclamado,link_drive",
      "Pérez c/ García,EXP-1/2026,Civil y Comercial,15/03/2026,\"$ 150.000,50\",https://drive.google.com/x",
    ].join("\n");
    const r = analizarCsvCausas(csv, sinExistentes);
    const fila = r.filas[0];
    expect(fila.errores).toEqual([]);
    expect(fila.datos).toMatchObject({
      caratula: "Pérez c/ García",
      fuero: "Civil y Comercial",
      fecha_inicio: "2026-03-15",
      monto_reclamado: 150000.5,
      link_drive: "https://drive.google.com/x",
    });
  });

  it("carga un fuero desconocido como Otro, con aviso", () => {
    const csv = "caratula,fuero\nCaso,Tributario";
    const fila = analizarCsvCausas(csv, sinExistentes).filas[0];
    expect(fila.datos?.fuero).toBe("Otro");
    expect(fila.advertencias[0]).toContain("Otro");
  });

  it("acepta Federal y Comercial como fueros propios", () => {
    const csv = "caratula,fuero\nA,Federal\nB,Comercial";
    const r = analizarCsvCausas(csv, sinExistentes).filas;
    expect(r[0].datos?.fuero).toBe("Federal");
    expect(r[1].datos?.fuero).toBe("Comercial");
  });

  it("marca como error una fecha inexistente y deja el campo vacío en la versión reparable", () => {
    const csv = "caratula,fecha_inicio\nCaso,31/02/2026";
    const fila = analizarCsvCausas(csv, sinExistentes).filas[0];
    expect(fila.datos).toBeNull();
    expect(fila.reparable).toBe(true);
    expect(fila.datosVacios?.fecha_inicio).toBeNull();
  });

  it("usa 'Campo erroneo' solo en campos de texto con error", () => {
    const largo = "x".repeat(81);
    const csv = `caratula,tipo_juicio\nCaso,${largo}`;
    const fila = analizarCsvCausas(csv, sinExistentes).filas[0];
    expect(fila.reparable).toBe(true);
    expect(fila.datosVacios?.tipo_juicio).toBeNull();
    expect(fila.datosErroneo?.tipo_juicio).toBe("Campo erroneo");
  });

  it("rechaza links que no son https", () => {
    const csv = "caratula,link_drive\nCaso,http://ejemplo.com";
    const fila = analizarCsvCausas(csv, sinExistentes).filas[0];
    expect(fila.datos).toBeNull();
    expect(fila.errores[0]).toContain("https");
  });

  it("no permite filas sin carátula", () => {
    const csv = "caratula,nro_expediente\n,EXP-9";
    const fila = analizarCsvCausas(csv, sinExistentes).filas[0];
    expect(fila.datos).toBeNull();
    expect(fila.reparable).toBe(false);
  });

  it("marca duplicadas contra las causas existentes y dentro del mismo archivo", () => {
    const csv = "caratula,nro_expediente\nA,EXP-1\nB,EXP-1\nC,EXP-2";
    const r = analizarCsvCausas(csv, new Set(["EXP-2"])).filas;
    expect(r[0].duplicada).toBe(false);
    expect(r[1].duplicada).toBe(true);
    expect(r[2].duplicada).toBe(true);
  });

  it("rechaza archivos con más de 500 filas", () => {
    const filas = Array.from({ length: 501 }, (_, i) => `Caso ${i}`).join("\n");
    const r = analizarCsvCausas(`caratula\n${filas}`, sinExistentes);
    expect(r.errorGlobal).toContain("500");
  });
});

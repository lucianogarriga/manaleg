import { describe, expect, it } from "vitest";
import { parseMonto } from "@/utils/formData";

// Formatos habituales en Excel argentino, Excel en inglés y formularios.
describe("parseMonto", () => {
  it.each([
    ["150000", 150000],
    ["150.000", 150000],
    ["150.000,50", 150000.5],
    ["$ 150.000", 150000],
    ["$1,500,000.00", 1500000],
    ["1,500,000.50", 1500000.5],
    ["2.150.000", 2150000],
    ["150000,50", 150000.5],
    ["5000.50", 5000.5],
    ["1.5", 1.5],
  ])("acepta %s como %s", (entrada, esperado) => {
    expect(parseMonto(entrada)).toBe(esperado);
  });

  it("devuelve null para vacío", () => {
    expect(parseMonto(null)).toBeNull();
    expect(parseMonto("   ")).toBeNull();
  });

  it.each(["abc", "1.2.3,4,5", "-100", "10000000000000"])("rechaza %s", (entrada) => {
    expect(parseMonto(entrada)).toBe("invalid");
  });
});

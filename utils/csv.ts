// Lectura y escritura de CSV sin dependencias.

// Separador: el que aparezca más veces en la primera línea (coma o punto y coma, según Excel en español).
export function detectarSeparador(primeraLinea: string): "," | ";" {
  const comas = (primeraLinea.match(/,/g) ?? []).length;
  const puntoYComa = (primeraLinea.match(/;/g) ?? []).length;
  return puntoYComa > comas ? ";" : ",";
}

// Convierte el texto en filas de celdas. Respeta comillas y saltos de línea dentro de comillas.
export function parsearCsv(texto: string): string[][] {
  const limpio = texto.replace(/^﻿/, "");
  const sep = detectarSeparador(limpio.split(/\r?\n/)[0] ?? "");

  const filas: string[][] = [];
  let fila: string[] = [];
  let campo = "";
  let entreComillas = false;

  for (let i = 0; i < limpio.length; i++) {
    const c = limpio[i];
    if (entreComillas) {
      if (c === '"') {
        if (limpio[i + 1] === '"') {
          campo += '"';
          i++;
        } else {
          entreComillas = false;
        }
      } else {
        campo += c;
      }
    } else if (c === '"') {
      entreComillas = true;
    } else if (c === sep) {
      fila.push(campo);
      campo = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && limpio[i + 1] === "\n") i++;
      fila.push(campo);
      filas.push(fila);
      fila = [];
      campo = "";
    } else {
      campo += c;
    }
  }
  if (campo !== "" || fila.length > 0) {
    fila.push(campo);
    filas.push(fila);
  }

  return filas.filter((f) => f.some((celda) => celda.trim() !== ""));
}

// Evita la inyección de fórmulas: una celda que empieza con = + - @ se guarda como texto.
export function neutralizarFormula(valor: string): string {
  return /^[=+\-@\t\r]/.test(valor) ? `'${valor}` : valor;
}

// Genera el CSV para descargar. BOM UTF-8 para que Excel muestre bien las tildes.
export function escribirCsv(filas: string[][], sep: "," | ";" = ";"): string {
  const celda = (valor: string) => {
    const seguro = neutralizarFormula(valor);
    const necesitaComillas = seguro.includes(sep) || seguro.includes('"') || /[\r\n]/.test(seguro);
    return necesitaComillas ? `"${seguro.replace(/"/g, '""')}"` : seguro;
  };
  return "﻿" + filas.map((fila) => fila.map(celda).join(sep)).join("\r\n");
}

const URL_VALOR_JUS = "https://www.abogado.org.ar/valores-y-tasas/";

// Lee el valor del JUS publicado por el Colegio de Abogados de Córdoba.
export async function leerValorJusCordoba(): Promise<{ valor: number } | { error: string }> {
  let html: string;
  try {
    const res = await fetch(URL_VALOR_JUS, {
      cache: "no-store",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "es-AR,es;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.status === 403 || res.status === 429) {
      return { error: "El Colegio bloqueó la consulta automática. Cargá el valor a mano desde la página del Colegio." };
    }
    if (!res.ok) return { error: `El Colegio de Abogados no respondió (HTTP ${res.status}).` };
    html = await res.text();
  } catch {
    return { error: "No se pudo conectar con el Colegio de Abogados. Probá de nuevo en un rato." };
  }

  const texto = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ");

  const m = texto.match(/valor\s*jus[^$\d]{0,80}\$?\s*(\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?|\d+(?:,\d{1,2})?)/i);
  if (!m) return { error: "No encontramos el valor del JUS en la página del Colegio." };

  const valor = Number(m[1].replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(valor) || valor <= 0) return { error: "El valor del JUS publicado no es válido." };
  return { valor };
}

// Devuelve la URL solo si es https; cualquier otro esquema (javascript:, data:…) se descarta.
export function safeHref(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return /^https:\/\//i.test(url.trim()) ? url.trim() : undefined;
}

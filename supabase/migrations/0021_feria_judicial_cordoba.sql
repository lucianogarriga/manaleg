-- ═══════════════════════════════════════════════════════════════
-- Feria judicial de Córdoba (todo enero) + inhábiles judiciales
-- destacados del Tribunal Superior de Justicia de Córdoba.
--
-- Fuente: https://www.justiciacordoba.gob.ar/justiciacordoba/servicios/DiasInhabilesNet.aspx
-- Última revisión: octubre 2026.
-- Nota: los días de fin de semana se incluyen en la feria pero el
-- calendario los filtra al momento de mostrarlos (isWeekend).
-- ═══════════════════════════════════════════════════════════════

-- ── Feria judicial de enero 2026 (2 al 31) ───────────────────
-- El 1/1 ya está cargado como feriado nacional.
INSERT INTO public.dias_inhabiles (user_id, fecha, descripcion, tipo) VALUES
  (NULL, '2026-01-02', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-05', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-06', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-07', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-08', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-09', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-12', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-13', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-14', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-15', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-16', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-19', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-20', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-21', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-22', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-23', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-26', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-27', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-28', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-29', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2026-01-30', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial')
ON CONFLICT (user_id, fecha) DO NOTHING;

-- ── Feria judicial de enero 2027 (4 al 29 — 1/1 es feriado) ─
-- (1/1/2027 ya está como feriado nacional)
INSERT INTO public.dias_inhabiles (user_id, fecha, descripcion, tipo) VALUES
  (NULL, '2027-01-04', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-05', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-06', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-07', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-08', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-11', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-12', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-13', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-14', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-15', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-18', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-19', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-20', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-21', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-22', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-25', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-26', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-27', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-28', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial'),
  (NULL, '2027-01-29', 'Feria judicial de verano — Justicia Córdoba', 'Feria judicial')
ON CONFLICT (user_id, fecha) DO NOTHING;

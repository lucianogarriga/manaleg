-- ═══════════════════════════════════════════════════════════════
-- Días inhábiles adicionales 2026–2027
--
-- Fuente: https://www.justiciacordoba.gob.ar/justiciacordoba/servicios/DiasInhabilesNet.aspx
-- y normativa nacional de feriados y días no laborables.
-- Última revisión: octubre 2026.
--
-- No se incluyen fechas ya cargadas en 0006 (feriados nacionales)
-- ni en 0021 (feria judicial de enero).
-- ═══════════════════════════════════════════════════════════════

INSERT INTO public.dias_inhabiles (user_id, fecha, descripcion, tipo) VALUES
  -- 2026
  (NULL, '2026-09-30', 'Día de San Jerónimo — inhábil Córdoba capital',        'Día inhábil'),
  (NULL, '2026-11-09', 'Visita del Papa Francisco — inhábil',                  'Día inhábil'),
  (NULL, '2026-11-10', 'Visita del Papa Francisco — inhábil',                  'Día inhábil'),
  (NULL, '2026-11-16', 'Día del Empleado Judicial — Justicia Córdoba',         'Día inhábil'),
  (NULL, '2026-12-07', 'Día no laborable con fines turísticos',                'Día inhábil'),
  (NULL, '2026-12-24', 'Víspera de Navidad',                                   'Día inhábil'),
  (NULL, '2026-12-31', 'Víspera de año nuevo',                                 'Día inhábil'),
  -- 2027
  (NULL, '2027-03-25', 'Jueves Santo',                                         'Día inhábil')
ON CONFLICT (user_id, fecha) DO NOTHING;

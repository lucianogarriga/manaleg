# Adjuntos e importación CSV: decisiones de diseño

Estado: decisiones acordadas con Luciano. Los valores de planes son orientativos y se revisan antes de lanzar.

## Planes y límites (tabla en la base, no en el código)

Tabla `planes` con una fila por plan. Los límites viven ahí para poder cambiarlos sin publicar código, y para que la pasarela de pagos solo actualice el plan del usuario.

| Plan | Adjuntos por archivo | Adjuntos por causa | Total por usuario |
|---|---|---|---|
| FREE | 5 MB | 10 MB | 10 MB |
| Individual | 5 MB | 50 MB | 200 MB |
| PRO | 5 MB | 100 MB | 1 GB |
| FULL | 5 MB | 100 MB | 3 GB |

Valores de referencia para revisar en la escala comercial. Por causa en FREE se tomó 10 MB (igual al total): es un supuesto a confirmar.

## Adjuntos

- **Tamaño máximo por archivo:** 5 MB (como el SAC de Córdoba).
- **Cuota por causa:** 50 MB.
- **Cuota total:** la cuenta el **titular de la causa**, no quien sube el archivo. En causas compartidas, los archivos cuentan contra el titular.
- **Almacenamiento:** Supabase Storage con bucket privado, acceso por RLS, URLs firmadas de vida corta.
- **Validación:** tipo real del archivo (no solo extensión), nombre renombrado a UUID, descarga como `attachment`.
- **Pendiente de diseño (sección 7.1 de AUDITORIA.md):** escaneo de malware antes de habilitar la descarga.

## Importación CSV de causas

- **Columna obligatoria:** carátula.
- **Columnas opcionales:** número de expediente, tipo de juicio, fuero, juzgado/cámara, parte actora, parte demandada, fecha de inicio, estado, notas.
- **Vista previa obligatoria:** antes de guardar se muestra cada fila con sus errores marcados.
- **Límite del plan:** si el archivo supera el límite de causas del plan, se rechaza completo, sin cargar nada, y se muestra un aviso explicando la situación.
- **Duplicados:** se marcan en la vista previa. Por defecto no se cargan; el usuario puede optar por cargarlos igual.
- **Exportación:** las celdas que empiezan con `=`, `+`, `-` o `@` se neutralizan (prefijo `'`) para evitar inyección de fórmulas en Excel.
- **Carga:** transaccional, con el usuario autenticado (nunca `service_role` desde el archivo).

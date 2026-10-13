# Auditoría técnica — MANALEG (CRM Legal)

**Alcance:** revisión estática del repositorio (commit `78ae632`): Next.js 16 + Supabase (Postgres/RLS/Auth/Realtime) + Resend + Vercel Cron. 198 archivos, 29 migraciones y un `schema.sql` (dump de producción).
**Método:** lectura de código, migraciones y del dump. No se ejecutó la app ni se atacó una instancia viva (no hay `node_modules` ni acceso a la base). Los hallazgos marcados **[verificar en prod]** dependen de la configuración real del dashboard de Supabase/Vercel.
**Fecha:** 12/10/2026

> **Aclaración de alcance importante:** en este repo **no existe** carga de adjuntos (pdf/jpg/docx/csv), asistentes de IA, comparador de documentos, búsqueda full-text ni sync con Google Calendar. La página `/planes` los lista como "próximamente". La sección 7 es, por lo tanto, un **diseño de seguridad previo** para cuando se construyan; es el momento más barato para corregir la arquitectura.

---

## 0. Resumen ejecutivo

La base es **mejor que el promedio** para un proyecto en beta: RLS activado en todo, funciones `SECURITY DEFINER` con `search_path` fijo, `getUser()` en el middleware, validación de inputs en server actions, CSP y cabeceras, auditoría financiera, cron protegido por secreto, escape HTML en emails. Se nota trabajo previo con el Security Advisor.

Pero hay **un hallazgo crítico (escalada de privilegios sobre el modelo de negocio)**, varios altos y una **deriva entre migraciones y producción** que hoy impide reproducir la base desde cero. Para un producto que custodia información amparada por **secreto profesional**, y que planea sumar IA y adjuntos, recomiendo cerrar los puntos P0/P1 antes de abrir el registro público o de agregar nuevas superficies.

| Sev. | Cant. | Tema dominante |
|---|---|---|
| 🔴 Crítico | 1 | Cualquier usuario se auto-asigna plan/límites |
| 🟠 Alto | 6 | XSS almacenado vía `javascript:`, deriva de esquema, DELETE roto, cron no escalable, monto ×100, realtime público |
| 🟡 Medio | 12 | Enumeración, rate-limit, CSP, consentimiento, límites, gobierno de datos |
| 🔵 Bajo/Mejora | 10+ | Calidad, tests, CI, observabilidad |

---

## 1. Hallazgos de seguridad

### 🔴 S-1 · Escalada de privilegios: el usuario puede modificar su propio `plan`, `causas_max`, `estado_pago`, `tyc_*`
- `supabase/schema.sql:8326` — `profiles_update_own … USING (auth.uid() = id) WITH CHECK (auth.uid() = id)` **sin restricción de columnas**.
- `supabase/schema.sql:9796` — `GRANT ALL ON TABLE public.profiles TO authenticated`.
- La clave `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` es pública por diseño. Cualquier usuario logueado puede ejecutar desde la consola del navegador:
  `supabase.from('profiles').update({ causas_max: 9999, plan: 'full', estado_pago: 'activo' }).eq('id', miId)`
- **Impacto:** evasión total del modelo de monetización (el trigger `check_causas_limit` lee justamente `profiles.causas_max`), falsificación de la prueba de aceptación de T&C (`tyc_accepted_at`, `tyc_version`) y cambio de `email` del perfil (ver S-5).
- **Fix:** (a) `REVOKE UPDATE ON public.profiles FROM authenticated; GRANT UPDATE (nombre_completo, empresa, notificaciones_email) ON public.profiles TO authenticated;` (b) `plan`, `estado_pago`, `causas_max` solo por `service_role` (webhook de pago). (c) T&C → tabla append-only `consentimientos(user_id, doc, version, accepted_at, ip, user_agent)` escrita por server action con service role. (d) Test automatizado que intente el update como usuario normal.

### 🟠 S-2 · XSS almacenado por URLs `javascript:` (link_drive / comprobante_*)
- La validación `^https?://` existe **solo** en server actions (`causas/actions.ts`, `gastoActions.ts`, `detailActions.ts`). Las tablas no tienen `CHECK`, y el cliente PostgREST permite insertar/actualizar directamente (un colaborador puede `UPDATE causas SET link_drive='javascript:…'` por RLS `causas_update`).
- Se renderizan como `<a href>` en `DriveLink.tsx`, `GastosCard.tsx:167`, `HonorariosCard.tsx:103`.
- La CSP tiene `script-src 'unsafe-inline'` (`next.config.ts:16`), por lo que **no frena** URLs `javascript:`. Las cookies de sesión de `@supabase/ssr` no son HttpOnly → robo de sesión de un colega con acceso compartido. Es el escenario de ataque más realista del producto (colaboración entre estudios).
- **Fix:** `CHECK (link_drive IS NULL OR link_drive ~* '^https://')` en todas las columnas de URL; helper `safeHref()` en el render; CSP con nonces (ver S-9).

### 🟠 S-3 · Realtime Presence en canales públicos
- `hooks/usePresence.ts:32` usa `causa-presence:${causaId}` sin `private: true`. Con la clave pública cualquiera (incluso sin cuenta) puede unirse a un canal si conoce/adivina el UUID y ver nombres de quienes están dentro; también puede inyectar presencias falsas.
- **Fix:** `channel(..., { config: { private: true } })` + política RLS sobre `realtime.messages` basada en `private.user_can_access_causa()`. No enviar el nombre completo en el payload; resolverlo por id.

### 🟠 S-4 · Cron de avisos: envío a emails arbitrarios (derivado de S-1)
- `avisosDiarios.ts` envía a `profiles.email`, columna **editable por el usuario** (S-1). Un usuario puede apuntar su email de perfil a un tercero y recibir/derivar correos con carátulas. También puede "reservar" el email de alguien aún no registrado (`UNIQUE`) y romper su alta (el trigger `handle_new_user` fallaría).
- **Fix:** enviar a `auth.users.email` (admin API) y quitar `email` de las columnas editables.

### 🟡 S-5 · Enumeración de usuarios y spam por "compartir causa"
- `shareActions.ts` → `buscar_perfil_por_email` permite a cualquier autenticado verificar si un email está registrado (y obtener su nombre). Sin rate-limit.
- `notify_on_share` crea una notificación en la campana del destinatario con el **nombre elegido por el remitente** → vector de phishing/acoso entre usuarios.
- **Fix:** invitaciones por email (token + aceptación), respuesta uniforme ("si existe, se le envió una invitación"), límite de invitaciones/día, bloqueo de usuario.

### 🟡 S-6 · Sin rate-limiting / anti-automatización propia
- `login`, `register`, `shareCausa`, `enviarFeedback` (envía email por llamada → abuso de cuota Resend y spam al buzón de contacto) no tienen límites propios; dependen de los límites por defecto de Supabase.
- **Fix:** Upstash/Vercel KV rate limit por IP+usuario, CAPTCHA (Turnstile) en registro/login, límite diario en feedback.

### 🟡 S-7 · Autenticación
- **MFA/TOTP ausente.** Para un software que contiene secreto profesional, es un estándar esperable (al menos opcional, obligatorio en plan Full).
- Contraseña mínima de 8 en el cliente pero `traducirError` habla de 6 (`(auth)/actions.ts:14`): inconsistencia; verificar en Supabase la política real y activar *leaked password protection* (el propio `0023` lo menciona como pendiente **[verificar en prod]**).
- `register` usa `headers().get("origin") ?? "http://localhost:3000"` (`(auth)/actions.ts:51`) para `emailRedirectTo`: en prod usar `APP_URL` fija y la *allow-list* de Redirect URLs de Supabase; el fallback a localhost es un bug latente.
- Sin gestión de sesiones activas, sin "cerrar sesión en todos los dispositivos", sin timeout por inactividad.
- La confirmación de email responde distinto si el usuario existe ("Ya existe una cuenta") → enumeración en registro.

### 🟡 S-8 · Cron endpoint
- `route.ts:14` compara el secreto con `!==` (no constante en tiempo; riesgo bajo pero trivial de corregir con `timingSafeEqual`).
- `?dry=1` está disponible para quien tenga el secreto; OK. Considerar además verificar `x-vercel-cron`/IP y registrar cada ejecución.
- `/api/health` es público y no verifica nada real (siempre `ok`): útil como liveness, inútil como readiness (no prueba la DB).

### 🟡 S-9 · CSP y cabeceras
- `script-src 'unsafe-inline'` anula buena parte de la protección anti-XSS. Next.js soporta CSP con **nonce** vía middleware/proxy: adoptarlo.
- Faltan: `object-src 'none'`, `frame-src`, `worker-src`, `upgrade-insecure-requests`, `report-to` (para telemetría de violaciones), `Cross-Origin-Opener-Policy`, `Cross-Origin-Resource-Policy`. HSTS sin `preload`.
- Cuando existan adjuntos/IA/Google: habrá que ampliar `connect-src`/`img-src`/`frame-src` de forma mínima (ver sección 7).

### 🟡 S-10 · RLS: modelo de permisos grueso para colaboradores
- Un colaborador (`causa_shares`) puede **editar cualquier campo de la causa** (`causas_update`), crear honorarios/pagos/gastos, y ver todo lo financiero. No hay roles (lector / editor / admin) ni noción de **estudio/organización** (tenant). Hoy el único "tenant" es el usuario.
- `eventos_update` permite a cualquier colaborador; `eventos_delete` solo al creador (asimetría).
- `causas.cliente_id` y `todos.causa_id` no validan pertenencia (un usuario puede referenciar el UUID de un cliente ajeno; impacto bajo por la inadivinabilidad del UUID, pero es defensa en profundidad).
- **Fix estratégico:** introducir `organizaciones` + `membresias(rol)`; `causa_shares.rol ('lector'|'editor')`; RLS por rol; separar "datos del cliente" (que un colaborador externo no necesariamente debe ver) y mover honorarios a rol restringido.

### 🟡 S-11 · Auditoría incompleta
- `auditoria_financiera` cubre honorarios/gastos/pagos pero **no** causas, clientes, movimientos, shares ni accesos de lectura. Para un CRM legal conviene un log de auditoría general (quién vio/exportó/compartió qué y cuándo), inmutable y exportable.
- `usuario_id NOT NULL` + `auth.uid()` falla con `service_role` (futuras migraciones/ETL romperían el trigger).
- `auditoria_financiera` y `avisos_enviados` tienen `GRANT ALL … TO anon` (`schema.sql:9696,9705`). RLS sin policy lo bloquea hoy, pero es una sola política mal puesta de distancia. `REVOKE ALL … FROM anon` en todas las tablas.

### 🟡 S-12 · Datos sensibles sin cifrado a nivel de aplicación
- Todo está protegido por TLS + cifrado en reposo del proveedor, pero un acceso de soporte/DBA o un dump filtrado expone todo en claro (carátulas, DNI/CUIT, notas, movimientos). Para el segmento "estudios jurídicos" y expansión extra-zona, evaluar **cifrado de campos** (pgsodium / Supabase Vault / KMS) para `clientes.dni_cuit`, `notas`, `movimientos.descripcion`, y, a futuro, adjuntos con claves por organización (BYOK en plan Enterprise).

### 🔵 S-13 · Otros
- `formValues(formData)` (`clienteActions.ts`) devuelve **todos** los campos del formulario al cliente en errores: hoy inocuo, pero evitar devolver campos no whitelisteados.
- `escapeHtml` aplicado al `subject` del email de feedback (`ajustes/actions.ts:42`): el asunto no es HTML → se ve `&amp;`. Escapar solo en el cuerpo.
- `test-cron.ps1` y la URL de producción en el repo: no es un secreto, pero mover a `scripts/` documentado.
- `.claude/launch.json` y `schema.sql` con token `\restrict`: el dump expone la estructura completa; mantener el repo **privado** y no publicarlo.
- Historial de git revisado: **no se encontraron secretos** (`sb_secret`, JWTs, claves Resend) en commits. ✔

---

## 2. Bugs funcionales y de lógica

### 🟠 B-1 · Deriva entre migraciones y producción (el repo no es reproducible)
- `0024` y `0025` referencian `private.user_can_access_causa()` / `private.user_owns_causa()`, pero **ninguna migración crea el esquema `private` ni esas funciones**; solo existen en el dump. Una base nueva (staging, CI, desarrollador nuevo, DR) **falla al aplicar `0024`**.
- `buscar_perfil_por_email`: la migración `0011` devuelve `(id, nombre_completo, email)`; el dump devuelve `(id, nombre_completo)`. `shareActions.ts` espera `email` → el mensaje de error/éxito cae al fallback.
- `0024` está guardada con BOM y **doble codificación UTF-8** (mojibake: "anulaciÃ³n"): los mensajes de excepción se almacenaron rotos en producción.
- `0019` hace `DROP TABLE … CASCADE` (pierde datos si hubiera filas fuera de las migradas).
- `20231010000000_…` tiene un timestamp inconsistente con el esquema `00NN_`.
- **Fix:** adoptar el flujo de Supabase CLI (`supabase db diff` → migración, `supabase db reset` en CI), regenerar un baseline desde producción y probar `db reset` en cada PR. Congelar edición manual en el dashboard.

### 🟠 B-2 · `deletePago` / `deleteGasto` ya no pueden funcionar
- `0024` borró **todas** las policies de `honorarios/gastos/pagos` y no recreó `DELETE`. El código (`detailActions.ts:deletePago`, `gastoActions.ts:deleteGasto`) sigue llamando `.delete()`, y siempre devuelve 0 filas → mensaje engañoso "No se pudo eliminar".
- Además **nada del front usa `anulado`** (grep sin resultados): el modelo de anulación + auditoría está en DB pero no en UI.
- **Fix:** implementar `anularPago/anularGasto/anularHonorario(motivo)` y retirar los deletes; mostrar historial de auditoría al titular.

### 🟠 B-3 · Los pagos anulados siguen sumando en `monto_cobrado`
- `update_monto_cobrado()` (`schema.sql:1356`) suma **todos** los `pagos` sin filtrar `anulado = false`. Cuando se active la anulación, saldos y dashboards quedarán mal. Filtrar `AND NOT anulado` y recalcular también en el trigger de `UPDATE OF anulado`.

### 🟠 B-4 · `parseMonto` interpreta mal decimales con punto (error ×100)
- `utils/formData.ts:17` elimina **todos** los puntos: `"1234.56"` → `123456`. Con honorarios en **USD** (soportado), el placeholder es `5000` y un usuario que escriba `5000.50` guarda `500050`. Silencioso y monetario.
- `MONTO_MAX = 999_999_999` (≈ US$ 0,7 M a cotización 2026): los reclamos laborales/comerciales en pesos lo superan con frecuencia; la columna `monto_reclamado` admite `DECIMAL(15,2)`. Subir el tope y validar con `Intl`/parser basado en la moneda.
- `formatCurrency` siempre formatea en ARS (`$`): `HonorariosCard` muestra saldos de honorarios en USD con símbolo `$`.

### 🟡 B-5 · Cron de avisos — correctitud
- Envía el email y **después** registra en `avisos_enviados`; si el insert falla (o la función expira a los 60 s) el usuario recibe el mismo aviso al día siguiente. Reservar primero (insert con `ON CONFLICT DO NOTHING … RETURNING`) y enviar después, o usar una cola.
- Solo avisa vencimientos de **`causas.proximo_vencimiento`** (el próximo único, mantenido por trigger), ignorando que desde `0019` hay múltiples vencimientos/audiencias por causa. Una causa con 3 vencimientos próximos avisa solo el primero; los demás no se notifican nunca hasta que el primero pase. **Es el bug de negocio más delicado del producto**: un vencimiento procesal no notificado es responsabilidad profesional del abogado.
- Tampoco considera `anticipacion` (1 día/3 días/1 semana) ni `eventos` (audiencias de la tabla `eventos`).
- Si el trigger de sync de vencimiento deja `NULL` cuando todos están `completado`, bien; pero `completado` en el vencimiento más próximo "oculta" el siguiente solo si el trigger corre — hay que test-earlo.

### 🟡 B-6 · Dashboards y listados con tope silencioso de 1.000 filas
- PostgREST limita a 1.000 filas por defecto. `dashboardStats.ts` (Q4 trae **todos** los clientes; Q2/Q6 por rango) y `getClientes()` usan el largo del array como contador → números incorrectos sin error al superar 1.000.
- `CAUSAS_LIMIT = 60` cargadas en memoria y `movimientos` con `MAX_PAGES = 2` (40 movimientos máx.): el usuario **no puede ver su historial completo**. Es una limitación declarada de beta, pero no puede ir a producción paga.
- **Fix:** agregaciones en SQL (`count`, `group by`, vistas/RPC), paginación por cursor, búsqueda server-side.

### 🟡 B-7 · Planes sin enforcement
- `plan`/`estado_pago` no se leen en ningún server action. `/planes` promete "FREE: 15 días / 10 causas" pero la base impone 60 y no hay vencimiento de prueba; "compartir causas" es PRO pero `shareCausa` no valida plan. Todo el *gating* debe hacerse en servidor/DB (y alimentarse desde pasarela de pago, no desde el cliente).

### 🟡 B-8 · Calendario judicial
- Feriados y ferias hardcodeados en migraciones **solo hasta 2027**. En 2028 los plazos se calcularán sin feriados, silenciosamente. No incluye días no laborables "puente" ni acordadas del TSJ extraordinarias (la propia migración lo advierte). Es el corazón de la propuesta de valor.
- **Fix:** tabla administrable (`calendarios_judiciales(jurisdiccion, fuero, fecha, tipo, fuente_url)`), tarea de actualización anual, alerta interna cuando faltan fechas del próximo año, y *disclaimer* expreso de que el cómputo es orientativo (ver sección 6).
- `calcularPlazo` modela "corridos" y "hábiles" pero no distingue cómputo por fuero/jurisdicción (CPCC Córdoba vs. CPCCN vs. laborales; plazo de gracia de las 2 primeras horas, etc.). Hoy "graciaHasta = siguiente hábil" simplifica; documentar la regla aplicada.

### 🔵 B-9 · Menores
- `check_causas_limit` cuenta sin lock → condición de carrera con inserciones concurrentes (puede superar el límite por 1–2). Usar `pg_advisory_xact_lock(user_id)`.
- `createCausa` hace chequeo de cupo en la app **y** en trigger (duplicado; el mensaje del trigger es técnico).
- `saveCausaPartes` hace `DELETE` + `INSERT` sin transacción: si el insert falla, la causa queda **sin partes** (ya hay un mensaje "Causa guardada pero…"). Usar RPC transaccional.
- `saveCausa` en dos pasos (causa y partes) tampoco es atómico.
- `deleteCliente`: `ON DELETE SET NULL` en causas; sin confirmación de impacto ni "papelera"/soft-delete. Para un CRM legal se recomienda **soft delete + retención configurable** (borrar una causa elimina en cascada movimientos, honorarios, pagos y auditoría vinculada).
- Zustand: `profile` completo (incluye `plan`, `causas_max`, `tyc_*`) hidratado en el cliente; limitar a campos de UI.
- `markWelcomeSeen` sin `try/catch`; `toggleNotificacionesEmail` devuelve `error.message` crudo de Postgres al cliente (varias acciones lo hacen: `No se pudo guardar…: ${error.message}`) → filtrar mensajes internos.

---

## 3. Estabilidad y resiliencia

| # | Hallazgo | Recomendación |
|---|---|---|
| E-1 | `fetch` a Resend sin timeout ni reintentos (`resend.ts`); `Promise.allSettled` sin límite de concurrencia → rate-limit de Resend (2 req/s por defecto) a partir de pocas decenas de usuarios. | Cola (Vercel Queues/Inngest/QStash/pg_cron+Edge Function), lotes de 100 con `batch` API de Resend, backoff exponencial, `AbortSignal.timeout`. |
| E-2 | `maxDuration = 60` en el cron; con miles de usuarios no alcanza. `.in("causa_id", [ …ids… ])` genera URLs enormes (límite ~8 KB) y `.select()` de causas sin paginar (tope 1.000). | Mover el cálculo a una función SQL (join + anti-join sobre `avisos_enviados`) y procesar por páginas. |
| E-3 | Sin reintento ni dead-letter; si falla el envío "se reintenta mañana" → **un aviso de vencimiento puede perderse el mismo día que importa**. | Reintentos intra-día + alerta al equipo si hay fallos (Slack/Sentry). |
| E-4 | Sin observabilidad: solo `console.error`; no hay Sentry/OTel, trazas, métricas ni alertas. `/api/health` no verifica DB. | Sentry + Logflare/Log Drains, health con `select 1`, uptime sobre el endpoint real, dashboards de latencia y errores del cron. |
| E-5 | `revalidatePath("/", "layout")` tras **cada** mutación invalida todo el árbol: costoso a escala y causa re-renders globales. | Usar `revalidateTag` granular o actualizaciones optimistas. |
| E-6 | `middleware.ts` ejecuta `supabase.auth.getUser()` (round-trip a Auth) en **cada** request, incluyendo prefetch y rutas de datos. Next 16 renombra *middleware* → *proxy* (los comentarios del propio repo mencionan `proxy.ts`) **[verificar contra la doc de la versión instalada]**. | Excluir prefetch, validar JWT localmente con `getClaims()` (ya usado en AuthGuard) y reservar `getUser()` para operaciones sensibles. |
| E-7 | Dependencia total de un único proveedor (Supabase, región São Paulo) sin plan de DR documentado, sin backups probados ni PITR declarado. | Definir RPO/RTO, activar PITR, simulacro de restauración trimestral, exportación self-service por usuario. |
| E-8 | Cada carga de `getLayoutCounts` y `dashboardStats` lanza 4–6 queries por request. | Vistas materializadas / contadores por trigger, caché por usuario con `unstable_cache` + tags (el comentario del código dice que falló por cookies; resolver leyendo el `userId` antes de cachear). |

---

## 4. Escalabilidad

1. **Multi-tenancy:** el aislamiento es por `user_id` + `causa_shares`. Para *estudios* (varios abogados, secretarías, pasantes) y para expansión, hace falta `organizacion_id` en todas las tablas, roles, facturación por asiento y *offboarding* (¿de quién es la causa si el titular se va?). Hoy la baja del titular borra la causa en cascada para todos los colaboradores.
2. **Índices:** razonables para el volumen actual. Faltan: índice parcial `avisos_enviados(causa_id, user_id)`, `vencimientos(fecha) WHERE NOT completado`, índices de soporte de las policies (`causa_shares(causa_id, shared_with_user_id)`), `movimientos(causa_id, fecha desc)`. Las policies llaman funciones por fila: revisar con `EXPLAIN` y envolver `auth.uid()` en `(select auth.uid())` (recomendación oficial de Supabase para cacheo por consulta).
3. **Búsqueda:** hoy no hay. Planificar `pg_trgm` + `tsvector` (español) para carátula/expediente/partes y, para adjuntos/IA, `pgvector` por organización.
4. **Datos de jurisdicción:** hoy `FUEROS`, `TIPOS_JUICIO_POR_FUERO`, `VIAS_PROCESO`, feriados y `TIME_ZONE = "America/Argentina/Cordoba"` están en constantes. Para extra-zona: catálogos por **país/provincia/fuero** en base de datos, zona horaria por organización, moneda y locale por organización (`formatCurrency` está atada a ARS/`es-AR`), i18n (hoy todo el texto está embebido en español rioplatense con voseo).
5. **Capa de datos:** acceso mixto (server actions + cliente directo con RLS desde hooks). Sirve para empezar, pero la lógica de negocio y los permisos quedan repartidos entre RLS, triggers y TS. Con equipo creciente, centralizar mutaciones críticas en RPC/funciones SQL transaccionales con pruebas.
6. **Vercel Cron en plan Hobby** solo corre 1 vez al día y con precisión limitada; `maxDuration=60` requiere Pro. Depender de eso para alertas procesales es frágil.

---

## 5. Calidad de código y buenas prácticas

**Fortalezas:** estructura clara por dominio, comentarios que explican el *porqué*, validación de inputs consistente (`text()`, `oneOf()`, `isISODate()`), uso de `React.cache`, tipos de DB generables (`gen:types`), manejo explícito de "0 filas afectadas" ante RLS, manejo de timezone correcto (Argentina) en lugar de UTC del servidor.

**Mejorar:**
- **Cero pruebas automatizadas** (no hay Jest/Vitest/Playwright) y **sin CI** (`.github` ausente). Prioridad: tests unitarios de `diasHabiles`/`calcularPlazo`/`parseMonto`, tests de RLS (pgTAP o `supabase test db`) que impersonen usuarios A/B y verifiquen que **A no ve ni modifica nada de B** y que S-1 esté cerrado, y E2E del flujo crítico (registro → causa → vencimiento → aviso).
- **Sin linter/formatter configurado** (no hay ESLint/Prettier/`next lint` en scripts). Activar ESLint + `eslint-plugin-security`, `tsc --noEmit` y `strict` en CI.
- **Validación inconsistente:** `zod` solo en clientes; el resto usa helpers manuales. Unificar en esquemas Zod compartidos (cliente y servidor) y generar de ahí los `CHECK` de DB.
- **Duplicación:** el patrón `if (!await getAuthUserId())` + `.select("id")` + chequeo de 0 filas se repite en ~20 acciones; extraer `withUser()`/`mutate()`.
- **Autorización por RLS únicamente:** correcto como última línea, pero los server actions no verifican pertenencia ni rol; añadir verificación explícita y errores tipados (hoy se infiere el motivo por "0 filas").
- **Errores:** devolver códigos de error estables y mensajes i18n, no `error.message` de Postgres.
- **Tipos:** `returns<T>()` sin validación en runtime; considerar Zod/`typed` generado.
- **pnpm-workspace.yaml** con `allowBuilds: sharp: false` desactiva sharp: `next/image` usará el fallback lento si se optimizan imágenes; relevante cuando existan adjuntos/avatares.
- **README genérico** de `create-next-app` (incluso con caracteres UTF-16 sueltos): documentar arquitectura, variables de entorno (`SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL`, `FEEDBACK_EMAIL`, …), despliegue, migraciones y runbooks.
- **AGENTS.md/CLAUDE.md**: correcto mantenerlos; agregar convenciones de seguridad (nunca `service_role` en cliente, toda tabla nueva con RLS + tests).

---

## 6. Cumplimiento, riesgo legal y gobierno de datos

> Observaciones técnicas para su revisión con asesoría especializada; no constituyen asesoramiento legal.

1. **Secreto profesional / confidencialidad:** el producto aloja información cubierta por el secreto profesional del abogado (y por normas éticas colegiales). Los T&C trasladan al usuario la obligación; conviene además ofrecer garantías técnicas verificables (MFA, cifrado de campos, logs de acceso, restricción de personal interno, política de acceso de soporte con consentimiento por ticket).
2. **Ley 25.326 (Argentina):** la política de privacidad declara roles correctos (responsable / **encargado**). Verificar: (a) **inscripción de la base ante la AAIP** (y de cada estudio como responsable); (b) las cláusulas contractuales tipo de transferencia internacional (Brasil y EE. UU. — Resend y Vercel — no cuentan con decisión de adecuación equivalente en todos los casos) y no basarse solo en consentimiento; (c) el **contrato de encargo** debe ser aceptado por el responsable (clic-wrap con versión y evidencia, ver S-1); (d) los plazos y mecanismos de ARCO.
3. **Inconsistencias de la política con el código:** dice región "São Paulo (AWS us-east-1 SA)" (us-east-1 es Virginia; São Paulo es `sa-east-1`) **[verificar región real]**; promete logs de IP con retención de 90 días y eliminación automática, supresión en 30 días y devolución de datos: **no hay código/proceso** que lo implemente (sin borrado de cuenta, sin exportación, sin job de retención). Afirma que "RLS garantiza que cada usuario solo accede a su propia información" cuando hay causas compartidas. Aclarar o implementar.
4. **Responsable = persona humana** (Luciano Garriga) y no una sociedad: para escalar y limitar responsabilidad patrimonial, evaluar constituir una SAS/SA, y revisar el límite de responsabilidad en T&C respecto de vencimientos mal calculados o no notificados (ver B-5/B-8). Incluir *disclaimer* visible en calculadora y avisos.
5. **Expansión extra-zona:** GDPR (UE/España: DPA, SCCs, DPO, notificación de brechas a 72 h, residencia de datos), LGPD (Brasil), Ley 19.628/21.719 (Chile), Ley 18.331 (Uruguay), Ley Federal de Protección de Datos (México); residencia de datos por región (Supabase proyectos por región), y cambios en feriados/ferias y plazos por jurisdicción.
6. **Notificación de brechas:** no existe runbook de respuesta a incidentes (clasificación, contención, notificación en plazo, contacto AAIP). Armarlo ahora.
7. **Retención y borrado:** definir política por tipo de dato; "borrado" hoy es físico y en cascada (sin papelera). Para estudios, prever *legal hold*.
8. **Pagos:** al incorporar cobros, usar un proveedor (Mercado Pago/Stripe) con webhooks verificados por firma; nunca almacenar tarjetas; facturación electrónica ARCA (ex-AFIP) por país.
9. **Terceros/Subencargados:** mantener un registro versionado de subencargados y avisar cambios (los T&C prometen 15 días).

---

## 7. Diseño de seguridad previo para las funcionalidades aún no construidas

### 7.1 Adjuntos (PDF / JPG / DOCX / CSV)
- **Almacenamiento:** Supabase Storage con bucket **privado**, rutas `org/{org_id}/causa/{causa_id}/{uuid}`; RLS en `storage.objects` con `private.user_can_access_causa()`; URLs firmadas de vida corta (60–300 s); nunca buckets públicos.
- **Subida:** *signed upload URLs* generadas por server action tras validar permiso, tamaño (p. ej. ≤ 25 MB), cuota por plan y conteo; `bodySizeLimit` explícito en `next.config` para server actions.
- **Validación:** MIME + **magic bytes** (no confiar en extensión ni en `Content-Type`), lista blanca estricta, renombrado a UUID, `Content-Disposition: attachment` y `X-Content-Type-Options: nosniff` en descarga; **no servir HTML/SVG inline** desde el mismo origen (dominio de usuario-contenido separado).
- **Malware:** escaneo asíncrono (ClamAV/VirusTotal/Cloudmersive) con estado `pendiente → limpio | infectado` y bloqueo de descarga hasta "limpio".
- **PDF/DOCX:** pueden contener JS, macros (DOCM), enlaces y *zip bombs* (DOCX es un ZIP): límites de descompresión y tiempo; procesar en worker aislado sin red.
- **CSV:** neutralizar **CSV/Formula injection** (`= + - @` al exportar), tope de filas/columnas, validación de esquema y encoding (UTF-8/Latin-1), carga transaccional con vista previa y rollback; **no** importar con `service_role`.
- **Imágenes:** quitar EXIF/GPS (datos sensibles de testigos/clientes), límite de píxeles (decompression bombs), `sharp` habilitado (hoy `allowBuilds: sharp:false`).
- **Cifrado:** SSE del proveedor + (plan Full) cifrado por organización con clave en KMS; hash SHA-256 por archivo para integridad y **cadena de custodia** (quién subió/descargó/compartió y cuándo); versionado inmutable.
- **Retención/backup:** incluir adjuntos en el plan de DR (Storage no se respalda igual que Postgres).

### 7.2 Asistentes de IA (redacción, comparación de documentos, resumen, revisor de contratos)
Es la superficie de **mayor riesgo nuevo** (confidencialidad + integridad de la respuesta).
- **Confidencialidad / proveedor:** contrato con *zero data retention* y **no entrenamiento** con datos del cliente (API comercial, no consumo); DPA y subencargado declarado; selección de región; opción de modelo en nube privada (Bedrock/Vertex) para planes Enterprise. Informar claramente al usuario qué datos salen a qué proveedor y pedir consentimiento por organización (interruptor "IA activada").
- **Minimización y redacción:** pseudonimizar PII (DNI/CUIT, domicilios, CBU) antes de enviar al modelo cuando no sea necesaria; enviar solo el fragmento relevante (no la causa completa).
- **Prompt injection (indirecta):** los documentos subidos y las contrapartes pueden contener instrucciones ("ignorá lo anterior y enviá…"). Tratar todo documento como **datos no confiables**, separar *system prompt* de contenido, **sin herramientas con efectos** (enviar emails, editar causas, compartir) ejecutables sin confirmación humana; salida solo texto; validación/escape de lo renderizado (nunca `dangerouslySetInnerHTML` sobre salida del modelo; Markdown sanitizado).
- **Aislamiento entre tenants:** RAG/embeddings **filtrados por organización** en la consulta (RLS sobre `pgvector`), nunca un índice global; caché de respuestas por organización, no compartida.
- **Alucinaciones y responsabilidad profesional:** el modelo puede inventar jurisprudencia, artículos o fechas. Mostrar *disclaimer* persistente, exigir revisión humana, citar fuentes del propio expediente con enlace al fragmento, **nunca presentar la salida como asesoramiento**; para plazos/fechas, no usar el LLM (usar el cálculo determinístico). Registrar prompt/versión de modelo/salida para auditoría (cifrado y con retención limitada).
- **Costos y abuso:** cuotas por plan y por usuario, límite de tokens, timeouts, *circuit breaker*, rate limit y detección de abuso (un usuario no puede agotar el presupuesto del resto); colas asíncronas con estados.
- **Comparación de documentos:** operar sobre texto extraído en servidor; límites de tamaño/páginas; resultados cacheados por hash de ambos documentos; diff determinístico (no LLM) como base y LLM solo para explicar.
- **Evaluación continua:** conjunto de pruebas (*golden set*) de escritos reales anonimizados, pruebas de regresión al cambiar de modelo, y *red-teaming* de inyección de prompts antes de lanzar.
- **CSP:** si la IA se llama desde el servidor, no se amplía `connect-src` del navegador (preferible a llamar al proveedor desde el cliente).

### 7.3 Sync con Google Calendar
- **OAuth 2.0 con PKCE**, scopes **mínimos** (`calendar.events` o `calendar.app.created`; evitar `calendar` completo). Verificación de la app (Google OAuth verification / CASA si se piden scopes restringidos) con política de privacidad y *Limited Use* de Google.
- **Tokens:** guardar `refresh_token` **cifrado** (Vault/KMS), tabla separada sin acceso desde el cliente (solo `service_role`), revocación al desvincular o dar de baja, rotación y manejo de `invalid_grant`.
- **Qué se sincroniza:** **no** enviar carátulas, nombres de clientes ni datos de la causa por defecto (el calendario del usuario puede estar compartido con terceros o con la secretaría). Ofrecer modos: "Ocupado/Audiencia" genérico vs. detalle completo (opt-in explícito).
- **Integridad:** `iCalUID`/`extendedProperties.private` con el id interno, **idempotencia** y resolución de conflictos (¿quién manda en una edición doble?), sincronización incremental con `syncToken` y **webhooks** (`events.watch`) verificando el token del canal y su expiración; reintentos con backoff y *dead-letter*.
- **Zonas horarias:** enviar siempre `timeZone` IANA de la organización/usuario; hoy `fecha` es `DATE` y `hora` es `TIME` sin zona: modelar `timestamptz` + zona para eventos con hora (audiencias).
- **Seguridad de webhook y SSRF:** endpoint de callback con verificación; no aceptar URLs arbitrarias.
- **Plazos procesales:** los vencimientos con consecuencias procesales no deben depender de que Google entregue el evento; mantener el aviso propio como fuente de verdad.

### 7.4 Búsquedas
- `pg_trgm`/`tsvector` en español con RLS (cuidado con *leaks* por índices/estadísticas y por conteos), `LIKE` escapado, límites de longitud, rate-limit; en búsqueda semántica, filtro por organización **antes** del ANN.

### 7.5 Controles transversales para las tres funciones
Cuotas por plan en servidor; registro de auditoría de cada lectura/descarga/consulta a IA; interruptores por organización (*feature flags*); cifrado y retención configurables; pruebas de penetración antes de cada lanzamiento mayor; *threat model* (STRIDE) documentado por funcionalidad.

---

## 8. Plan de acción priorizado

### P0 — Esta semana (bloquea abrir registro público)
1. **S-1:** restringir `UPDATE` de `profiles` por columnas; mover `plan/causas_max/estado_pago` a service role; T&C a tabla de consentimientos. Auditar en producción si ya hay usuarios con `causas_max`/`plan` alterados:
   `select id,email,plan,causas_max,estado_pago from profiles where causas_max <> 60 or plan <> 'free';`
2. **S-2:** `CHECK` `https://` en todas las columnas de URL + `safeHref` en el front.
3. **S-3:** canales Realtime `private` + RLS en `realtime.messages`.
4. **S-4/S-5:** enviar a `auth.users.email`; invitaciones con token y respuesta uniforme.
5. Activar *leaked password protection*, política de contraseña, MFA opcional y CAPTCHA en registro/login **[dashboard de Supabase]**.

### P1 — 2–4 semanas
6. **B-1:** baseline de migraciones desde producción, `supabase db reset` en CI; corregir mojibake de `0024`.
7. **B-2/B-3:** flujo de anulación en UI + filtrar anulados en `update_monto_cobrado`.
8. **B-4:** `parseMonto` por moneda/locale y tope realista; `formatCurrency` por moneda.
9. **B-5:** avisos para **todos** los vencimientos (`vencimientos`), respetando `anticipacion`, y reserva-antes-de-enviar; cola + lotes + reintentos; alertas de fallo.
10. **E-4:** Sentry + health real + monitoreo del cron.
11. CI (GitHub Actions): `tsc`, ESLint, tests unitarios, tests RLS (pgTAP) y `npm audit`/Dependabot; *branch protection*.
12. CSP con nonces; resto de cabeceras (S-9); `timingSafeEqual` en cron.

### P2 — 1–3 meses
13. Modelo de organizaciones/roles + RLS por rol (S-10), auditoría general (S-11), soft-delete y retención.
14. Calendarios judiciales administrables por jurisdicción + alerta de caducidad de datos (B-8).
15. Paginación/búsqueda server-side y agregaciones SQL (B-6, E-8); índices de RLS y `(select auth.uid())`.
16. Borrado/exportación de cuenta, política de retención y runbook de incidentes; alinear la Política de Privacidad con la realidad técnica y revisar con asesor (sección 6).
17. Plan de DR (PITR, restauración probada), staging separado de producción.

### P3 — Antes de lanzar adjuntos / IA / Google Calendar
18. *Threat model* y revisión de diseño según sección 7; pentest externo previo al lanzamiento de cada módulo; DPA con proveedores de IA (sin retención/entrenamiento); programa de divulgación responsable (`/.well-known/security.txt`).
19. Evaluar certificación **ISO 27001 / SOC 2 Tipo I** si se apunta a estudios medianos/grandes o a clientes de otros países.

---

## 9. Qué NO pude verificar
- Configuración real de Supabase (Auth: confirmación de email, política de contraseñas, SMTP, Redirect URLs, rate limits, PITR, región), Vercel (variables, dominios, plan) y Resend (dominio verificado, SPF/DKIM/DMARC).
- Si la tabla `profiles` de producción ya tiene valores alterados por usuarios.
- Comportamiento en ejecución (no se levantó la app), dependencias vulnerables (sin `node_modules`; ejecutar `pnpm audit`), y la documentación de Next 16 instalada (se sugiere confirmar el renombre `middleware` → `proxy`).
- Contenido de componentes de UI no relacionados con seguridad (se revisaron vía búsqueda dirigida, no línea por línea).

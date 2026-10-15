# Operaciones de producción (guía para el equipo)

Guía de referencia para tareas de base de datos y despliegue. Todos los comandos son para **PowerShell en Windows**.

## Reglas

- Todo cambio se prueba primero en **staging**. Producción solo se toca con confirmación explícita.
- **Nunca** pegar en el chat contraseñas ni URLs de conexión. Si un error las muestra, reemplazarlas por `****`.
- Las variables `$env:PROD_DB` y `$env:STG_DB` se borran al cerrar PowerShell. Hay que volver a cargarlas.

## 1. Herramienta pg_dump (copias de seguridad)

Instalada: PostgreSQL 18.6 en `C:\Program Files\PostgreSQL\18\bin\pg_dump.exe`.

Si `pg_dump --version` dice que no se reconoce, agregarla a la sesión actual:

```powershell
$env:Path += ";C:\Program Files\PostgreSQL\18\bin"
pg_dump --version
```

## 2. Cargar la dirección de producción (sin mostrarla)

```powershell
$env:PROD_DB = Read-Host "Pegá la URL de producción y apretá Enter"
if ($env:PROD_DB) { "PROD_DB cargada" } else { "PROD_DB vacía" }
```

## 3. Copia de seguridad de producción

```powershell
New-Item -ItemType Directory -Force -Path C:\manaleg-backups | Out-Null
$fecha = Get-Date -Format "yyyy-MM-dd_HHmm"
pg_dump $env:PROD_DB --schema=public --no-owner --no-privileges -f "C:\manaleg-backups\prod_$fecha.sql"
```

Verificar que se creó y tiene contenido:

```powershell
Get-ChildItem C:\manaleg-backups | Select-Object Name, Length
Select-String -Path C:\manaleg-backups\prod_*.sql -Pattern "^COPY public\." | Select-Object -First 10
```

Las copias se guardan fuera del repositorio. No subirlas a git.

## 4. Migraciones

Ver qué migraciones faltan aplicar en cada base:

```powershell
pnpm supabase migration list --db-url "$env:STG_DB"
pnpm supabase migration list --db-url "$env:PROD_DB"
```

Aplicar (solo después de confirmar la lista y tener la copia de seguridad):

```powershell
pnpm supabase db push --db-url "$env:PROD_DB"
```

Orden de despliegue a producción: **primero migraciones, después el código** (merge del PR a `main`, que dispara el deploy en Vercel).

## 5. Configuración pendiente de producción

- Vercel (Production): `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, y redeploy.
- Supabase (producción): secreto de Turnstile en Authentication → Attack Protection.
- Supabase (producción): SMTP personalizado con Resend (`noreply@manaleg.com.ar`), plantilla de recuperación de contraseña, Site URL `https://manaleg.com.ar`, Redirect URLs `https://manaleg.com.ar/api/auth/**`.
- Supabase PRO: activar protección de contraseñas filtradas (recordatorio pendiente, una vez definido CI).

## 6. Después de producción

Prueba rápida en producción: login, crear causa, compartir causa, honorarios, dashboard.

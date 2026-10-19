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

## 7. Alta y baja de administradores del panel

El panel `/admin` solo lo ve una cuenta con `es_admin = true` y con segundo factor (TOTP) verificado. `es_admin` se asigna **solo desde el SQL Editor de Supabase**, nunca desde la aplicación: el trigger `proteger_es_admin` rechaza cualquier cambio que no venga del rol de servicio o del dueño de la base.

**Antes de dar de alta**
- La persona tiene cuenta en MANALEG con el email que va a usar como admin.
- El titular del servicio autorizó el alta. Dejar constancia con fecha y motivo en el registro interno.
- Idealmente, una cuenta distinta de la personal de uso diario.

**Alta** (en producción y en staging, por separado)
1. Abrir el SQL Editor del proyecto correspondiente.
2. Confirmar que la cuenta existe:
   ```sql
   select id, email, es_admin from public.profiles where email = 'EMAIL';
   ```
   Si no aparece, la persona tiene que registrarse primero.
3. Dar de alta:
   ```sql
   update public.profiles set es_admin = true where email = 'EMAIL';
   ```
4. Verificar: repetir el `select`. `es_admin` tiene que ser `true`.
5. La persona entra a `/admin` con su contraseña. La primera vez se le pide activar el segundo factor: escanear el código QR con una app de autenticación y cargar el código de 6 dígitos. Sin ese paso no ve el panel.

**Baja** (inmediata)
```sql
update public.profiles set es_admin = false where email = 'EMAIL';
```
Verificar con el `select`. Si hay sospecha de compromiso, además cerrar las sesiones de esa cuenta en Authentication → Users.

**Auditoría**
Cada consulta al panel queda en `admin_auditoria`, tabla sin acceso desde la aplicación. Revisar periódicamente:
```sql
select a.creado_at, p.email, a.seccion
from public.admin_auditoria a
join public.profiles p on p.id = a.admin_id
order by a.creado_at desc
limit 50;
```

**Reglas**
- Cada admin usa su propia cuenta. Nunca compartir una contraseña de admin.
- No dar de alta admins por pedido en un chat ni desde la app: solo el titular ejecuta el SQL.
- Pocos admins: idealmente uno o dos.

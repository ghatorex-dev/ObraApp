# Handoff — ObraApp

Documento de contexto para retomar el proyecto (o iniciar un chat nuevo).

## Reglas de oro (respetar siempre)

1. **No mostrar NUNCA** en el chat credenciales, secrets, API keys, contraseñas
   ni valores de `.env`. Filtrar la salida de comandos que puedan imprimirlos.
2. **No tocar ElectriApp** bajo ningún concepto: su repo, base de datos, Vercel
   ni archivos. Es un proyecto **separado** en
   `C:\Users\guill\Desktop\proyecti 1 electric\electriapp`.
3. **Sesiones JWT** en NextAuth (ya configurado) — mantener, no cambiar a
   estrategia de base de datos.
4. **UI 100% en español**, **mobile-first (mín. 375px)**, **sin font-sizes en px
   fijos** (usar clases Tailwind), **siempre color de texto Y fondo explícitos**,
   **comentarios de código en español**.
5. **Sin Stripe.**
6. **Rate limiting con fallback a Map** en memoria (si no hay `REDIS_URL`, no
   romper la app).
7. **Commit + push por módulo** y confirmar el progreso por módulo.
8. **No correr `prisma migrate` sin confirmación del usuario** (ya se confirmó y
   se aplicó — ver "Estado actual").

## Ubicación y repo (¡ojo con carpetas que confunden!)

- **Código real de ObraApp:** `C:\Users\guill\ObraApp` (en el home, NO en el
  Desktop).
- `C:\Users\guill\Desktop\ObraApp` **solo tiene archivos de credenciales** (no
  leer/mostrar). No es el código.
- `C:\Users\guill\Desktop\electripro` es **otra app distinta** (Supabase SSR,
  sin Prisma). No es ObraApp ni ElectriApp.
- **Repo:** `github.com/ghatorex-dev/ObraApp`
- **Branch de trabajo:** `claude/obraapp-init-oms7y9` (el `origin/HEAD` apunta
  ahí; no hay `main`).

## Stack

Next.js **14.2.5** (App Router) · TypeScript · Tailwind + **shadcn/ui** (tokens
semánticos: `bg-background`, `text-foreground`, `text-muted-foreground`,
`bg-card`, `bg-primary`, `border-border`, etc.) · **Prisma 5.22** + PostgreSQL
(**Supabase**) · **NextAuth v4 (JWT)** + Credenciales (bcrypt) + Google OAuth ·
**ioredis** · **pdfkit** · **zod** · lucide-react.

## Lo que se construyó (9 módulos + migración)

| # | Módulo | Commit |
|---|--------|--------|
| 1 | **Seguridad**: `rate-limit.ts` con fallback a Map; `audit-log.ts` (eventos en español, JSON a stdout); eventos NextAuth `signIn/signOut`; audit en registro. Headers ya completos en `next.config.mjs` (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy). | `5990b34` |
| 2 | **Onboarding (1 paso)**: `/onboarding` (nombre + país, Argentina default) → `POST /api/onboarding` marca `onboardingComplete`, guarda `country`, siembra presupuesto de ejemplo (`sembrarPresupuestoEjemplo`, numero 0, `esEjemplo`). Registro y dashboard redirigen a `/onboarding` si falta. | `bda56f0` |
| 3 | **Presupuestos**: `/dashboard/presupuestos` (listado), `/dashboard/presupuestos/[id]` (detalle con ítems agrupados por rubro + subtotales; sin subtítulos si hay 1 solo rubro). Server actions **enviar** (genera `tokenFirma`) y **eliminar** (solo borradores). PDF (PDFKit): encabezado nombre+número, cliente, agrupado por categoría con subtotales, total; bloquea el ejemplo. Helpers `agruparPorCategoria` y `estados.ts`. | `58ebc6c` |
| 4 | **Firma digital (público)**: `/presupuesto/[token]` (firma idempotente, registra `clienteIp`, no reutilizable) y `/seguimiento/[token]` (solo lectura). Server action `firmarPresupuesto`. | `bc2dd1b` |
| 5 | **Planes Free/Pro**: `lib/plan.ts` (`verificarLimite`, `contarPresupuestosDelMes` sin el ejemplo, `esProActivo`). Free = 3/mes; Pro = ilimitado USD 4,99/mes. `crearPresupuesto` chequea el límite → `UpgradeModal`. Botón "Hacerme Pro" (solo Free) en dashboard. | `61ff2ef` |
| 6 | **Admin `/admin`**: solo `ADMIN_EMAIL`, verifica el email contra la BD en cada request (no solo la sesión). Secciones Usuarios y Presupuestos por usuario. `lib/admin.ts`. | `469579d` |
| 7 | **Configuración `/dashboard/configuracion`**: nombre editable (`actualizarNombre`), email (read-only), cerrar sesión, "Solicitar eliminación de cuenta" (mailto). | `0df0b55` |
| 8 | **Legales**: `/terminos` y `/privacidad` (públicas, jurisdicción Argentina, Ley 25.326 en privacidad). `LegalShell`/`LegalSeccion` + `Footer` (agregado al dashboard). | `27a2f01` |
| 9 | **Landing `/`**: hero, rubros (plomería/gas/albañilería/pintura), funcionalidades, precios (Free/Pro), CTA a /registro, footer legal. Corrige copy (decía "electricistas"). + `pdfkit` externo en next.config. | `d44aadf` |
| — | **Migración** `20260701111640_add_plan_onboarding_ejemplo` (aditiva) aplicada + se trackearon las 3 migraciones base que estaban sin commitear. | `9b9aa93` |

## Modelo de datos (Prisma)

Enum `Categoria` (plomeria, gas, albanileria, pintura). Modelos: `User`,
`Account`, `Session`, `VerificationToken`, `Presupuesto`, `ItemPresupuesto`,
`TareaComunitaria` (seed de 20).

Campos agregados en la migración: `User.{plan (default "free"), planExpiresAt,
onboardingComplete (default false), country}` y `Presupuesto.{esEjemplo (default
false), clienteIp}`. Estados de `Presupuesto`: `borrador | enviado | firmado |
cancelado`.

## Decisiones que se tomaron (con motivo)

1. **Ubicación**: se confirmó el codebase real en `C:\Users\guill\ObraApp`
   (descartando `Desktop\ObraApp` = solo credenciales y `electripro` = otra app)
   antes de tocar nada.
2. **Rate limit con Map** (no fail-open): el código previo "fallaba abierto" sin
   Redis; se cambió a contador de ventana fija en memoria (Map). Limitación: por
   instancia en serverless (aceptado).
3. **Middleware = única autoridad de redirección de AUTH** (evita loops
   `/login↔/dashboard`). Las redirecciones por ESTADO (onboarding, admin) van a
   nivel de página (server component consulta la BD); son otra cosa (no auth) y
   mutuamente excluyentes → sin loop. `/onboarding` y `/admin` se agregaron al
   matcher del middleware solo para exigir sesión.
4. **Admin sin email en el bundle**: verificación 100% server-side (`/admin`
   consulta la BD por el email en cada request). `ADMIN_EMAIL` sale de env; si no
   está seteada, nadie es admin.
5. **Presupuesto de ejemplo**: `numero 0` + `esEjemplo=true` → no cuenta para el
   límite, no se descarga (PDF 403), no se envía, pero es eliminable (borrador).
6. **Token de firma**: uuid doble sin guiones (largo e inadivinable), generado al
   enviar. Firma idempotente (si ya está firmado, muestra confirmación). IP desde
   headers en la server action.
7. **PDF**: totales/subtotales recalculados en server; agrupado por rubro con
   subtotales; si hay un solo rubro, sin subtítulos. `pdfkit` marcado como
   `serverComponentsExternalPackages` en `next.config.mjs` (evita el warning
   `iconv-lite`/`fontkit`).
8. **Sin proveedor de pago (Sin Stripe)**: se implementó el límite + modal +
   botón, pero el CTA "Hacerme Pro" y el de eliminación de cuenta son
   placeholders `mailto` con `hola@obraapp.app`. Decisión pendiente del usuario
   (su `.env.local.example` ya lista Lemon Squeezy / Mercado Pago).
9. **Migración con `dotenv-cli`**: la CLI de Prisma carga `.env` (no `.env.local`)
   y el proyecto solo tiene `.env.local`. Se corrió con
   `npx -p dotenv-cli dotenv -e .env.local -- prisma ...` (sin exponer valores).
   SQL 100% aditivo → no destructivo.
10. **Verificación por módulo con `npx tsc --noEmit`**; al final build completo +
    smoke test de rutas públicas.

## Gotchas importantes

- **Windows + Prisma engine DLL lock**: si el dev server (`npm run dev`) está
  corriendo, `prisma generate`/`migrate` falla con
  `EPERM ... query_engine-windows.dll.node`. Solución: detener el dev server
  (procesos node de ObraApp), correr generate/migrate, reiniciarlo.
- **Prisma CLI no lee `.env.local`**: usar
  `npx -p dotenv-cli dotenv -e .env.local -- npx prisma <cmd>`.
- **Supabase pooler (pgbouncer)**: no usar transacciones interactivas de Prisma
  (`$transaction` con varios awaits). `crearPresupuesto` hace ops secuenciales;
  el `create` con `items` anidados es una sola escritura (OK).
- **Iteración de `Map`**: usar `.forEach` (no `for...of`) por el target de TS.
- Los `tokenFirma` en `Presupuesto` son `@unique` y opcionales; se generan al
  enviar.

## Estado actual

- Migración aplicada (BD en sync, `migrate status` = "up to date"), client
  regenerado.
- Build completo pasa (16 rutas, sin warnings tras el fix de pdfkit).
- Dev server local en `http://localhost:3000`. Smoke test OK.
- Working tree limpio, todo pusheado a `claude/obraapp-init-oms7y9`.

## Pendientes del usuario (no bloquean el funcionamiento)

1. Setear **`ADMIN_EMAIL`** en `.env.local` para acceder a `/admin` (ya está el
   nombre con placeholder vacío en `.env.local.example`).
2. Definir **proveedor de pago** (o email real) para reemplazar los `mailto`
   placeholder `hola@obraapp.app` en `upgrade-modal.tsx`, `boton-pro.tsx`,
   `configuracion-cuenta.tsx`.
3. Completar **datos legales** (email de contacto real + titular/entidad) en
   `/terminos` y `/privacidad`.

## Comandos útiles

```bash
# Dev server (carga .env.local automáticamente vía Next)
npm run dev

# Typecheck
npx tsc --noEmit

# Build de producción
npm run build

# Prisma con .env.local (la CLI no lo lee sola)
npx -p dotenv-cli dotenv -e .env.local -- npx prisma migrate status
npx -p dotenv-cli dotenv -e .env.local -- npx prisma migrate dev --name <nombre>
```

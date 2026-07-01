# ObraApp — memoria del proyecto

Contexto persistente para cualquier sesión de Claude Code en este repo.
Para el historial completo de módulos, decisiones y gotchas, ver **HANDOFF.md**
(raíz del repo) — leerlo siempre al empezar una sesión nueva.

## Reglas de oro (respetar siempre)

1. **No mostrar NUNCA** en el chat credenciales, secrets, API keys, contraseñas
   ni valores de `.env`. Filtrar la salida de comandos que puedan imprimirlos.
2. **No tocar ElectriApp** bajo ningún concepto: es un proyecto separado
   (`electriapp`, en la máquina local del usuario). Repo, base de datos y
   Vercel distintos.
3. **No leer/mostrar `CREDENCIALES.md`** ni archivos de credenciales sueltos.
4. **Sesiones JWT** en NextAuth — mantener, no cambiar a estrategia de base de
   datos.
5. **UI 100% en español**, **mobile-first (mín. 375px)**, sin font-sizes en px
   fijos (usar clases Tailwind), siempre color de texto Y fondo explícitos,
   comentarios de código en español.
6. **Sin Stripe.**
7. **Rate limiting con fallback a Map** en memoria (si no hay `REDIS_URL`, no
   romper la app).
8. **Commit + push por módulo** y confirmar el progreso por módulo.
9. **No correr `prisma migrate` sin confirmación del usuario.**

## Repo y branch

- Repo: `github.com/ghatorex-dev/ObraApp`.
- No hay `main`; el `origin/HEAD` apunta a la branch de trabajo vigente
  (ver HANDOFF.md para el nombre actual, puede cambiar entre sesiones).

## Stack

Next.js 14.2.5 (App Router) · TypeScript · Tailwind + shadcn/ui (tokens
semánticos: `bg-background`, `text-foreground`, `text-muted-foreground`,
`bg-card`, `bg-primary`, `border-border`) · Prisma 5.22 + PostgreSQL
(Supabase) · NextAuth v4 (JWT) + Credenciales (bcrypt) + Google OAuth ·
ioredis · pdfkit · zod · lucide-react.

## Gotchas importantes

- Prisma CLI no lee `.env.local`: usar
  `npx -p dotenv-cli dotenv -e .env.local -- npx prisma <cmd>`.
- Supabase pooler (pgbouncer): no usar transacciones interactivas de Prisma
  (`$transaction` con varios awaits).
- Iteración de `Map`: usar `.forEach` (no `for...of`).
- En Windows, si el dev server está corriendo, `prisma generate`/`migrate`
  puede fallar por lock del engine (`EPERM ... query_engine-windows.dll.node`).

## Pendientes del usuario

1. Setear `ADMIN_EMAIL` en `.env.local` para acceder a `/admin`.
2. Definir proveedor de pago (o email real) para reemplazar los `mailto`
   placeholder `hola@obraapp.app`.
3. Completar datos legales reales en `/terminos` y `/privacidad`.

# ObraApp

SaaS para trabajadores de oficios (plomeros, gasistas, albañiles,
electricistas) de LATAM. Permite crear, enviar y hacer firmar
presupuestos profesionales desde el celular.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Tailwind CSS** + **shadcn/ui** (estilo Default, color Slate, CSS variables)
- **Prisma** + **PostgreSQL** (Supabase)
- **NextAuth** con Prisma Adapter
- **ioredis** para caché / colas

## Puesta en marcha

1. Instalá las dependencias:

   ```bash
   npm install
   ```

2. Copiá la plantilla de variables de entorno y completá los valores:

   ```bash
   cp .env.local.example .env.local
   ```

   > ⚠️ Nunca subas `.env.local` ni `.env` al repositorio. Ya están en
   > `.gitignore`.

3. Una vez cargadas las variables de Supabase, sincronizá el esquema:

   ```bash
   npm run db:push      # o: npm run db:migrate
   ```

4. Levantá el entorno de desarrollo:

   ```bash
   npm run dev
   ```

## Variables de entorno

Ver `.env.local.example`. Todos los nombres requeridos:

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Conexión con pooling (pgBouncer) a Supabase |
| `DIRECT_URL` | Conexión directa para migraciones de Prisma |
| `NEXTAUTH_SECRET` | Secreto de NextAuth (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL pública de la app |
| `LEMON_SQUEEZY_API_KEY` | API key de Lemon Squeezy |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Secreto de webhooks de Lemon Squeezy |
| `MP_ACCESS_TOKEN` | Access token de Mercado Pago |
| `RESEND_API_KEY` | API key de Resend (emails) |
| `REDIS_URL` | URL de conexión a Redis |

## Scripts

- `npm run dev` — entorno de desarrollo
- `npm run build` — build de producción (genera el cliente de Prisma)
- `npm run db:push` — sincroniza el esquema sin migraciones
- `npm run db:migrate` — crea y aplica una migración
- `npm run db:studio` — abre Prisma Studio

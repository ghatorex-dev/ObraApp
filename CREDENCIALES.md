# Credenciales y variables de entorno — ObraApp

Esta guía explica **todas** las variables de entorno que necesita ObraApp,
de dónde sacar cada una y cómo cargarlas.

> ⚠️ **Seguridad**
> - Nunca commitees `.env.local` ni `.env` (ya están en `.gitignore`).
> - Nunca pegues estos valores en chats, issues, capturas ni logs.
> - Para producción (Vercel) generá secretos **distintos** a los de desarrollo.

---

## Cómo cargarlas (local)

1. Copiá la plantilla:

   ```bash
   cp .env.local.example .env.local
   ```

2. Abrí `.env.local` y completá cada valor (a la derecha del `=`).

3. Reiniciá el servidor de desarrollo para que tome los cambios:

   ```bash
   npm run dev
   ```

## Cómo cargarlas (Vercel)

En el proyecto de Vercel: **Settings → Environment Variables**. Cargá las
mismas variables. Tener en cuenta:

- `NEXTAUTH_URL` debe apuntar a tu dominio de producción (ej:
  `https://obraapp.vercel.app`), no a `localhost`.
- `DATABASE_URL` / `DIRECT_URL` con los datos de tu proyecto de Supabase.
- Regenerá `NEXTAUTH_SECRET` para producción.

---

## Variables

### Base de datos — Supabase

| Variable | Descripción |
| --- | --- |
| `DATABASE_URL` | Cadena de conexión **con pooling** (pgBouncer, puerto `6543`). La usa la app en runtime. |
| `DIRECT_URL` | Cadena de conexión **directa** (puerto `5432`). La usan las migraciones de Prisma. |

**Dónde obtenerlas:** panel de Supabase → tu proyecto → **Project Settings →
Database → Connection string**. Copiá la variante "Connection pooling" para
`DATABASE_URL` y la conexión directa para `DIRECT_URL`.

### NextAuth

| Variable | Descripción |
| --- | --- |
| `NEXTAUTH_SECRET` | Secreto para firmar los JWT de sesión. |
| `NEXTAUTH_URL` | URL pública de la app. En desarrollo: `http://localhost:3000`. |

**Cómo generar `NEXTAUTH_SECRET`:**

```bash
openssl rand -base64 32
```

Copiá la salida a `.env.local`. (No la pegues en ningún otro lado.)

### Google OAuth

| Variable | Descripción |
| --- | --- |
| `GOOGLE_CLIENT_ID` | ID de cliente OAuth. |
| `GOOGLE_CLIENT_SECRET` | Secreto de cliente OAuth. |

**Dónde obtenerlas:** [Google Cloud Console → APIs & Services →
Credentials](https://console.cloud.google.com/apis/credentials) → **Create
Credentials → OAuth client ID → Web application**.

- **Authorized JavaScript origins:** `http://localhost:3000`
- **Authorized redirect URIs:**
  `http://localhost:3000/api/auth/callback/google`

(Repetí con tu dominio de producción para Vercel.)

### Lemon Squeezy (pagos internacionales)

| Variable | Descripción |
| --- | --- |
| `LEMON_SQUEEZY_API_KEY` | API key para crear checkouts y consultar suscripciones. |
| `LEMON_SQUEEZY_WEBHOOK_SECRET` | Secreto para validar la firma de los webhooks. |

**Dónde obtenerlas:** panel de Lemon Squeezy → **Settings → API** (API key) y
**Settings → Webhooks** (signing secret).

### Mercado Pago (pagos LATAM)

| Variable | Descripción |
| --- | --- |
| `MP_ACCESS_TOKEN` | Access token para crear preferencias de pago y cobrar. |

**Dónde obtenerla:** [Mercado Pago Developers → Tus integraciones →
Credenciales](https://www.mercadopago.com.ar/developers/panel).

### Resend (emails)

| Variable | Descripción |
| --- | --- |
| `RESEND_API_KEY` | API key para enviar emails (presupuestos, notificaciones). |

**Dónde obtenerla:** [Resend → API Keys](https://resend.com/api-keys).

### Redis (ioredis / rate limiting)

| Variable | Descripción |
| --- | --- |
| `REDIS_URL` | URL de conexión a Redis. Se usa para el rate limiting. |

**Dónde obtenerla:** tu proveedor de Redis (por ejemplo
[Upstash](https://upstash.com/)). Formato típico:
`rediss://usuario:password@host:puerto`.

> Si `REDIS_URL` no está configurada, el rate limiting queda **desactivado**
> (la app funciona igual en desarrollo, pero sin protección de fuerza bruta).

---

## Checklist

- [ ] `DATABASE_URL` y `DIRECT_URL` (Supabase)
- [ ] `NEXTAUTH_SECRET` (generado con `openssl`)
- [ ] `NEXTAUTH_URL` (`http://localhost:3000` en dev)
- [ ] `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- [ ] `LEMON_SQUEEZY_API_KEY` y `LEMON_SQUEEZY_WEBHOOK_SECRET`
- [ ] `MP_ACCESS_TOKEN`
- [ ] `RESEND_API_KEY`
- [ ] `REDIS_URL`

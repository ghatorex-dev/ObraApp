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
| **10** | **Fase 2 · Clientes e historial**: modelo `Cliente` (owner + N presupuestos); `Presupuesto.clienteId` opcional (snapshot suelto conservado). `/dashboard/clientes` (listado + buscador por nombre), `/dashboard/clientes/[id]` (detalle + historial de presupuestos), alta/edición (`ClienteForm`, server actions `crearCliente`/`actualizarCliente`). Selector de cliente existente + "Guardar como cliente nuevo" al crear presupuesto (`crearPresupuesto` resuelve/crea cliente). Link "Clientes" en el dashboard. **Migración PENDIENTE de correr por el usuario.** | `03cd7af` |
| **11** | **Fase 2 · Inventario**: modelo `Material` (nombre, categoria [enum], unidad string, stockActual/stockMinimo Float, owner, `@@index([userId, categoria])`). `/dashboard/inventario` (agrupado por rubro, filtro por chips `?categoria=`, badge rojo "Stock bajo" cuando `stockActual <= stockMinimo`, ajuste rápido −/+ con cantidad editable), alta/edición/baja (`MaterialForm`, baja con confirmación de dos toques). Server actions `crearMaterial`/`actualizarMaterial`/`eliminarMaterial`/`ajustarStock` (Zod + pertenencia + auditoría; ajuste con piso en 0). Aviso de stock bajo en el dashboard (count con referencia de campo `prisma.material.fields.stockMinimo`) + link "Inventario" en el header. **SIN deducción automática de stock por presupuestos** (iteración futura). Migración `add_material` corrida y versionada por el usuario. | `6ce47f2` |
| **12** | **Fase 2 · Agenda/Turnos** (cierra Fase 2): modelo `Turno` (fecha/fechaFin?, titulo, estado String pendiente/confirmado/completado/cancelado, snapshot cliente nombre/email/tel, relaciones OPCIONALES a Cliente y Presupuesto con SetNull, `@@index([userId, fecha])`). `/dashboard/agenda` con **toggle lista/calendario**: lista de próximos turnos (badge por estado, cliente, link al presupuesto) y **calendario mensual propio** (grid de días lunes-domingo, punto en días con turnos, click en día lista sus turnos, navegación de mes) — sin librerías nuevas. Alta/edición en `/nuevo` y `/[id]/editar` (`TurnoForm` con selector de cliente y de presupuesto que precargan el snapshot, editable). "Agendar turno" desde el detalle del presupuesto (`?presupuestoId=` precarga todo). Cambio rápido de estado (`TurnoEstado`) con transiciones válidas (pendiente→confirmado→completado; cancelado desde pendiente/confirmado; finales inmutables). Server actions `crearTurno`/`actualizarTurno`/`cambiarEstadoTurno` (Zod + pertenencia + auditoría `turno.*`). **SIN notificaciones/recordatorios** (iteración futura). Migración `add_turno` corrida y versionada por el usuario. | `24f33b2` |
| **13** | **Fase 3 · Deducción automática de stock al firmar**: `ItemPresupuesto` +`materialId?` (SetNull) +`cantidadUsada?` (`@@index([materialId])`), `Material.itemsUsados`. Selector OPCIONAL de material + cantidad usada por tarea en el form de crear presupuesto (`crearPresupuesto` valida que el material sea del usuario). En `firmarPresupuesto`, al ganar la transición **enviado→firmado** (CAS atómico `updateMany where estado='enviado'`, count===1), descuenta `stockActual -= cantidadUsada` por cada ítem con material — **idempotente** (la transición ocurre una única vez, sin columna marcador). Stock insuficiente: baja hasta 0 (nunca negativo) + audit `material.deduccion_automatica {solicitado, descontado, deficit}` + queda con badge "Stock bajo" en inventario. Nunca bloquea la firma. Deducción secuencial (sin `$transaction`). Detalle del presupuesto muestra "Usa X <unidad> de <material>". Migración `add_item_material` corrida y versionada por el usuario. | `dc97048` |
| **14** | **Fase 3 · Tareas propias del usuario**: `TareaComunitaria` +`userId String?` (SetNull→Cascade con User) +`@@index([userId])`, `User.tareas`. `userId null` = comunitaria/global (las 20 del seed, para todos); con valor = tarea **propia**, visible solo para su dueño. El selector de `/dashboard/presupuestos/nuevo` filtra `where { activa, OR: [{userId:null},{userId:actual}] }`. Botón **"Agregar tarea nueva"** por rubro dentro del form (`AgregarTareaPropia`): mini-form (descripción + unidad + precio ref. opcional) → server action `crearTareaPropia` (Zod + `userId` + audit `tarea.crear_propia`) → la tarea queda **persistida (reutilizable)** y aparece al instante **auto-tildada** (estado `tareasExtra` + lista mergeada). Compatible con Módulo 13: una tarea propia se asocia igual a un `Material` (el ítem guarda snapshot, no FK a la tarea). Migración `add_tarea_propia` corrida y versionada por el usuario. | `4a87f50` |
| **15** | **Fase 2 · Banners de afiliados**: modelo `BannerAfiliado` (titulo, imagenUrl, linkDestino, `categoria Categoria?` [null=genérico], `activo` default true, `orden` Int, `@@index([activo,categoria,orden])`) — contenido **global** (sin userId), gestionado solo por admin. Sección **"Banners"** en `/admin` (`BannersAdmin`): alta/edición/activar-desactivar/borrar. Server actions `crearBanner`/`actualizarBanner`/`alternarActivoBanner`/`eliminarBanner` con **Zod** (`.url()` en ambas URLs), **re-verificación de admin contra la BD en cada action**, auditoría `banner.crear`/`actualizar`/`eliminar`. Visualización: server component `BannersAfiliados({ categorias? })` — activos por rubro del contexto + genéricos, ordenados por `orden`; **si no hay, devuelve null (estado vacío silencioso)**. Placements: genéricos en `/dashboard`, por rubro en el detalle del presupuesto. Links `target="_blank" rel="noopener noreferrer"`, `<img>` (CSP ya permite https). Sin tracking de clicks. **Migración PENDIENTE de correr por el usuario.** | `(este)` |

## Modelo de datos (Prisma)

Enum `Categoria` (plomeria, gas, albanileria, pintura). Modelos: `User`,
`Account`, `Session`, `VerificationToken`, `Presupuesto`, `ItemPresupuesto`,
`TareaComunitaria` (seed de 20), **`Cliente`** (Módulo 10).

Campos agregados en la migración del Módulo 2: `User.{plan (default "free"),
planExpiresAt, onboardingComplete (default false), country}` y
`Presupuesto.{esEjemplo (default false), clienteIp}`. Estados de `Presupuesto`:
`borrador | enviado | firmado | cancelado`.

**Módulo 10 (schema listo, migración pendiente):**
- `Cliente { id, nombre, telefono?, email?, direccion?, notas?, creadoAt,
  actualizadoAt, userId, user, presupuestos[] , @@index([userId]) }`.
- `User.clientes Cliente[]`.
- `Presupuesto.clienteId String?` + `cliente Cliente?
  @relation(onDelete: SetNull)` + `@@index([clienteId])`. Los campos
  `clienteNombre/clienteEmail/clienteTel` se **mantienen** como snapshot.

**Módulo 15 (schema listo, migración pendiente):**
- `BannerAfiliado { id, titulo, imagenUrl, linkDestino, categoria Categoria?,
  activo Boolean @default(true), orden Int @default(0), creadoAt,
  @@index([activo, categoria, orden]) }`. Global (sin relación a User). No hay
  cambios en otros modelos.

**Módulo 14 (schema listo, migración pendiente):**
- `TareaComunitaria` +`userId String?` +`user User? @relation(onDelete:
  Cascade)` +`@@index([userId])`. `User.tareas TareaComunitaria[]`. `userId
  null` = comunitaria/global; con valor = propia del usuario. Los ítems del
  presupuesto guardan snapshot (no FK a la tarea) → tareas propias fluyen
  idéntico a las comunitarias, sin tocar `crearPresupuesto` ni la deducción.

**Módulo 13 (schema listo, migración pendiente):**
- `ItemPresupuesto` +`materialId String?` +`material Material? @relation(SetNull)`
  +`cantidadUsada Float?` +`@@index([materialId])`. `Material.itemsUsados
  ItemPresupuesto[]`. 100% opcional: sin material, el ítem funciona igual.

**Módulo 12 (schema listo, migración pendiente):**
- `Turno { id, titulo, estado String @default("pendiente"), fecha DateTime,
  fechaFin DateTime?, notas?, clienteNombre?, clienteEmail?, clienteTel?,
  creadoAt, actualizadoAt, userId (Cascade), clienteId? (SetNull),
  presupuestoId? (SetNull), @@index([userId, fecha]) }`.
- Relaciones inversas: `User.turnos`, `Cliente.turnos`, `Presupuesto.turnos`.
- Estados como String (mismo patrón que `Presupuesto.estado`), validados por
  Zod; transiciones en `lib/estados-turno.ts`.

**Módulo 11 (schema listo, migración ya corrida y versionada):**
- `Material { id, nombre, categoria Categoria, unidad String, stockActual
  Float @default(0), stockMinimo Float @default(0), creadoAt, actualizadoAt,
  userId, user (Cascade), @@index([userId, categoria]) }`.
- `User.materiales Material[]`.
- Stocks en `Float` a propósito: las unidades incluyen metro/litro/kg
  (fraccionarios, ej: 2,5 m).

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
11. **Clientes (Módulo 10) con compatibilidad hacia atrás**: `Presupuesto.clienteId`
    es **nullable** → los presupuestos actuales quedan sin cliente asociado y
    siguen funcionando; no hay backfill. Los campos sueltos `clienteNombre/Email/Tel`
    se conservan como **snapshot histórico** (si cambia o se borra el cliente, el
    presupuesto viejo no cambia). `onDelete: SetNull` en `Presupuesto.cliente`:
    borrar un cliente NO borra sus presupuestos (pierden el link, conservan el
    snapshot). `telefono` del cliente es **opcional** (consistente con el
    `clienteTel` opcional del presupuesto). Al crear presupuesto, si viene
    `clienteId` el servidor verifica pertenencia y toma los datos del cliente como
    snapshot; si viene `guardarComoCliente` sin id, crea el cliente. La migración
    es 100% aditiva.
12. **Inventario (Módulo 11) solo manual**: sin deducción automática de stock al
    crear/enviar/firmar presupuestos (decisión explícita; iteración futura).
    `ajustarStock` lee y escribe en dos operaciones secuenciales (compatible con
    el pooler) con **piso en 0** (nunca stock negativo). Baja de material con
    confirmación de dos toques (sin modal). El count de stock bajo del dashboard
    compara columnas con **referencia de campo de Prisma**
    (`stockActual: { lte: prisma.material.fields.stockMinimo }`) — GA en Prisma 5.
    El filtro de categoría del listado va por query param (`?categoria=`) con
    Links server-side (sin estado de cliente).
13. **Agenda (Módulo 12) con fechas en hora local del navegador**: los turnos se
    guardan como `DateTime` (UTC en la BD); el formulario construye la fecha en
    hora local y toda la visualización (lista, calendario, agrupado por día) se
    hace en componentes cliente con la hora local del navegador → el usuario ve
    los turnos en su huso horario sin configurar nada. El calendario es un grid
    propio (semana lunes-domingo) sin dependencias nuevas. La "cancelación" de
    un turno es un cambio de estado (no hay borrado de turnos). Los estados
    finales (completado/cancelado) no tienen más transiciones.
14. **Deducción de stock (Módulo 13) idempotente por transición, sin marcador**:
    la deducción se dispara SOLO cuando `firmarPresupuesto` gana la transición
    `enviado→firmado` vía un CAS atómico (`updateMany where estado='enviado'` →
    `count===1`). Como esa transición ocurre exactamente una vez (y el UPDATE
    condicional es atómico, seguro contra dos firmas concurrentes), la deducción
    corre una única vez sin necesidad de una columna `deducidoAt`. Relación
    ItemPresupuesto↔Material por **campos directos** (un material por ítem), no
    tabla intermedia — YAGNI; si a futuro se necesitan varios materiales por
    ítem, ahí sí conviene `ItemPresupuestoMaterial`. Déficit: se descuenta hasta
    0 (patrón de `ajustarStock`), se audita `material.deduccion_automatica` con
    `{solicitado, descontado, deficit}` y el material queda con el badge "Stock
    bajo" existente. La deducción va en try/catch: nunca rompe la firma.

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

- **Módulo 15 (banners de afiliados)**: schema actualizado y **client de Prisma
  regenerado** (offline). `npx tsc --noEmit` y **build completo pasan** (28
  rutas). `/admin` y `/dashboard` verificadas: protegidas por el middleware (1
  redirect a `/login`, sin loop).
- **Migraciones 10–14 corridas y versionadas**: `add_cliente`, `add_material`,
  `add_turno`, `add_item_material` y `add_tarea_propia` están en
  `prisma/migrations/` y aplicadas.
- ⚠️ **Migración del Módulo 15 PENDIENTE de correr por el usuario** (ver comando
  abajo). Es aditiva (nueva tabla `BannerAfiliado`, nada más). Hasta correrla,
  `/admin` y las páginas con `BannersAfiliados` (`/dashboard`, detalle de
  presupuesto) fallarán en runtime porque la tabla no existe. Sin banners
  cargados, la sección de visualización no muestra nada (estado vacío
  silencioso).
- Módulos 1–9: migración previa aplicada, todo pusheado a
  `claude/obraapp-init-oms7y9`.

### Comando de migración del Módulo 15 (correr en tu máquina)

Detené el dev server primero (gotcha del lock de DLL en Windows), después:

```bash
npx -p dotenv-cli dotenv -e .env.local -- npx prisma migrate dev --name add_banner_afiliado
```

Es 100% aditiva (CREATE TABLE "BannerAfiliado" + índice), no destructiva, sin
backfill. Al terminar, reiniciá el dev server y **commiteá la carpeta de
migración** que se genera en `prisma/migrations/`.

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

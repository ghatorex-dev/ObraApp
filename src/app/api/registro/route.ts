import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { registroSchema } from "@/lib/validations";
import { rateLimit, obtenerIp } from "@/lib/rate-limit";
import { auditar } from "@/lib/audit-log";
import { COOKIE_REF, leerCookieReferido, resolverReferidorId } from "@/lib/referidos";

// POST /api/registro — crea una cuenta local con email y contraseña.
export async function POST(request: Request) {
  // Rate limiting: máximo 5 registros por IP cada 10 minutos.
  const ip = obtenerIp(request);
  const limite = await rateLimit(`registro:${ip}`, 5, 600);
  if (!limite.permitido) {
    auditar("ratelimit.bloqueo", { alcance: "registro", ip });
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en unos minutos." },
      { status: 429 },
    );
  }

  // Parseo del body.
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  // Validación con Zod.
  const parseo = registroSchema.safeParse(body);
  if (!parseo.success) {
    const primerError =
      parseo.error.issues[0]?.message ?? "Datos inválidos.";
    return NextResponse.json({ error: primerError }, { status: 400 });
  }
  const { nombre, email, password } = parseo.data;

  // Verificamos que el email no esté ya registrado.
  const existente = await prisma.user.findUnique({ where: { email } });
  if (existente) {
    return NextResponse.json(
      { error: "Ya existe una cuenta con ese email." },
      { status: 409 },
    );
  }

  // Hasheamos la contraseña antes de guardarla (nunca en texto plano).
  const hashedPassword = await bcrypt.hash(password, 12);

  // Programa de referidos: si el alta vino de un link ?ref=CODIGO, la cookie
  // (seteada por el middleware) trae el código. Resolvemos el referidor y lo
  // guardamos. Si el código es inválido o no existe, el registro NO se bloquea:
  // simplemente queda sin referidor. Cuenta nueva => no hay auto-referido posible.
  const codigoRef = leerCookieReferido();
  const referidoPorId = codigoRef
    ? await resolverReferidorId(codigoRef, "")
    : null;

  const creado = await prisma.user.create({
    data: {
      name: nombre,
      email,
      hashedPassword,
      ...(referidoPorId ? { referidoPorId } : {}),
    },
    select: { id: true },
  });
  auditar("registro", { userId: creado.id });
  if (referidoPorId) {
    auditar("referido.asignado", { userId: creado.id, referidorId: referidoPorId });
  }

  // La cookie ya se consumió: la limpiamos (best-effort).
  try {
    cookies().delete(COOKIE_REF);
  } catch {
    /* no crítico: la cookie expira sola por maxAge */
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { onboardingSchema } from "@/lib/validations";
import { rateLimit, obtenerIp } from "@/lib/rate-limit";
import { auditar } from "@/lib/audit-log";
import { sembrarPresupuestoEjemplo } from "@/lib/presupuesto-ejemplo";

// POST /api/onboarding — completa el onboarding (nombre + país), marca la
// cuenta como onboardingComplete y siembra un presupuesto de ejemplo.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  // Rate limiting suave por usuario.
  const ip = obtenerIp(request);
  const limite = await rateLimit(`onboarding:${userId}`, 10, 60);
  if (!limite.permitido) {
    auditar("ratelimit.bloqueo", { alcance: "onboarding", userId, ip });
    return NextResponse.json(
      { error: "Demasiados intentos. Probá de nuevo en un momento." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const parseo = onboardingSchema.safeParse(body);
  if (!parseo.success) {
    const primerError = parseo.error.issues[0]?.message ?? "Datos inválidos.";
    return NextResponse.json({ error: primerError }, { status: 400 });
  }
  const { nombre, pais } = parseo.data;

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: nombre, country: pais, onboardingComplete: true },
    });

    // Sembramos el presupuesto de ejemplo (idempotente).
    await sembrarPresupuestoEjemplo(userId);

    auditar("onboarding.completar", { userId, pais });
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Nunca exponemos el detalle del error al cliente.
    console.error("Error en onboarding:", error);
    return NextResponse.json(
      { error: "No pudimos guardar tus datos. Probá de nuevo." },
      { status: 500 },
    );
  }
}

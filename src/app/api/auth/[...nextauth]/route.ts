import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { rateLimit, obtenerIp } from "@/lib/rate-limit";

// Handler de NextAuth para el App Router.
const handler = NextAuth(authOptions);

// GET (sesión, csrf, proveedores, callbacks de OAuth) pasa directo.
export { handler as GET };

// POST (incluye los intentos de login por credenciales) con rate limiting:
// máximo 10 intentos por IP cada 5 minutos, para frenar fuerza bruta.
export async function POST(
  request: Request,
  contexto: { params: { nextauth: string[] } },
) {
  const ip = obtenerIp(request);
  const limite = await rateLimit(`auth:${ip}`, 10, 300);
  if (!limite.permitido) {
    return NextResponse.json(
      { error: "Demasiados intentos. Esperá unos minutos e intentá de nuevo." },
      { status: 429 },
    );
  }

  return handler(request, contexto);
}

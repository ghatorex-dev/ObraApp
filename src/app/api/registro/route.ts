import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

// Expresión simple para validar el formato del email.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/registro — crea una cuenta local con email y contraseña.
export async function POST(request: Request) {
  let datos: { nombre?: string; email?: string; password?: string };

  try {
    datos = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Solicitud inválida." },
      { status: 400 },
    );
  }

  const nombre = datos.nombre?.trim() ?? "";
  const email = datos.email?.toLowerCase().trim() ?? "";
  const password = datos.password ?? "";

  // Validaciones de los datos recibidos.
  if (!nombre) {
    return NextResponse.json(
      { error: "Ingresá tu nombre." },
      { status: 400 },
    );
  }
  if (!EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { error: "Ingresá un email válido." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "La contraseña debe tener al menos 8 caracteres." },
      { status: 400 },
    );
  }

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

  await prisma.user.create({
    data: {
      name: nombre,
      email,
      hashedPassword,
    },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

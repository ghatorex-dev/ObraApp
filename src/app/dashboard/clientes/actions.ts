"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clienteSchema, type ClienteInput } from "@/lib/validations";
import { auditar } from "@/lib/audit-log";

export type ClienteResultado =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Crea un cliente del usuario autenticado.
export async function crearCliente(
  input: ClienteInput,
): Promise<ClienteResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = clienteSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  const cliente = await prisma.cliente.create({
    data: {
      userId,
      nombre: d.nombre,
      telefono: d.telefono || null,
      email: d.email || null,
      direccion: d.direccion || null,
      notas: d.notas || null,
    },
    select: { id: true },
  });

  auditar("cliente.crear", { clienteId: cliente.id, userId });
  revalidatePath("/dashboard/clientes");
  return { ok: true, id: cliente.id };
}

// Actualiza un cliente existente (solo si pertenece al usuario).
export async function actualizarCliente(
  id: string,
  input: ClienteInput,
): Promise<ClienteResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = clienteSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  // updateMany con el userId en el where garantiza la pertenencia.
  const resultado = await prisma.cliente.updateMany({
    where: { id, userId },
    data: {
      nombre: d.nombre,
      telefono: d.telefono || null,
      email: d.email || null,
      direccion: d.direccion || null,
      notas: d.notas || null,
    },
  });

  if (resultado.count === 0) {
    return { ok: false, error: "Cliente no encontrado." };
  }

  auditar("cliente.actualizar", { clienteId: id, userId });
  revalidatePath("/dashboard/clientes");
  revalidatePath(`/dashboard/clientes/${id}`);
  return { ok: true, id };
}

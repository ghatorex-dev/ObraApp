"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearPresupuestoSchema, type CrearPresupuestoInput } from "@/lib/validations";

export type CrearPresupuestoResultado =
  | { ok: true; id: string; numero: number }
  | { ok: false; error: string };

// Crea un presupuesto con sus ítems. El número es autoincremental por
// usuario. El total y los subtotales se recalculan en el servidor: nunca se
// confía en los valores que manda el cliente. La entrada se valida con Zod.
export async function crearPresupuesto(
  input: CrearPresupuestoInput,
): Promise<CrearPresupuestoResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  // Validación con Zod.
  const parseo = crearPresupuestoSchema.safeParse(input);
  if (!parseo.success) {
    const primerError = parseo.error.issues[0]?.message ?? "Datos inválidos.";
    return { ok: false, error: primerError };
  }
  const datos = parseo.data;

  // Recalculamos subtotales y total en el servidor.
  const items = datos.items.map((item) => ({
    descripcion: item.descripcion,
    cantidad: item.cantidad,
    precioUnitario: item.precioUnitario,
    subtotal: item.cantidad * item.precioUnitario,
    categoria: item.categoria,
  }));
  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  // Transacción: número autoincremental por usuario + creación atómica.
  const presupuesto = await prisma.$transaction(async (tx) => {
    const ultimo = await tx.presupuesto.findFirst({
      where: { userId },
      orderBy: { numero: "desc" },
      select: { numero: true },
    });
    const numero = (ultimo?.numero ?? 0) + 1;

    return tx.presupuesto.create({
      data: {
        numero,
        titulo: datos.titulo,
        clienteNombre: datos.clienteNombre,
        clienteEmail: datos.clienteEmail || null,
        clienteTel: datos.clienteTel || null,
        notas: datos.notas || null,
        total,
        userId,
        items: { create: items },
      },
      select: { id: true, numero: true },
    });
  });

  return { ok: true, id: presupuesto.id, numero: presupuesto.numero };
}

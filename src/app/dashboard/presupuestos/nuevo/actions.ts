"use server";

import { getServerSession } from "next-auth";
import { Categoria } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Conjunto de rubros válidos para validar la entrada del cliente.
const RUBROS_VALIDOS = new Set<string>(Object.values(Categoria));

export type ItemInput = {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  categoria: string;
};

export type CrearPresupuestoInput = {
  titulo: string;
  clienteNombre: string;
  clienteEmail?: string;
  clienteTel?: string;
  items: ItemInput[];
};

export type CrearPresupuestoResultado =
  | { ok: true; id: string; numero: number }
  | { ok: false; error: string };

// Crea un presupuesto con sus ítems. El número es autoincremental por
// usuario. El total y los subtotales se recalculan en el servidor: nunca se
// confía en los valores que manda el cliente.
export async function crearPresupuesto(
  input: CrearPresupuestoInput,
): Promise<CrearPresupuestoResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const titulo = input.titulo?.trim() ?? "";
  const clienteNombre = input.clienteNombre?.trim() ?? "";

  if (!titulo) {
    return { ok: false, error: "Ingresá un título para el presupuesto." };
  }
  if (!clienteNombre) {
    return { ok: false, error: "Ingresá el nombre del cliente." };
  }
  if (!Array.isArray(input.items) || input.items.length === 0) {
    return { ok: false, error: "Agregá al menos una tarea al presupuesto." };
  }

  // Saneamos y validamos cada ítem.
  const items = input.items.map((item) => ({
    descripcion: item.descripcion?.trim() ?? "",
    cantidad: Number(item.cantidad),
    precioUnitario: Number(item.precioUnitario),
    categoria: item.categoria,
  }));

  for (const item of items) {
    if (!item.descripcion) {
      return { ok: false, error: "Hay una tarea sin descripción." };
    }
    if (!RUBROS_VALIDOS.has(item.categoria)) {
      return { ok: false, error: "Una de las tareas tiene un rubro inválido." };
    }
    if (!Number.isFinite(item.cantidad) || item.cantidad <= 0) {
      return { ok: false, error: "Revisá las cantidades: deben ser mayores a 0." };
    }
    if (!Number.isFinite(item.precioUnitario) || item.precioUnitario < 0) {
      return { ok: false, error: "Revisá los precios unitarios." };
    }
  }

  const total = items.reduce(
    (acumulado, item) => acumulado + item.cantidad * item.precioUnitario,
    0,
  );

  // Transacción: calculamos el próximo número del usuario y creamos el
  // presupuesto junto con sus ítems de forma atómica.
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
        titulo,
        clienteNombre,
        clienteEmail: input.clienteEmail?.trim() || null,
        clienteTel: input.clienteTel?.trim() || null,
        total,
        userId,
        items: {
          create: items.map((item) => ({
            descripcion: item.descripcion,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario,
            categoria: item.categoria as Categoria,
          })),
        },
      },
      select: { id: true, numero: true },
    });
  });

  return { ok: true, id: presupuesto.id, numero: presupuesto.numero };
}

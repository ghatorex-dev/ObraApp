"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  materialSchema,
  ajusteStockSchema,
  type MaterialInput,
} from "@/lib/validations";
import { auditar } from "@/lib/audit-log";

export type MaterialResultado =
  | { ok: true; id: string }
  | { ok: false; error: string };

export type AjusteResultado =
  | { ok: true; stockActual: number }
  | { ok: false; error: string };

// Crea un material del inventario del usuario autenticado.
export async function crearMaterial(
  input: MaterialInput,
): Promise<MaterialResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = materialSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  const material = await prisma.material.create({
    data: {
      userId,
      nombre: d.nombre,
      categoria: d.categoria,
      unidad: d.unidad,
      stockActual: d.stockActual,
      stockMinimo: d.stockMinimo,
    },
    select: { id: true },
  });

  auditar("material.crear", { materialId: material.id, userId });
  revalidatePath("/dashboard/inventario");
  return { ok: true, id: material.id };
}

// Actualiza un material existente (solo si pertenece al usuario).
export async function actualizarMaterial(
  id: string,
  input: MaterialInput,
): Promise<MaterialResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = materialSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  // updateMany con el userId en el where garantiza la pertenencia.
  const resultado = await prisma.material.updateMany({
    where: { id, userId },
    data: {
      nombre: d.nombre,
      categoria: d.categoria,
      unidad: d.unidad,
      stockActual: d.stockActual,
      stockMinimo: d.stockMinimo,
    },
  });

  if (resultado.count === 0) {
    return { ok: false, error: "Material no encontrado." };
  }

  auditar("material.actualizar", { materialId: id, userId });
  revalidatePath("/dashboard/inventario");
  return { ok: true, id };
}

// Elimina un material (solo si pertenece al usuario).
export async function eliminarMaterial(id: string): Promise<MaterialResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const resultado = await prisma.material.deleteMany({
    where: { id, userId },
  });

  if (resultado.count === 0) {
    return { ok: false, error: "Material no encontrado." };
  }

  auditar("material.eliminar", { materialId: id, userId });
  revalidatePath("/dashboard/inventario");
  return { ok: true, id };
}

// Ajuste rápido de stock: suma o resta `delta` al stock actual, sin bajar
// de 0. Verifica pertenencia y valida con Zod.
export async function ajustarStock(
  id: string,
  delta: number,
): Promise<AjusteResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = ajusteStockSchema.safeParse({ delta });
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Ajuste inválido.",
    };
  }

  // Leemos el material (verificando pertenencia) y calculamos el nuevo stock
  // con piso en 0. Dos operaciones secuenciales: compatible con el pooler.
  const material = await prisma.material.findFirst({
    where: { id, userId },
    select: { id: true, stockActual: true },
  });
  if (!material) {
    return { ok: false, error: "Material no encontrado." };
  }

  const nuevoStock = Math.max(0, material.stockActual + parseo.data.delta);

  await prisma.material.update({
    where: { id: material.id },
    data: { stockActual: nuevoStock },
  });

  auditar("material.ajustar", {
    materialId: id,
    userId,
    delta: parseo.data.delta,
    stockActual: nuevoStock,
  });
  revalidatePath("/dashboard/inventario");
  return { ok: true, stockActual: nuevoStock };
}

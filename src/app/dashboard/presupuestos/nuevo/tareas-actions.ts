"use server";

import { getServerSession } from "next-auth";
import type { Categoria } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { tareaPropiaSchema, type TareaPropiaInput } from "@/lib/validations";
import { auditar } from "@/lib/audit-log";

export type TareaPropia = {
  id: string;
  descripcion: string;
  unidad: string;
  precioRef: number | null;
  categoria: Categoria;
};

export type CrearTareaResultado =
  | { ok: true; tarea: TareaPropia }
  | { ok: false; error: string };

// Crea una tarea PROPIA del usuario (TareaComunitaria con userId). Queda
// disponible como reutilizable en el selector de creación de presupuestos,
// visible solo para su dueño. Devuelve la tarea para agregarla al form sin
// recargar.
export async function crearTareaPropia(
  input: TareaPropiaInput,
): Promise<CrearTareaResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = tareaPropiaSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  const tarea = await prisma.tareaComunitaria.create({
    data: {
      userId,
      descripcion: d.descripcion,
      unidad: d.unidad,
      categoria: d.categoria,
      precioRef: d.precioRef ?? null,
    },
    select: {
      id: true,
      descripcion: true,
      unidad: true,
      precioRef: true,
      categoria: true,
    },
  });

  auditar("tarea.crear_propia", { tareaId: tarea.id, userId });
  return { ok: true, tarea };
}

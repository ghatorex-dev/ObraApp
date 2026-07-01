"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { actualizarNombreSchema } from "@/lib/validations";
import { auditar } from "@/lib/audit-log";

// Actualiza el nombre del usuario autenticado.
export async function actualizarNombre(
  nombre: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "No autorizado." };

  const parseo = actualizarNombreSchema.safeParse({ nombre });
  if (!parseo.success) {
    const primerError = parseo.error.issues[0]?.message ?? "Datos inválidos.";
    return { ok: false, error: primerError };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { name: parseo.data.nombre },
    });
    auditar("config.actualizar", { userId });
    revalidatePath("/dashboard/configuracion");
    return { ok: true };
  } catch (error) {
    console.error("Error actualizando el nombre:", error);
    return { ok: false, error: "No se pudo guardar. Probá de nuevo." };
  }
}

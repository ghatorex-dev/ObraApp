"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditar } from "@/lib/audit-log";

// Genera un token de firma único e imposible de adivinar (doble UUID).
function generarTokenFirma(): string {
  return (
    randomUUID().replace(/-/g, "") + randomUUID().replace(/-/g, "")
  );
}

// Marca un presupuesto en borrador como "enviado" y genera su token de firma.
export async function enviarPresupuesto(
  id: string,
): Promise<{ ok: boolean; error?: string; token?: string }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "No autorizado." };

  const p = await prisma.presupuesto.findFirst({
    where: { id, userId },
    select: { id: true, estado: true, esEjemplo: true, tokenFirma: true },
  });
  if (!p) return { ok: false, error: "Presupuesto no encontrado." };
  if (p.esEjemplo) {
    return { ok: false, error: "El presupuesto de ejemplo no se puede enviar." };
  }
  if (p.estado !== "borrador") {
    return {
      ok: false,
      error: "Solo se pueden enviar presupuestos en borrador.",
    };
  }

  const token = p.tokenFirma ?? generarTokenFirma();
  await prisma.presupuesto.update({
    where: { id },
    data: { estado: "enviado", tokenFirma: token },
  });
  auditar("presupuesto.enviar", { presupuestoId: id, userId });
  revalidatePath(`/dashboard/presupuestos/${id}`);
  revalidatePath("/dashboard/presupuestos");
  return { ok: true, token };
}

// Elimina un presupuesto. Solo se permite si está en borrador (incluye el de
// ejemplo, que también es borrador). Los items se borran en cascada.
export async function eliminarPresupuesto(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "No autorizado." };

  const p = await prisma.presupuesto.findFirst({
    where: { id, userId },
    select: { id: true, estado: true },
  });
  if (!p) return { ok: false, error: "Presupuesto no encontrado." };
  if (p.estado !== "borrador") {
    return {
      ok: false,
      error: "Solo se pueden eliminar presupuestos en borrador.",
    };
  }

  await prisma.presupuesto.delete({ where: { id } });
  auditar("presupuesto.eliminar", { presupuestoId: id, userId });
  revalidatePath("/dashboard/presupuestos");
  return { ok: true };
}

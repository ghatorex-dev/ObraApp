"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esEmailAdmin } from "@/lib/admin";
import { auditar } from "@/lib/audit-log";

export type ComisionResultado = { ok: true } | { ok: false; error: string };

// Verifica que quien ejecuta la acción sea el admin, comprobando el email
// CONTRA LA BASE (no confiamos solo en la sesión). Devuelve el email o null.
async function verificarAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) return null;
  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!esEmailAdmin(usuario?.email)) return null;
  return usuario!.email;
}

const idSchema = z.object({ id: z.string().min(1, "Comisión inválida.") });

// Marca una comisión como PAGADA (guardando fechaPagada). El pago en sí es
// manual y fuera del sistema; acá solo dejamos constancia. Solo se puede pagar
// una comisión que está en estado "lista_para_pagar".
export async function marcarComisionPagada(
  id: string,
): Promise<ComisionResultado> {
  const emailAdmin = await verificarAdmin();
  if (!emailAdmin) {
    return { ok: false, error: "No autorizado." };
  }

  const parseo = idSchema.safeParse({ id });
  if (!parseo.success) {
    return { ok: false, error: parseo.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const res = await prisma.comision.updateMany({
    where: { id: parseo.data.id, estado: "lista_para_pagar" },
    data: { estado: "pagada", fechaPagada: new Date() },
  });
  if (res.count === 0) {
    return {
      ok: false,
      error: "La comisión no existe o no está lista para pagar.",
    };
  }

  auditar("comision.marcada_pagada", { comisionId: parseo.data.id, admin: emailAdmin });
  revalidatePath("/admin");
  revalidatePath("/dashboard");
  return { ok: true };
}

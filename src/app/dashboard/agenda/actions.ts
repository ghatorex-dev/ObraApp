"use server";

import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  turnoSchema,
  estadoTurnoSchema,
  type TurnoInput,
} from "@/lib/validations";
import { TRANSICIONES_TURNO } from "@/lib/estados-turno";
import { auditar } from "@/lib/audit-log";

export type TurnoResultado =
  | { ok: true; id: string }
  | { ok: false; error: string };

// Valida las asociaciones opcionales (cliente y presupuesto) verificando que
// pertenezcan al usuario. Devuelve un error legible o null si está todo bien.
async function verificarAsociaciones(
  userId: string,
  clienteId?: string,
  presupuestoId?: string,
): Promise<string | null> {
  if (clienteId) {
    const cliente = await prisma.cliente.findFirst({
      where: { id: clienteId, userId },
      select: { id: true },
    });
    if (!cliente) return "El cliente seleccionado no existe.";
  }
  if (presupuestoId) {
    const presupuesto = await prisma.presupuesto.findFirst({
      where: { id: presupuestoId, userId },
      select: { id: true },
    });
    if (!presupuesto) return "El presupuesto seleccionado no existe.";
  }
  return null;
}

// Crea un turno del usuario autenticado.
export async function crearTurno(input: TurnoInput): Promise<TurnoResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = turnoSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  const errorAsociacion = await verificarAsociaciones(
    userId,
    d.clienteId,
    d.presupuestoId,
  );
  if (errorAsociacion) return { ok: false, error: errorAsociacion };

  const turno = await prisma.turno.create({
    data: {
      userId,
      titulo: d.titulo,
      fecha: d.fecha,
      fechaFin: d.fechaFin ?? null,
      notas: d.notas || null,
      clienteNombre: d.clienteNombre || null,
      clienteEmail: d.clienteEmail || null,
      clienteTel: d.clienteTel || null,
      clienteId: d.clienteId || null,
      presupuestoId: d.presupuestoId || null,
    },
    select: { id: true },
  });

  auditar("turno.crear", { turnoId: turno.id, userId });
  revalidatePath("/dashboard/agenda");
  return { ok: true, id: turno.id };
}

// Actualiza un turno existente (solo si pertenece al usuario).
export async function actualizarTurno(
  id: string,
  input: TurnoInput,
): Promise<TurnoResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = turnoSchema.safeParse(input);
  if (!parseo.success) {
    return {
      ok: false,
      error: parseo.error.issues[0]?.message ?? "Datos inválidos.",
    };
  }
  const d = parseo.data;

  const errorAsociacion = await verificarAsociaciones(
    userId,
    d.clienteId,
    d.presupuestoId,
  );
  if (errorAsociacion) return { ok: false, error: errorAsociacion };

  // updateMany con el userId en el where garantiza la pertenencia.
  const resultado = await prisma.turno.updateMany({
    where: { id, userId },
    data: {
      titulo: d.titulo,
      fecha: d.fecha,
      fechaFin: d.fechaFin ?? null,
      notas: d.notas || null,
      clienteNombre: d.clienteNombre || null,
      clienteEmail: d.clienteEmail || null,
      clienteTel: d.clienteTel || null,
      clienteId: d.clienteId || null,
      presupuestoId: d.presupuestoId || null,
    },
  });

  if (resultado.count === 0) {
    return { ok: false, error: "Turno no encontrado." };
  }

  auditar("turno.actualizar", { turnoId: id, userId });
  revalidatePath("/dashboard/agenda");
  return { ok: true, id };
}

// Cambia el estado de un turno respetando las transiciones válidas
// (pendiente → confirmado → completado; cancelado desde pendiente/confirmado).
export async function cambiarEstadoTurno(
  id: string,
  nuevoEstado: string,
): Promise<TurnoResultado> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { ok: false, error: "Necesitás iniciar sesión." };
  }
  const userId = session.user.id;

  const parseo = estadoTurnoSchema.safeParse(nuevoEstado);
  if (!parseo.success) {
    return { ok: false, error: "Estado inválido." };
  }

  // Leemos el turno (verificando pertenencia) para validar la transición.
  const turno = await prisma.turno.findFirst({
    where: { id, userId },
    select: { id: true, estado: true },
  });
  if (!turno) {
    return { ok: false, error: "Turno no encontrado." };
  }

  const permitidas = TRANSICIONES_TURNO[turno.estado] ?? [];
  if (!permitidas.includes(parseo.data)) {
    return {
      ok: false,
      error: `No se puede pasar de "${turno.estado}" a "${parseo.data}".`,
    };
  }

  await prisma.turno.update({
    where: { id: turno.id },
    data: { estado: parseo.data },
  });

  auditar("turno.estado", {
    turnoId: id,
    userId,
    de: turno.estado,
    a: parseo.data,
  });
  revalidatePath("/dashboard/agenda");
  return { ok: true, id };
}

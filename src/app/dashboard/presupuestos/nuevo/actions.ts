"use server";

import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { crearPresupuestoSchema, type CrearPresupuestoInput } from "@/lib/validations";
import { verificarLimite } from "@/lib/plan";
import { auditar } from "@/lib/audit-log";

export type CrearPresupuestoResultado =
  | { ok: true; id: string; numero: number }
  // `limiteAlcanzado` indica que hay que mostrar el modal de upgrade.
  | { ok: false; error: string; limiteAlcanzado?: boolean };

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

  // Límite de plan: el plan Free permite 3 presupuestos por mes (sin contar el
  // de ejemplo). Si lo alcanzó, devolvemos el flag para mostrar el modal Pro.
  const limite = await verificarLimite(userId);
  if (!limite.permitido) {
    return {
      ok: false,
      error: `Alcanzaste el límite de ${limite.limite} presupuestos de este mes en el plan Free.`,
      limiteAlcanzado: true,
    };
  }

  // Resolución del cliente (opcional). El snapshot (clienteNombre/Email/Tel)
  // se guarda igual, mantenga o no asociación a un Cliente.
  let clienteId: string | null = null;
  let snapshotNombre = datos.clienteNombre;
  let snapshotEmail: string | null = datos.clienteEmail || null;
  let snapshotTel: string | null = datos.clienteTel || null;

  if (datos.clienteId) {
    // Cliente existente: verificamos que sea del usuario y tomamos sus datos.
    const cliente = await prisma.cliente.findFirst({
      where: { id: datos.clienteId, userId },
      select: { id: true, nombre: true, email: true, telefono: true },
    });
    if (!cliente) {
      return { ok: false, error: "El cliente seleccionado no existe." };
    }
    clienteId = cliente.id;
    snapshotNombre = cliente.nombre;
    snapshotEmail = cliente.email;
    snapshotTel = cliente.telefono;
  } else if (datos.guardarComoCliente) {
    // Cliente nuevo creado al momento de armar el presupuesto.
    const nuevo = await prisma.cliente.create({
      data: {
        userId,
        nombre: snapshotNombre,
        email: snapshotEmail,
        telefono: snapshotTel,
      },
      select: { id: true },
    });
    clienteId = nuevo.id;
    auditar("cliente.crear", { clienteId: nuevo.id, userId });
  }

  // Validamos que los materiales asociados a los ítems sean del usuario.
  // Traemos los ids válidos de una sola query y descartamos cualquier otro.
  const materialIdsPedidos = Array.from(
    new Set(
      datos.items
        .map((it) => it.materialId)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  let materialIdsValidos = new Set<string>();
  if (materialIdsPedidos.length > 0) {
    const materiales = await prisma.material.findMany({
      where: { id: { in: materialIdsPedidos }, userId },
      select: { id: true },
    });
    materialIdsValidos = new Set(materiales.map((m) => m.id));
    if (materialIdsValidos.size !== materialIdsPedidos.length) {
      return { ok: false, error: "Uno de los materiales no es válido." };
    }
  }

  // Recalculamos subtotales y total en el servidor. Guardamos la asociación
  // al material solo si es válido (del usuario) y trae cantidad usada.
  const items = datos.items.map((item) => {
    const usaMaterial =
      item.materialId != null &&
      materialIdsValidos.has(item.materialId) &&
      item.cantidadUsada != null;
    return {
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      subtotal: item.cantidad * item.precioUnitario,
      categoria: item.categoria,
      materialId: usaMaterial ? item.materialId! : null,
      cantidadUsada: usaMaterial ? item.cantidadUsada! : null,
    };
  });
  const total = items.reduce((acc, item) => acc + item.subtotal, 0);

  // Número autoincremental por usuario.
  //
  // NOTA: no usamos prisma.$transaction interactivo porque no es compatible
  // con el connection pooler de Supabase (pgbouncer, puerto 6543): las
  // transacciones interactivas mantienen una conexión a lo largo de varios
  // awaits y el pooler no lo garantiza ("Unable to start a transaction in
  // the given time"). Hacemos las operaciones de forma secuencial.
  //
  // El create con items anidados sí corre como una ÚNICA escritura (Prisma
  // la ejecuta en una transacción implícita de una sola operación), lo cual
  // es compatible con el pooler.
  const ultimo = await prisma.presupuesto.findFirst({
    where: { userId },
    orderBy: { numero: "desc" },
    select: { numero: true },
  });
  const numero = (ultimo?.numero ?? 0) + 1;

  const presupuesto = await prisma.presupuesto.create({
    data: {
      numero,
      titulo: datos.titulo,
      clienteNombre: snapshotNombre,
      clienteEmail: snapshotEmail,
      clienteTel: snapshotTel,
      clienteId,
      notas: datos.notas || null,
      total,
      userId,
      items: { create: items },
    },
    select: { id: true, numero: true },
  });

  auditar("presupuesto.crear", { presupuestoId: presupuesto.id, userId });

  return { ok: true, id: presupuesto.id, numero: presupuesto.numero };
}

// Programa de referidos de ObraApp.
//
// Modelo de negocio: un usuario existente trae usuarios nuevos con su link/código
// personal. Si un referido se registra con ese código, luego se hace Pro y se
// MANTIENE Pro durante 30 días (desde que se hizo Pro, sin caer a Free), el
// referidor gana una comisión ÚNICA de USD 0.49 por ese referido.
//
// El pago es MANUAL (el dueño paga por fuera del sistema y lo marca como pagado
// desde /admin). Acá solo se calcula el ESTADO de cada comisión.
//
// No hay cron ni infraestructura nueva: la reconciliación es PEREZOSA, se dispara
// al visitar el dashboard (para el usuario) y /admin (para todas). Como nadie
// setea plan="pro" automáticamente (la conversión a Pro es manual), la detección
// de "se hizo Pro" también es perezosa.
//
// Todas las operaciones son secuenciales (sin $transaction interactiva por la
// restricción de pgbouncer) y van envueltas en try/catch: esta lógica NUNCA debe
// romper el render de una página ni el flujo de auth/registro.

import { cookies } from "next/headers";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { esProActivo } from "@/lib/plan";
import { auditar } from "@/lib/audit-log";

// Monto de la comisión (guardado en cada fila, no hardcodeado en la lógica).
export const MONTO_COMISION_USD = 0.49;
// Días que el referido debe mantenerse Pro para que la comisión se libere.
export const DIAS_COMISIONABLE = 30;
// Nombre de la cookie de corta duración que transporta el código de referido
// desde /registro?ref=CODIGO hasta el momento del alta (credenciales o Google).
export const COOKIE_REF = "ref_obraapp";

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L) para códigos legibles.
const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const LARGO_CODIGO = 8;
// Largo máximo aceptado al leer un código externo (cookie o querystring).
const LARGO_MAX_CODIGO = 16;

// Genera un código alfanumérico corto y aleatorio.
export function generarCodigo(): string {
  let codigo = "";
  for (let i = 0; i < LARGO_CODIGO; i++) {
    codigo += ALFABETO[Math.floor(Math.random() * ALFABETO.length)];
  }
  return codigo;
}

// Normaliza un código externo: solo alfanumérico, en mayúsculas y acotado.
function sanitizarCodigo(valor?: string | null): string | null {
  if (!valor) return null;
  const limpio = valor.replace(/[^A-Za-z0-9]/g, "").slice(0, LARGO_MAX_CODIGO).toUpperCase();
  return limpio || null;
}

// Lee el código de referido de la cookie (si existe), ya normalizado.
export function leerCookieReferido(): string | null {
  try {
    return sanitizarCodigo(cookies().get(COOKIE_REF)?.value);
  } catch {
    return null;
  }
}

// Borra la cookie de referido (best-effort). En un RSC de solo lectura esto
// lanza; lo atrapamos porque la cookie es de corta duración y expira sola.
function borrarCookieReferido(): void {
  try {
    cookies().delete(COOKIE_REF);
  } catch {
    /* en contexto de solo lectura no se puede borrar: expira por maxAge */
  }
}

// Resuelve el id del referidor a partir de un código. Devuelve null si el código
// es inválido, no existe, o pertenece al propio usuario (anti auto-referido).
export async function resolverReferidorId(
  codigo: string | null | undefined,
  excluirUserId: string,
): Promise<string | null> {
  try {
    const limpio = sanitizarCodigo(codigo);
    if (!limpio) return null;
    const referidor = await prisma.user.findUnique({
      where: { codigoReferido: limpio },
      select: { id: true },
    });
    if (!referidor) return null;
    // Anti-abuso: un usuario nunca puede referirse a sí mismo.
    if (referidor.id === excluirUserId) return null;
    return referidor.id;
  } catch {
    return null;
  }
}

// Garantiza que el usuario tenga un código propio (lo genera si falta).
// Se llama perezosamente en la primera visita al dashboard.
export async function asegurarCodigoReferido(userId: string): Promise<string | null> {
  try {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { codigoReferido: true },
    });
    if (usuario?.codigoReferido) return usuario.codigoReferido;

    // Reintentamos ante una colisión del unique (muy improbable).
    for (let intento = 0; intento < 5; intento++) {
      const codigo = generarCodigo();
      try {
        // updateMany con codigoReferido null: no pisa un código ya asignado
        // por una request concurrente.
        const res = await prisma.user.updateMany({
          where: { id: userId, codigoReferido: null },
          data: { codigoReferido: codigo },
        });
        if (res.count === 1) return codigo;
        // Otra request lo asignó en paralelo: lo leemos.
        const otra = await prisma.user.findUnique({
          where: { id: userId },
          select: { codigoReferido: true },
        });
        if (otra?.codigoReferido) return otra.codigoReferido;
      } catch {
        /* colisión de unique: reintentamos con otro código */
      }
    }
    return null;
  } catch {
    return null;
  }
}

// Asigna el referidor a partir de la cookie, SI el usuario todavía no tiene uno.
// Cubre el flujo de Google (events.createUser) y sirve de red de seguridad en el
// dashboard. Nunca lanza: el registro/login debe funcionar aunque el código sea
// inválido o no exista.
export async function asignarReferidorDesdeCookie(userId: string): Promise<void> {
  try {
    const codigo = leerCookieReferido();
    if (!codigo) return;

    const actual = await prisma.user.findUnique({
      where: { id: userId },
      select: { referidoPorId: true },
    });
    // Ya tiene referidor (o no existe): nada que hacer, limpiamos la cookie.
    if (!actual || actual.referidoPorId) {
      borrarCookieReferido();
      return;
    }

    const referidorId = await resolverReferidorId(codigo, userId);
    if (referidorId) {
      await prisma.user.update({
        where: { id: userId },
        data: { referidoPorId: referidorId },
      });
      auditar("referido.asignado", { userId, referidorId });
    }
    borrarCookieReferido();
  } catch {
    /* nunca rompemos el flujo de auth/registro por el programa de referidos */
  }
}

// Si el usuario se hizo Pro y fue referido por alguien, genera la comisión
// "pendiente" con fechaComisionable = hoy + 30 días. Por el @@unique([referidoId]),
// es UNA SOLA comisión por referido para siempre: si ya existe (aunque esté
// cancelada), no se vuelve a generar.
export async function generarComisionSiCorresponde(userId: string): Promise<void> {
  try {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { referidoPorId: true, plan: true, planExpiresAt: true },
    });
    if (!usuario || !usuario.referidoPorId) return;
    if (!esProActivo(usuario)) return;

    // ¿Ya hay una comisión para este referido? (única para siempre).
    const existe = await prisma.comision.findUnique({
      where: { referidoId: userId },
      select: { id: true },
    });
    if (existe) return;

    const fechaComisionable = new Date(
      Date.now() + DIAS_COMISIONABLE * 24 * 60 * 60 * 1000,
    );
    try {
      const comision = await prisma.comision.create({
        data: {
          referidorId: usuario.referidoPorId,
          referidoId: userId,
          monto: MONTO_COMISION_USD,
          estado: "pendiente",
          fechaComisionable,
        },
        select: { id: true },
      });
      auditar("comision.generada", {
        comisionId: comision.id,
        referidorId: usuario.referidoPorId,
        referidoId: userId,
      });
    } catch {
      /* carrera: el unique([referidoId]) ya la creó en paralelo */
    }
  } catch {
    /* nunca rompemos el render por esto */
  }
}

// Reconciliación perezosa de comisiones "pendiente" que ya cumplieron su plazo.
// Evaluamos en UN SOLO punto (fechaComisionable) para no cancelar antes de tiempo
// si el referido cae a Free y vuelve: recién al día 30 se decide.
//   - Referido sigue Pro  -> lista_para_pagar
//   - Referido NO es Pro  -> cancelada (y por la regla, no se regenera nunca)
export async function revisarComisionesPendientes(
  where: Prisma.ComisionWhereInput = {},
): Promise<void> {
  try {
    const pendientes = await prisma.comision.findMany({
      where: {
        ...where,
        estado: "pendiente",
        fechaComisionable: { lte: new Date() },
      },
      select: { id: true, referidoId: true },
    });

    for (const comision of pendientes) {
      const referido = await prisma.user.findUnique({
        where: { id: comision.referidoId },
        select: { plan: true, planExpiresAt: true },
      });
      const sigueProActivo = referido ? esProActivo(referido) : false;

      if (sigueProActivo) {
        const res = await prisma.comision.updateMany({
          where: { id: comision.id, estado: "pendiente" },
          data: { estado: "lista_para_pagar" },
        });
        if (res.count === 1) auditar("comision.lista", { comisionId: comision.id });
      } else {
        const res = await prisma.comision.updateMany({
          where: { id: comision.id, estado: "pendiente" },
          data: { estado: "cancelada" },
        });
        if (res.count === 1) auditar("comision.cancelada", { comisionId: comision.id });
      }
    }
  } catch {
    /* la reconciliación nunca debe romper el render */
  }
}

// Orquesta todo lo perezoso para el usuario actual al entrar al dashboard:
//  1. Asegura el referidor desde la cookie (red de seguridad para Google).
//  2. Asegura que tenga su propio código de referido.
//  3. Genera la comisión si recién se hizo Pro.
//  4. Reconcilia las comisiones que lo involucran (ganadas y generada).
export async function procesarReferidos(userId: string): Promise<void> {
  try {
    await asignarReferidorDesdeCookie(userId);
    await asegurarCodigoReferido(userId);
    await generarComisionSiCorresponde(userId);
    await revisarComisionesPendientes({
      OR: [{ referidorId: userId }, { referidoId: userId }],
    });
  } catch {
    /* nunca rompemos el dashboard por el programa de referidos */
  }
}

// Reconcilia TODAS las comisiones pendientes vencidas. La usa /admin para que el
// dueño siempre vea la lista actualizada, aunque el referido no vuelva a entrar.
export async function reconciliarTodasPendientes(): Promise<void> {
  await revisarComisionesPendientes({});
}

export type ResumenComisiones = {
  cantidadReferidos: number;
  pendientes: number;
  listasParaPagar: number;
  pagadas: number;
  montoPorCobrar: number; // suma de montos en lista_para_pagar
  montoCobrado: number; // suma de montos ya pagados
  totalAcumulado: number; // montoPorCobrar + montoCobrado (ganado confirmado)
};

// Resumen de las comisiones que GANÓ este usuario (como referidor), para el
// dashboard. No dispara reconciliación (se hace antes en procesarReferidos).
export async function resumenComisiones(userId: string): Promise<ResumenComisiones> {
  const [porEstado, cantidadReferidos] = await Promise.all([
    prisma.comision.groupBy({
      by: ["estado"],
      where: { referidorId: userId },
      _count: { _all: true },
      _sum: { monto: true },
    }),
    prisma.user.count({ where: { referidoPorId: userId } }),
  ]);

  const mapa = new Map(
    porEstado.map((g) => [
      g.estado,
      { cantidad: g._count._all, monto: g._sum.monto ?? 0 },
    ]),
  );
  const dato = (estado: string) => mapa.get(estado) ?? { cantidad: 0, monto: 0 };

  const montoPorCobrar = dato("lista_para_pagar").monto;
  const montoCobrado = dato("pagada").monto;

  return {
    cantidadReferidos,
    pendientes: dato("pendiente").cantidad,
    listasParaPagar: dato("lista_para_pagar").cantidad,
    pagadas: dato("pagada").cantidad,
    montoPorCobrar,
    montoCobrado,
    totalAcumulado: montoPorCobrar + montoCobrado,
  };
}

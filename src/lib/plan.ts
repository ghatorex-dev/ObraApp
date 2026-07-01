import { prisma } from "@/lib/prisma";

// Reglas de planes.
export const LIMITE_FREE_MENSUAL = 3; // presupuestos por mes en el plan Free
export const PRECIO_PRO_USD = 4.99;

// Primer día del mes actual (para contar los presupuestos del mes).
function inicioDeMes(): Date {
  const ahora = new Date();
  return new Date(ahora.getFullYear(), ahora.getMonth(), 1);
}

// Indica si el usuario tiene el plan Pro vigente.
export function esProActivo(usuario: {
  plan: string;
  planExpiresAt: Date | null;
}): boolean {
  if (usuario.plan !== "pro") return false;
  if (!usuario.planExpiresAt) return true; // Pro sin vencimiento
  return usuario.planExpiresAt.getTime() > Date.now();
}

// Cantidad de presupuestos creados este mes, SIN contar el de ejemplo.
export async function contarPresupuestosDelMes(userId: string): Promise<number> {
  return prisma.presupuesto.count({
    where: {
      userId,
      esEjemplo: false,
      creadoAt: { gte: inicioDeMes() },
    },
  });
}

export type ResultadoLimite = {
  permitido: boolean;
  plan: "free" | "pro";
  cantidad: number;
  limite: number;
};

// Verifica si el usuario puede crear un presupuesto según su plan.
// - Pro vigente: siempre permitido (ilimitado).
// - Free: hasta LIMITE_FREE_MENSUAL por mes (sin contar el de ejemplo).
export async function verificarLimite(userId: string): Promise<ResultadoLimite> {
  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planExpiresAt: true },
  });

  if (usuario && esProActivo(usuario)) {
    return { permitido: true, plan: "pro", cantidad: 0, limite: Infinity };
  }

  const cantidad = await contarPresupuestosDelMes(userId);
  return {
    permitido: cantidad < LIMITE_FREE_MENSUAL,
    plan: "free",
    cantidad,
    limite: LIMITE_FREE_MENSUAL,
  };
}

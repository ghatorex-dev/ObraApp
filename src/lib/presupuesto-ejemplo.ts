import { prisma } from "@/lib/prisma";

// Siembra UN presupuesto de ejemplo para un usuario nuevo (en el onboarding).
// - numero 0 y esEjemplo=true: no cuenta para el límite del plan Free y no se
//   puede descargar en PDF. Es eliminable como cualquier presupuesto.
// - Idempotente: si el usuario ya tiene algún presupuesto, no crea otro.
export async function sembrarPresupuestoEjemplo(userId: string): Promise<void> {
  const existentes = await prisma.presupuesto.count({ where: { userId } });
  if (existentes > 0) return;

  // Ítems de muestra de dos rubros distintos, para que se vea el agrupado.
  const items = [
    {
      descripcion: "Instalación de grifería de cocina",
      cantidad: 1,
      precioUnitario: 18000,
      categoria: "plomeria" as const,
    },
    {
      descripcion: "Reparación de pérdida de agua",
      cantidad: 2,
      precioUnitario: 16000,
      categoria: "plomeria" as const,
    },
    {
      descripcion: "Pintura de pared interior (látex)",
      cantidad: 20,
      precioUnitario: 2500,
      categoria: "pintura" as const,
    },
  ];
  const itemsConSubtotal = items.map((i) => ({
    ...i,
    subtotal: i.cantidad * i.precioUnitario,
  }));
  const total = itemsConSubtotal.reduce((suma, i) => suma + i.subtotal, 0);

  await prisma.presupuesto.create({
    data: {
      numero: 0,
      titulo: "Presupuesto de ejemplo",
      clienteNombre: "Cliente de ejemplo",
      estado: "borrador",
      esEjemplo: true,
      total,
      notas:
        "Este es un presupuesto de ejemplo para que veas cómo se ve. " +
        "Podés eliminarlo cuando quieras.",
      userId,
      items: { create: itemsConSubtotal },
    },
  });
}

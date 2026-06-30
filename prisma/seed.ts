import { PrismaClient, type Prisma } from "@prisma/client";

// Seed del catálogo comunitario de tareas de referencia (TareaComunitaria).
// Carga ~5 tareas por cada una de las 4 categorías, con precios de
// referencia en pesos argentinos (valores razonables para 2024).
// Ejecutar con: npx prisma db seed

const prisma = new PrismaClient();

const tareas: Prisma.TareaComunitariaCreateManyInput[] = [
  // ----------------------------- Electricidad -----------------------------
  {
    descripcion: "Instalación de boca de toma corriente",
    unidad: "unidad",
    precioRef: 12000,
    categoria: "electricidad",
  },
  {
    descripcion: "Tendido de cableado para circuito nuevo",
    unidad: "m lineal",
    precioRef: 2500,
    categoria: "electricidad",
  },
  {
    descripcion: "Instalación de tablero eléctrico con térmica y disyuntor",
    unidad: "unidad",
    precioRef: 85000,
    categoria: "electricidad",
  },
  {
    descripcion: "Colocación de artefacto de iluminación",
    unidad: "unidad",
    precioRef: 9000,
    categoria: "electricidad",
  },
  {
    descripcion: "Revisión y diagnóstico de instalación eléctrica",
    unidad: "hora",
    precioRef: 15000,
    categoria: "electricidad",
  },

  // ------------------------------- Plomería -------------------------------
  {
    descripcion: "Instalación de grifería de cocina o baño",
    unidad: "unidad",
    precioRef: 18000,
    categoria: "plomeria",
  },
  {
    descripcion: "Destapación de cañería con sonda",
    unidad: "unidad",
    precioRef: 25000,
    categoria: "plomeria",
  },
  {
    descripcion: "Cambio de flexible o conexión de agua",
    unidad: "unidad",
    precioRef: 8000,
    categoria: "plomeria",
  },
  {
    descripcion: "Instalación de inodoro con mochila",
    unidad: "unidad",
    precioRef: 35000,
    categoria: "plomeria",
  },
  {
    descripcion: "Reparación de pérdida de agua",
    unidad: "hora",
    precioRef: 16000,
    categoria: "plomeria",
  },

  // --------------------------------- Gas ----------------------------------
  {
    descripcion: "Instalación de cocina a gas",
    unidad: "unidad",
    precioRef: 40000,
    categoria: "gas",
  },
  {
    descripcion: "Prueba de hermeticidad de instalación de gas",
    unidad: "unidad",
    precioRef: 30000,
    categoria: "gas",
  },
  {
    descripcion: "Instalación de calefón o termotanque",
    unidad: "unidad",
    precioRef: 55000,
    categoria: "gas",
  },
  {
    descripcion: "Cambio de flexible de gas homologado",
    unidad: "unidad",
    precioRef: 12000,
    categoria: "gas",
  },
  {
    descripcion: "Detección de fugas de gas",
    unidad: "hora",
    precioRef: 18000,
    categoria: "gas",
  },

  // ----------------------------- Albañilería ------------------------------
  {
    descripcion: "Revoque grueso y fino de pared",
    unidad: "m2",
    precioRef: 9000,
    categoria: "albanileria",
  },
  {
    descripcion: "Colocación de cerámica o porcelanato en piso",
    unidad: "m2",
    precioRef: 12000,
    categoria: "albanileria",
  },
  {
    descripcion: "Levantamiento de pared de ladrillo",
    unidad: "m2",
    precioRef: 15000,
    categoria: "albanileria",
  },
  {
    descripcion: "Ejecución de contrapiso",
    unidad: "m2",
    precioRef: 8000,
    categoria: "albanileria",
  },
  {
    descripcion: "Mano de obra general de albañilería",
    unidad: "hora",
    precioRef: 9000,
    categoria: "albanileria",
  },
];

async function main() {
  console.log("Sembrando catálogo de tareas comunitarias…");

  // Limpiamos el catálogo para que el seed sea idempotente (re-ejecutable
  // sin generar duplicados). Solo afecta a TareaComunitaria.
  await prisma.tareaComunitaria.deleteMany({});

  const resultado = await prisma.tareaComunitaria.createMany({
    data: tareas,
  });

  console.log(`Listo: se cargaron ${resultado.count} tareas comunitarias.`);
}

main()
  .catch((error) => {
    console.error("Error al sembrar el catálogo:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

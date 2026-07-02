import { z } from "zod";

// Esquemas de validación (Zod) usados en los endpoints y server actions.

// Rubros válidos (deben coincidir con el enum Categoria de Prisma).
export const rubroSchema = z.enum(["plomeria", "gas", "albanileria", "pintura"]);

// Registro de usuario: nombre, email y contraseña (mínimo 8 caracteres).
export const registroSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá tu nombre.").max(120),
  email: z.string().trim().toLowerCase().email("Ingresá un email válido."),
  password: z
    .string()
    .min(8, "La contraseña debe tener al menos 8 caracteres.")
    .max(100),
});
export type RegistroInput = z.infer<typeof registroSchema>;

// Onboarding (1 paso): nombre completo y país.
export const onboardingSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá tu nombre completo.").max(120),
  pais: z.string().trim().min(1, "Elegí tu país.").max(80),
});
export type OnboardingInput = z.infer<typeof onboardingSchema>;

// Actualización del nombre desde Configuración.
export const actualizarNombreSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá tu nombre.").max(120),
});

// Login por credenciales.
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

// Ítem de un presupuesto.
export const itemPresupuestoSchema = z
  .object({
    descripcion: z.string().trim().min(1, "La tarea necesita una descripción."),
    cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
    precioUnitario: z.coerce
      .number()
      .min(0, "El precio no puede ser negativo."),
    categoria: rubroSchema,
    // Asociación OPCIONAL a un material del inventario para descontar stock al
    // firmar. El servidor verifica que el material sea del usuario.
    materialId: z.string().optional(),
    cantidadUsada: z.coerce
      .number()
      .positive("La cantidad usada debe ser mayor a 0.")
      .optional(),
  })
  // Si hay material, la cantidad usada es obligatoria (y viceversa).
  .refine((it) => !it.materialId || it.cantidadUsada != null, {
    message: "Indicá cuánto material se usa.",
    path: ["cantidadUsada"],
  });

// Creación de un presupuesto completo.
export const crearPresupuestoSchema = z.object({
  titulo: z.string().trim().min(1, "Ingresá un título.").max(160),
  clienteNombre: z
    .string()
    .trim()
    .min(1, "Ingresá el nombre del cliente.")
    .max(120),
  // El email del cliente es opcional. Normalizamos vacío o solo espacios a
  // undefined ANTES de validar el formato, así "", "   " o ausente no dan
  // error; solo se valida el formato cuando realmente hay un email.
  clienteEmail: z.preprocess(
    (valor) =>
      typeof valor === "string" && valor.trim() === "" ? undefined : valor,
    z
      .string()
      .trim()
      .toLowerCase()
      .email("Email de cliente inválido.")
      .optional(),
  ),
  clienteTel: z.string().trim().max(40).optional().or(z.literal("")),
  notas: z.string().trim().max(2000).optional().or(z.literal("")),
  // Asociación OPCIONAL a un cliente existente. Si viene, el servidor verifica
  // que pertenezca al usuario y toma sus datos como snapshot.
  clienteId: z.string().optional(),
  // Si es true y no hay clienteId, se crea un cliente nuevo con estos datos.
  guardarComoCliente: z.boolean().optional(),
  items: z
    .array(itemPresupuestoSchema)
    .min(1, "Agregá al menos una tarea al presupuesto."),
});
export type CrearPresupuestoInput = z.infer<typeof crearPresupuestoSchema>;

// Alta / edición de un cliente. Solo el nombre es obligatorio.
export const clienteSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre del cliente.").max(120),
  telefono: z.string().trim().max(40).optional().or(z.literal("")),
  // Email opcional: normalizamos vacío/espacios a undefined antes de validar.
  email: z.preprocess(
    (valor) =>
      typeof valor === "string" && valor.trim() === "" ? undefined : valor,
    z.string().trim().toLowerCase().email("Email inválido.").optional(),
  ),
  direccion: z.string().trim().max(200).optional().or(z.literal("")),
  notas: z.string().trim().max(2000).optional().or(z.literal("")),
});
export type ClienteInput = z.infer<typeof clienteSchema>;

// Alta / edición de un material del inventario.
export const materialSchema = z.object({
  nombre: z.string().trim().min(1, "Ingresá el nombre del material.").max(120),
  categoria: rubroSchema,
  unidad: z
    .string()
    .trim()
    .min(1, "Ingresá la unidad (ej: unidad, metro, litro, kg).")
    .max(30),
  stockActual: z.coerce
    .number({ invalid_type_error: "El stock debe ser un número." })
    .min(0, "El stock no puede ser negativo."),
  stockMinimo: z.coerce
    .number({ invalid_type_error: "El stock mínimo debe ser un número." })
    .min(0, "El stock mínimo no puede ser negativo."),
});
export type MaterialInput = z.infer<typeof materialSchema>;

// Ajuste rápido de stock: cantidad a sumar (positiva) o restar (negativa).
export const ajusteStockSchema = z.object({
  delta: z.coerce
    .number({ invalid_type_error: "El ajuste debe ser un número." })
    .refine((v) => v !== 0, "El ajuste no puede ser 0."),
});

// Alta / edición de un turno de la agenda. Las fechas llegan como ISO string
// desde el cliente y se convierten a Date.
export const turnoSchema = z
  .object({
    titulo: z.string().trim().min(1, "Ingresá un título.").max(160),
    fecha: z.coerce.date({
      errorMap: () => ({ message: "Ingresá una fecha y hora válidas." }),
    }),
    // Fin opcional; si viene, debe ser posterior al inicio.
    fechaFin: z.coerce
      .date({ errorMap: () => ({ message: "Hora de fin inválida." }) })
      .optional()
      .nullable(),
    notas: z.string().trim().max(2000).optional().or(z.literal("")),
    // Snapshot suelto del cliente (todo opcional: turno suelto válido).
    clienteNombre: z.string().trim().max(120).optional().or(z.literal("")),
    clienteEmail: z.preprocess(
      (valor) =>
        typeof valor === "string" && valor.trim() === "" ? undefined : valor,
      z.string().trim().toLowerCase().email("Email inválido.").optional(),
    ),
    clienteTel: z.string().trim().max(40).optional().or(z.literal("")),
    // Asociaciones opcionales (el servidor verifica pertenencia).
    clienteId: z.string().optional(),
    presupuestoId: z.string().optional(),
  })
  .refine(
    (datos) => !datos.fechaFin || datos.fechaFin > datos.fecha,
    { message: "La hora de fin debe ser posterior al inicio.", path: ["fechaFin"] },
  );
export type TurnoInput = z.infer<typeof turnoSchema>;

// Estados válidos de un turno (las transiciones se validan en la action).
export const estadoTurnoSchema = z.enum([
  "pendiente",
  "confirmado",
  "completado",
  "cancelado",
]);

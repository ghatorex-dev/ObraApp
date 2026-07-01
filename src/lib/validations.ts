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
export const itemPresupuestoSchema = z.object({
  descripcion: z.string().trim().min(1, "La tarea necesita una descripción."),
  cantidad: z.coerce.number().positive("La cantidad debe ser mayor a 0."),
  precioUnitario: z.coerce
    .number()
    .min(0, "El precio no puede ser negativo."),
  categoria: rubroSchema,
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

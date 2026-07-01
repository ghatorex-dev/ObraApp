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
  clienteEmail: z
    .string()
    .trim()
    .toLowerCase()
    .email("Email de cliente inválido.")
    .optional()
    .or(z.literal("")),
  clienteTel: z.string().trim().max(40).optional().or(z.literal("")),
  notas: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z
    .array(itemPresupuestoSchema)
    .min(1, "Agregá al menos una tarea al presupuesto."),
});
export type CrearPresupuestoInput = z.infer<typeof crearPresupuestoSchema>;

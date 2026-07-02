// Estados de un turno de la agenda, con etiqueta y clases (texto Y fondo
// explícitos) para los badges, y las transiciones válidas entre estados.

export const ESTADOS_TURNO: Record<
  string,
  { etiqueta: string; clase: string }
> = {
  pendiente: {
    etiqueta: "Pendiente",
    clase: "bg-muted text-muted-foreground",
  },
  confirmado: {
    etiqueta: "Confirmado",
    clase: "bg-primary/10 text-primary",
  },
  completado: {
    etiqueta: "Completado",
    clase: "bg-green-100 text-green-800",
  },
  cancelado: {
    etiqueta: "Cancelado",
    clase: "bg-destructive/10 text-destructive",
  },
};

export function estiloEstadoTurno(estado: string) {
  return ESTADOS_TURNO[estado] ?? ESTADOS_TURNO.pendiente;
}

// Transiciones válidas: pendiente → confirmado → completado; cancelado se
// puede desde pendiente o confirmado. Completado y cancelado son finales.
export const TRANSICIONES_TURNO: Record<string, string[]> = {
  pendiente: ["confirmado", "cancelado"],
  confirmado: ["completado", "cancelado"],
  completado: [],
  cancelado: [],
};

// Etiqueta de la acción que lleva a cada estado (para los botones).
export const ACCION_ESTADO_TURNO: Record<string, string> = {
  confirmado: "Confirmar",
  completado: "Completar",
  cancelado: "Cancelar",
};

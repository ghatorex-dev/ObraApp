// Etiqueta y clases (texto Y fondo explícitos) de cada estado de un
// presupuesto. Usado en el listado y el detalle.
export const ESTADOS_PRESUPUESTO: Record<
  string,
  { etiqueta: string; clase: string }
> = {
  borrador: {
    etiqueta: "Borrador",
    clase: "bg-muted text-muted-foreground",
  },
  enviado: {
    etiqueta: "Enviado",
    clase: "bg-primary/10 text-primary",
  },
  firmado: {
    etiqueta: "Firmado",
    clase: "bg-green-100 text-green-800",
  },
  cancelado: {
    etiqueta: "Cancelado",
    clase: "bg-destructive/10 text-destructive",
  },
};

export function estiloEstado(estado: string) {
  return ESTADOS_PRESUPUESTO[estado] ?? ESTADOS_PRESUPUESTO.borrador;
}

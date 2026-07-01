import type { Categoria } from "@prisma/client";

// Rubros (categorías de oficio) admitidos, con su etiqueta en español y el
// orden en que se muestran en la interfaz.
export const CATEGORIAS: { valor: Categoria; etiqueta: string }[] = [
  { valor: "plomeria", etiqueta: "Plomería" },
  { valor: "gas", etiqueta: "Gas" },
  { valor: "albanileria", etiqueta: "Albañilería" },
  { valor: "pintura", etiqueta: "Pintura" },
];

// Devuelve la etiqueta legible de un rubro.
export function etiquetaCategoria(valor: Categoria): string {
  return CATEGORIAS.find((c) => c.valor === valor)?.etiqueta ?? valor;
}

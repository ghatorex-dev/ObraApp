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

// Agrupa ítems por rubro respetando el orden de CATEGORIAS. Devuelve solo los
// rubros que tienen ítems, cada uno con su subtotal. Se usa en el detalle y en
// el PDF. `unRubro` es true cuando hay un único rubro (para omitir subtítulos).
export type GrupoRubro<T> = {
  categoria: Categoria;
  etiqueta: string;
  items: T[];
  subtotal: number;
};

export function agruparPorCategoria<
  T extends { categoria: Categoria; subtotal: number },
>(items: T[]): { grupos: GrupoRubro<T>[]; unRubro: boolean } {
  const grupos: GrupoRubro<T>[] = [];
  for (const cat of CATEGORIAS) {
    const delRubro = items.filter((i) => i.categoria === cat.valor);
    if (delRubro.length === 0) continue;
    grupos.push({
      categoria: cat.valor,
      etiqueta: cat.etiqueta,
      items: delRubro,
      subtotal: delRubro.reduce((suma, i) => suma + i.subtotal, 0),
    });
  }
  return { grupos, unRubro: grupos.length === 1 };
}

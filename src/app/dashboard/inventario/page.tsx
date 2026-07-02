import type { Metadata } from "next";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { AlertTriangle, ArrowLeft, Package, Pencil, Plus } from "lucide-react";
import type { Categoria } from "@prisma/client";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CATEGORIAS, etiquetaCategoria } from "@/lib/categorias";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AjusteStock } from "@/components/inventario/ajuste-stock";

export const metadata: Metadata = {
  title: "Inventario — ObraApp",
};

// Consulta la base en cada request: no se prerrenderiza.
export const dynamic = "force-dynamic";

// Valores válidos del filtro de categoría.
const RUBROS_VALIDOS = new Set(CATEGORIAS.map((c) => c.valor as string));

// Formatea el stock sin decimales innecesarios (2 -> "2", 2.5 -> "2,5").
function formatearStock(n: number): string {
  return new Intl.NumberFormat("es-AR", { maximumFractionDigits: 2 }).format(n);
}

export default async function InventarioPage({
  searchParams,
}: {
  searchParams: { categoria?: string };
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  // Filtro por categoría vía query param (?categoria=). Inválido = todos.
  const filtro =
    searchParams.categoria && RUBROS_VALIDOS.has(searchParams.categoria)
      ? (searchParams.categoria as Categoria)
      : null;

  const materiales = userId
    ? await prisma.material.findMany({
        where: { userId, ...(filtro ? { categoria: filtro } : {}) },
        orderBy: [{ categoria: "asc" }, { nombre: "asc" }],
      })
    : [];

  // Agrupamos por rubro respetando el orden de CATEGORIAS (nunca mezclados).
  const grupos = CATEGORIAS.map((cat) => ({
    ...cat,
    materiales: materiales.filter((m) => m.categoria === cat.valor),
  })).filter((g) => g.materiales.length > 0);

  const bajoStock = materiales.filter(
    (m) => m.stockActual <= m.stockMinimo,
  ).length;

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center gap-3 py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <span className="text-lg font-bold text-foreground">Inventario</span>
        </div>
      </header>

      <main className="container flex flex-col gap-4 py-6">
        {/* Filtro por rubro + alta */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant={filtro === null ? "default" : "outline"}
              size="sm"
              className={
                filtro === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-background text-foreground"
              }
            >
              <Link href="/dashboard/inventario">Todos</Link>
            </Button>
            {CATEGORIAS.map((c) => (
              <Button
                key={c.valor}
                asChild
                variant={filtro === c.valor ? "default" : "outline"}
                size="sm"
                className={
                  filtro === c.valor
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-foreground"
                }
              >
                <Link href={`/dashboard/inventario?categoria=${c.valor}`}>
                  {c.etiqueta}
                </Link>
              </Button>
            ))}
          </div>
          <Button asChild className="gap-2">
            <Link href="/dashboard/inventario/nuevo">
              <Plus className="h-4 w-4" />
              Nuevo material
            </Link>
          </Button>
        </div>

        {/* Aviso de stock bajo */}
        {bajoStock > 0 && (
          <p className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
            {bajoStock === 1
              ? "1 material con stock bajo."
              : `${bajoStock} materiales con stock bajo.`}
          </p>
        )}

        {/* Listado agrupado por rubro */}
        {materiales.length === 0 ? (
          <Card className="bg-card text-card-foreground">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <Package className="h-8 w-8 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                {filtro
                  ? `No tenés materiales de ${etiquetaCategoria(filtro).toLowerCase()}.`
                  : "Todavía no cargaste materiales."}
              </p>
              <Button asChild variant="outline" className="gap-2">
                <Link href="/dashboard/inventario/nuevo">
                  <Plus className="h-4 w-4" />
                  Cargar el primero
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          grupos.map((grupo) => (
            <section key={grupo.valor} className="flex flex-col gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {grupo.etiqueta}
              </h2>
              <ul className="flex flex-col gap-3">
                {grupo.materiales.map((m) => {
                  const stockBajo = m.stockActual <= m.stockMinimo;
                  return (
                    <li key={m.id}>
                      <Card className="bg-card text-card-foreground">
                        <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex min-w-0 flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="truncate text-sm font-medium text-foreground">
                                {m.nombre}
                              </span>
                              {stockBajo && (
                                <span className="rounded-full bg-destructive px-2 py-0.5 text-xs font-medium text-destructive-foreground">
                                  Stock bajo
                                </span>
                              )}
                            </div>
                            <span
                              className={`text-xs ${stockBajo ? "font-medium text-destructive" : "text-muted-foreground"}`}
                            >
                              {formatearStock(m.stockActual)} {m.unidad}
                              {" · mínimo "}
                              {formatearStock(m.stockMinimo)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-3 sm:justify-end">
                            <AjusteStock materialId={m.id} />
                            <Button
                              asChild
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-foreground"
                            >
                              <Link
                                href={`/dashboard/inventario/${m.id}/editar`}
                                aria-label={`Editar ${m.nombre}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

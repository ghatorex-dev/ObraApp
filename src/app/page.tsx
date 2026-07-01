import Link from "next/link";
import {
  FileText,
  PenLine,
  Users,
  Wrench,
  Flame,
  Hammer,
  Paintbrush,
  Check,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Footer } from "@/components/legal/footer";

// Rubros de ObraApp con su ícono (mismos que el enum Categoria).
const RUBROS = [
  { etiqueta: "Plomería", Icono: Wrench },
  { etiqueta: "Gas", Icono: Flame },
  { etiqueta: "Albañilería", Icono: Hammer },
  { etiqueta: "Pintura", Icono: Paintbrush },
];

const FUNCIONES = [
  {
    Icono: FileText,
    titulo: "Presupuestos rápidos",
    descripcion:
      "Cargá tareas e ítems por rubro y obtené el total al instante.",
  },
  {
    Icono: PenLine,
    titulo: "Firma digital",
    descripcion:
      "Tu cliente firma el presupuesto desde un enlace, sin instalar nada.",
  },
  {
    Icono: Users,
    titulo: "Precios de referencia",
    descripcion:
      "Catálogo comunitario de tareas para no quedarte corto al cotizar.",
  },
];

// Página de inicio (landing) de ObraApp. UI en español, mobile-first.
export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <span className="text-lg font-bold text-foreground">ObraApp</span>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Ingresar</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/registro">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container flex flex-col items-center gap-6 py-12 text-center sm:py-20">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Presupuestos profesionales para tu oficio, en minutos
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          ObraApp ayuda a plomeros, gasistas, albañiles y pintores a crear,
          enviar y hacer firmar presupuestos desde el celular.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/registro">Empezar gratis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#funciones">Ver cómo funciona</Link>
          </Button>
        </div>
      </section>

      {/* Rubros */}
      <section className="border-y border-border bg-muted/40">
        <div className="container flex flex-col gap-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Pensado para tu rubro
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Catálogo de tareas por oficio.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {RUBROS.map(({ etiqueta, Icono }) => (
              <div
                key={etiqueta}
                className="flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 text-card-foreground"
              >
                <Icono className="h-7 w-7 text-primary" aria-hidden />
                <span className="text-sm font-medium text-foreground">
                  {etiqueta}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Funcionalidades */}
      <section
        id="funciones"
        className="container grid gap-4 py-12 sm:grid-cols-2 lg:grid-cols-3"
      >
        {FUNCIONES.map(({ Icono, titulo, descripcion }) => (
          <Card key={titulo} className="bg-card text-card-foreground">
            <CardHeader>
              <Icono className="mb-2 h-8 w-8 text-primary" aria-hidden />
              <CardTitle className="text-xl text-card-foreground">
                {titulo}
              </CardTitle>
              <CardDescription>{descripcion}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>

      {/* Precios */}
      <section className="border-t border-border bg-muted/40">
        <div className="container flex flex-col gap-6 py-12">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-foreground">
              Precios simples
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Empezá gratis. Pasate a Pro cuando lo necesites.
            </p>
          </div>
          <div className="mx-auto grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            {/* Free */}
            <Card className="bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg text-card-foreground">
                  Free
                </CardTitle>
                <CardDescription>Para empezar</CardDescription>
                <p className="pt-2 text-3xl font-bold text-foreground">
                  Gratis
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ul className="flex flex-col gap-2 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" aria-hidden />3
                    presupuestos por mes
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                    Firma digital
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                    PDF de tus presupuestos
                  </li>
                </ul>
                <Button asChild variant="outline" className="w-full">
                  <Link href="/registro">Empezar gratis</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Pro */}
            <Card className="border-primary bg-card text-card-foreground">
              <CardHeader>
                <CardTitle className="text-lg text-card-foreground">
                  Pro
                </CardTitle>
                <CardDescription>Sin límites</CardDescription>
                <p className="pt-2 text-3xl font-bold text-foreground">
                  USD 4,99
                  <span className="text-base font-normal text-muted-foreground">
                    {" "}
                    / mes
                  </span>
                </p>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <ul className="flex flex-col gap-2 text-sm text-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                    Presupuestos ilimitados
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                    Firma digital y seguimiento
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-primary" aria-hidden />
                    Todo lo del plan Free
                  </li>
                </ul>
                <Button asChild className="w-full">
                  <Link href="/registro">Empezar</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="container flex flex-col items-center gap-4 py-14 text-center">
        <h2 className="text-2xl font-bold text-foreground">
          Empezá hoy, es gratis
        </h2>
        <p className="max-w-md text-sm text-muted-foreground">
          Creá tu primer presupuesto en minutos y hacé que tu cliente lo firme
          al toque.
        </p>
        <Button asChild size="lg">
          <Link href="/registro">Crear mi cuenta gratis</Link>
        </Button>
      </section>

      <Footer />
    </div>
  );
}

import Link from "next/link";
import { FileText, PenLine, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Página de inicio (landing) de ObraApp. UI en español, mobile-first.
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <span className="text-lg font-bold text-foreground">ObraApp</span>
          <Button asChild variant="outline" size="sm">
            <Link href="/login">Ingresar</Link>
          </Button>
        </div>
      </header>

      {/* Sección principal */}
      <section className="container flex flex-1 flex-col items-center justify-center gap-6 py-12 text-center sm:py-20">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Presupuestos profesionales para tu oficio, en minutos
        </h1>
        <p className="max-w-xl text-base text-muted-foreground sm:text-lg">
          ObraApp ayuda a plomeros, gasistas, albañiles y electricistas de
          LATAM a crear, enviar y hacer firmar presupuestos desde el celular.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/login">Empezar gratis</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="#funciones">Ver cómo funciona</Link>
          </Button>
        </div>
      </section>

      {/* Funcionalidades */}
      <section
        id="funciones"
        className="container grid gap-4 pb-16 sm:grid-cols-2 lg:grid-cols-3"
      >
        <Card>
          <CardHeader>
            <FileText className="mb-2 h-8 w-8 text-primary" aria-hidden />
            <CardTitle className="text-xl text-card-foreground">
              Presupuestos rápidos
            </CardTitle>
            <CardDescription>
              Cargá tareas e ítems por categoría y obtené el total al instante.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <PenLine className="mb-2 h-8 w-8 text-primary" aria-hidden />
            <CardTitle className="text-xl text-card-foreground">
              Firma digital
            </CardTitle>
            <CardDescription>
              Tu cliente firma el presupuesto desde un enlace, sin instalar
              nada.
            </CardDescription>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <Users className="mb-2 h-8 w-8 text-primary" aria-hidden />
            <CardTitle className="text-xl text-card-foreground">
              Precios de referencia
            </CardTitle>
            <CardDescription>
              Catálogo comunitario de tareas para no quedarte corto al cotizar.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      {/* Pie de página */}
      <footer className="border-t border-border">
        <div className="container py-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} ObraApp. Hecho para los oficios de LATAM.
        </div>
      </footer>
    </main>
  );
}

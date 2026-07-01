import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { FileText, Plus, Settings } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatearPesos } from "@/lib/format";
import { esProActivo } from "@/lib/plan";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoutButton } from "@/components/auth/logout-button";
import { BotonPro } from "@/components/plan/boton-pro";

export const metadata: Metadata = {
  title: "Panel — ObraApp",
};

// Consulta la base en cada request: no se prerrenderiza.
export const dynamic = "force-dynamic";

// Etiqueta y color de cada estado del presupuesto (texto Y fondo explícitos).
const ESTILOS_ESTADO: Record<string, { etiqueta: string; clase: string }> = {
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

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

// El acceso lo protege el middleware (única autoridad de auth), así que acá
// NO redirigimos: solo leemos la sesión para mostrar los datos.
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const nombre = session?.user?.name ?? session?.user?.email ?? "";

  // Redirección por ESTADO de onboarding (no por auth: la auth la maneja el
  // middleware). Si no completó el onboarding, lo mandamos ahí. No hay loop:
  // /onboarding redirige a /dashboard solo cuando SÍ está completo.
  let esPro = false;
  if (userId) {
    const usuario = await prisma.user.findUnique({
      where: { id: userId },
      select: { onboardingComplete: true, plan: true, planExpiresAt: true },
    });
    if (!usuario?.onboardingComplete) redirect("/onboarding");
    esPro = usuario ? esProActivo(usuario) : false;
  }

  // Presupuestos recientes del usuario (vacío si no hay ninguno).
  const presupuestos = userId
    ? await prisma.presupuesto.findMany({
        where: { userId },
        orderBy: { creadoAt: "desc" },
        take: 10,
        select: {
          id: true,
          numero: true,
          titulo: true,
          clienteNombre: true,
          estado: true,
          total: true,
          creadoAt: true,
        },
      })
    : [];

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Encabezado */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <span className="text-lg font-bold text-foreground">ObraApp</span>
          <div className="flex items-center gap-1">
            <Button asChild variant="ghost" size="sm" className="gap-1.5">
              <Link href="/dashboard/configuracion">
                <Settings className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">Configuración</span>
              </Link>
            </Button>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="container flex flex-col gap-6 py-6">
        {/* Saludo + acción principal */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Hola{nombre ? `, ${nombre}` : ""} 👋
            </h1>
            <p className="text-sm text-muted-foreground">
              Gestioná tus presupuestos desde acá.
            </p>
          </div>
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard/presupuestos/nuevo">
              <Plus className="h-4 w-4" />
              Crear presupuesto
            </Link>
          </Button>
        </div>

        {/* Banner de upgrade a Pro (solo plan Free). */}
        {!esPro && (
          <Card className="bg-card text-card-foreground">
            <CardContent className="flex flex-col items-start justify-between gap-3 py-4 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-medium text-foreground">Plan Free</p>
                <p className="text-xs text-muted-foreground">
                  Pasate a Pro para crear presupuestos ilimitados.
                </p>
              </div>
              <BotonPro />
            </CardContent>
          </Card>
        )}

        {/* Presupuestos recientes */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Presupuestos recientes
            </h2>
            <Link
              href="/dashboard/presupuestos"
              className="text-sm text-primary hover:underline"
            >
              Ver todos
            </Link>
          </div>

          {presupuestos.length === 0 ? (
            <Card className="bg-card text-card-foreground">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <FileText className="h-8 w-8 text-muted-foreground" aria-hidden />
                <p className="text-sm text-muted-foreground">
                  Todavía no creaste ningún presupuesto.
                </p>
                <Button asChild variant="outline" className="gap-2">
                  <Link href="/dashboard/presupuestos/nuevo">
                    <Plus className="h-4 w-4" />
                    Crear el primero
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-3">
              {presupuestos.map((p) => {
                const estado =
                  ESTILOS_ESTADO[p.estado] ?? ESTILOS_ESTADO.borrador;
                return (
                  <li key={p.id}>
                    <Card className="bg-card text-card-foreground">
                      <CardContent className="flex items-center justify-between gap-3 py-4">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate text-sm font-medium text-foreground">
                            #{p.numero} · {p.titulo}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {p.clienteNombre} ·{" "}
                            {formatoFecha.format(p.creadoAt)}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-sm font-semibold text-foreground">
                            {formatearPesos(p.total)}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${estado.clase}`}
                          >
                            {estado.etiqueta}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}

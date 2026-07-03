import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft, Users, FileText, Megaphone } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { esEmailAdmin } from "@/lib/admin";
import { esProActivo } from "@/lib/plan";
import { formatearPesos } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BannersAdmin } from "@/components/admin/banners-admin";

export const metadata: Metadata = {
  title: "Admin — ObraApp",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const formatoFecha = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  // Verificamos el email CONTRA LA BASE en cada request (no confiamos solo en
  // la sesión). Si no es el admin, lo mandamos al panel normal.
  const actual = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!esEmailAdmin(actual?.email)) redirect("/dashboard");

  // Datos: usuarios + agregados de presupuestos por usuario.
  const [usuarios, agregados] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        email: true,
        name: true,
        plan: true,
        planExpiresAt: true,
        onboardingComplete: true,
        country: true,
        createdAt: true,
      },
    }),
    prisma.presupuesto.groupBy({
      by: ["userId"],
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  // Banners de afiliados (contenido global, gestionado por el admin).
  const banners = await prisma.bannerAfiliado.findMany({
    orderBy: [{ orden: "asc" }, { creadoAt: "desc" }],
    select: {
      id: true,
      titulo: true,
      imagenUrl: true,
      linkDestino: true,
      categoria: true,
      activo: true,
      orden: true,
    },
  });

  const porUsuario = new Map(
    agregados.map((a) => [
      a.userId,
      { cantidad: a._count._all, total: a._sum.total ?? 0 },
    ]),
  );

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Panel
          </Link>
          <span className="text-lg font-bold text-foreground">Admin</span>
        </div>
      </header>

      <main className="container flex flex-col gap-6 py-6">
        <h1 className="text-2xl font-bold text-foreground">Administración</h1>

        {/* Sección: Usuarios */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <Users className="h-4 w-4" aria-hidden />
              Usuarios ({usuarios.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Plan</th>
                  <th className="py-2 pr-3 font-medium">Estado</th>
                  <th className="py-2 pr-3 font-medium">País</th>
                  <th className="py-2 font-medium">Alta</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const pro = esProActivo(u);
                  return (
                    <tr key={u.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-foreground">
                        {u.email}
                        {u.name && (
                          <span className="block text-xs text-muted-foreground">
                            {u.name}
                          </span>
                        )}
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            pro
                              ? "bg-primary/10 text-primary"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {pro ? "Pro" : "Free"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            u.onboardingComplete
                              ? "bg-green-100 text-green-800"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {u.onboardingComplete ? "Activo" : "Pendiente"}
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-muted-foreground">
                        {u.country ?? "—"}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {formatoFecha.format(u.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Sección: Presupuestos por usuario */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <FileText className="h-4 w-4" aria-hidden />
              Presupuestos por usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Email</th>
                  <th className="py-2 pr-3 font-medium">Presupuestos</th>
                  <th className="py-2 font-medium">Total facturado</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => {
                  const datos = porUsuario.get(u.id);
                  return (
                    <tr key={u.id} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-foreground">{u.email}</td>
                      <td className="py-2 pr-3 text-foreground">
                        {datos?.cantidad ?? 0}
                      </td>
                      <td className="py-2 font-medium text-foreground">
                        {formatearPesos(datos?.total ?? 0)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>

        {/* Sección: Banners de afiliados */}
        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-card-foreground">
              <Megaphone className="h-4 w-4" aria-hidden />
              Banners ({banners.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <BannersAdmin banners={banners} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

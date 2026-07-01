import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { ArrowLeft } from "lucide-react";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfiguracionCuenta } from "@/components/config/configuracion-cuenta";

export const metadata: Metadata = {
  title: "Configuración — ObraApp",
};

export const dynamic = "force-dynamic";

export default async function ConfiguracionPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, email: true },
  });

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container flex items-center py-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Panel
          </Link>
        </div>
      </header>

      <main className="container flex max-w-lg flex-col gap-4 py-6">
        <h1 className="text-2xl font-bold text-foreground">Configuración</h1>

        <Card className="bg-card text-card-foreground">
          <CardHeader>
            <CardTitle className="text-base text-card-foreground">
              Tu cuenta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConfiguracionCuenta
              nombreInicial={usuario?.name ?? ""}
              email={usuario?.email ?? ""}
            />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

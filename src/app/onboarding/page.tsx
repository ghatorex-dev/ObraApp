import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AuthShell } from "@/components/auth/auth-shell";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export const metadata: Metadata = {
  title: "Bienvenido — ObraApp",
};

// Se consulta la base en cada request.
export const dynamic = "force-dynamic";

// Página de onboarding. El middleware ya garantiza que haya sesión; acá solo
// controlamos el ESTADO de onboarding (no la auth), así que no hay loop:
// si ya lo completó, lo mandamos al panel.
export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) redirect("/login");

  const usuario = await prisma.user.findUnique({
    where: { id: userId },
    select: { name: true, onboardingComplete: true },
  });
  if (usuario?.onboardingComplete) redirect("/dashboard");

  const nombreInicial = usuario?.name ?? session?.user?.name ?? "";

  return (
    <AuthShell
      titulo="¡Bienvenido a ObraApp!"
      descripcion="Contanos un par de datos para empezar."
    >
      <OnboardingForm nombreInicial={nombreInicial} />
    </AuthShell>
  );
}

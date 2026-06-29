import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";

import { prisma } from "@/lib/prisma";

// Configuración central de NextAuth para ObraApp.
// Usa el Prisma Adapter para persistir usuarios, cuentas y sesiones.
// El secreto y la URL se leen exclusivamente de variables de entorno.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "database",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Inicio de sesión por enlace mágico vía email (Resend).
    // Configurá el envío real cuando integres Resend.
    EmailProvider({
      from: "no-reply@obraapp.app",
      // El servidor SMTP / API de envío se configura con variables de entorno.
      server: process.env.EMAIL_SERVER,
    }),
  ],
  callbacks: {
    // Exponemos el id del usuario en la sesión del lado del cliente.
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
};

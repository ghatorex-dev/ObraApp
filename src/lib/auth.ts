import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";

// Configuración central de NextAuth para ObraApp.
// - Google OAuth para inicio de sesión social.
// - Credenciales (email + contraseña) para cuentas locales.
// El secreto y las claves de OAuth se leen exclusivamente de variables de entorno.
//
// Nota: al usar el proveedor de credenciales, NextAuth requiere la estrategia
// de sesión "jwt" (no "database"). El Prisma Adapter sigue persistiendo los
// usuarios y las cuentas de OAuth.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    // Inicio de sesión con Google. Requiere GOOGLE_CLIENT_ID y
    // GOOGLE_CLIENT_SECRET en las variables de entorno.
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    // Inicio de sesión con email y contraseña.
    CredentialsProvider({
      name: "credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email.toLowerCase().trim();
        const usuario = await prisma.user.findUnique({ where: { email } });

        // Si el usuario no existe o se registró solo con Google (sin
        // contraseña local), no se puede autenticar por credenciales.
        if (!usuario || !usuario.hashedPassword) {
          return null;
        }

        const coincide = await bcrypt.compare(
          credentials.password,
          usuario.hashedPassword,
        );
        if (!coincide) {
          return null;
        }

        return {
          id: usuario.id,
          name: usuario.name,
          email: usuario.email,
          image: usuario.image,
        };
      },
    }),
  ],
  callbacks: {
    // Guardamos el id del usuario en el token JWT.
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    // Exponemos el id del usuario en la sesión del lado del cliente.
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

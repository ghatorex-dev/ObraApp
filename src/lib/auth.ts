import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validations";

const esProd = process.env.NODE_ENV === "production";

// Configuración central de NextAuth para ObraApp.
// - Google OAuth (con Prisma Adapter para persistir cuentas).
// - Credenciales (email + contraseña) con bcrypt.
// - Estrategia JWT (requerida por el proveedor de credenciales).
// - Cookies HttpOnly, SameSite=Lax y Secure en producción.
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  // Configuración explícita de la cookie de sesión: endurecida.
  cookies: {
    sessionToken: {
      name: esProd
        ? "__Secure-next-auth.session-token"
        : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: esProd,
      },
    },
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    }),
    CredentialsProvider({
      name: "credenciales",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials) {
        // Validamos el formato con Zod.
        const parseo = loginSchema.safeParse(credentials);
        if (!parseo.success) {
          return null;
        }
        const { email, password } = parseo.data;

        const usuario = await prisma.user.findUnique({ where: { email } });

        // IMPORTANTE (anti-enumeración): devolvemos null tanto si el usuario
        // no existe como si la contraseña es incorrecta. NextAuth muestra el
        // mismo error genérico en ambos casos, así no se puede deducir qué
        // emails están registrados.
        if (!usuario || !usuario.hashedPassword) {
          // Comparación "señuelo" para igualar el tiempo de respuesta y no
          // filtrar por timing si el email existe o no.
          await bcrypt.compare(
            password,
            "$2b$12$0000000000000000000000000000000000000000000000000000a",
          );
          return null;
        }

        const coincide = await bcrypt.compare(password, usuario.hashedPassword);
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
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
};

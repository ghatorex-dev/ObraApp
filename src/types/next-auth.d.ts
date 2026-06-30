import type { DefaultSession } from "next-auth";

// Extendemos los tipos de NextAuth para incluir el id del usuario.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}

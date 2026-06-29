import type { DefaultSession } from "next-auth";

// Extendemos los tipos de NextAuth para incluir el id del usuario en la sesión.
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

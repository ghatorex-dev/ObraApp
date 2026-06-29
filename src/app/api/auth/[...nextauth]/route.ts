import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

// Handler de NextAuth para el App Router.
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

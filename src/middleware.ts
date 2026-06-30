import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Middleware de protección de rutas para ObraApp.
// - /dashboard/* requiere sesión: sin sesión redirige a /login.
// - /login y /registro con sesión activa redirigen a /dashboard.
//
// Usamos getToken (JWT) porque es compatible con el runtime Edge del
// middleware. El secreto se lee de NEXTAUTH_SECRET.
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const autenticado = Boolean(token);

  const esRutaProtegida = pathname.startsWith("/dashboard");
  const esRutaAuth = pathname === "/login" || pathname === "/registro";

  // Sin sesión intentando entrar a una ruta protegida -> a /login,
  // recordando el destino original para volver después de ingresar.
  if (esRutaProtegida && !autenticado) {
    const urlLogin = new URL("/login", request.url);
    urlLogin.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(urlLogin);
  }

  // Con sesión activa intentando ir a login/registro -> al panel.
  if (esRutaAuth && autenticado) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Solo ejecutamos el middleware en las rutas que nos interesan.
export const config = {
  matcher: ["/dashboard", "/dashboard/:path*", "/login", "/registro"],
};

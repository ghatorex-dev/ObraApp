import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Middleware de protección de rutas para ObraApp.
//
// IMPORTANTE: este middleware es la ÚNICA autoridad de redirección de auth.
// Las páginas NO deben volver a redirigir según la sesión, porque si un
// segundo chequeo (getServerSession) discrepa de este (getToken) se produce
// un loop de redirecciones (/login -> /dashboard -> /login -> ...).
//
// Reglas:
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

  const esRutaProtegida =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/admin");
  const esRutaAuth = pathname === "/login" || pathname === "/registro";

  // Captura del código de referido. Si llega ?ref=CODIGO a /registro (y no hay
  // sesión), lo guardamos en una cookie httpOnly de corta duración (10 min).
  // Así podemos asociar el referidor DESPUÉS del alta, sin importar el método:
  // credenciales (lo lee /api/registro) o Google (lo lee events.createUser).
  // El nombre de la cookie está hardcodeado a propósito: este middleware corre
  // en el runtime Edge y no puede importar @/lib/referidos (usa Prisma).
  if (pathname === "/registro" && !autenticado) {
    const ref = request.nextUrl.searchParams.get("ref");
    if (ref) {
      const codigo = ref.replace(/[^A-Za-z0-9]/g, "").slice(0, 16).toUpperCase();
      const respuesta = NextResponse.next();
      if (codigo) {
        respuesta.cookies.set("ref_obraapp", codigo, {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          maxAge: 600, // 10 minutos
          path: "/",
        });
      }
      return respuesta;
    }
  }

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

  // En cualquier otro caso (incluye /login y /registro SIN sesión) dejamos
  // pasar la request sin redirigir. Esto evita el loop.
  return NextResponse.next();
}

// Solo ejecutamos el middleware en las rutas que nos interesan.
export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/onboarding",
    "/admin",
    "/admin/:path*",
    "/login",
    "/registro",
  ],
};

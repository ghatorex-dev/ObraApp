// Configuración de Next.js con headers de seguridad.
const esProd = process.env.NODE_ENV === "production";

// Content Security Policy. En desarrollo Next necesita 'unsafe-eval'
// (React Fast Refresh); en producción no se incluye.
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${esProd ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  // Imágenes propias, data URIs y avatares de Google.
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
]
  .join("; ")
  .concat(esProd ? "; upgrade-insecure-requests" : "");

// Headers de seguridad aplicados a todas las rutas.
const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HSTS: fuerza HTTPS durante 2 años, incluye subdominios.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

// =============================================================
// Cabeceras de seguridad HTTP de la aplicación web (OWASP).
// La más importante es la CSP: el navegador solo ejecuta scripts de este mismo sitio
// y solo permite conectarse a la API. Si alguien lograra inyectar código (XSS),
// no podría enviar el token a otro servidor.
// =============================================================
const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1";
const origenApi = new URL(API).origin;
const desarrollo = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  // Next.js necesita scripts en línea para hidratar la página; en desarrollo también eval
  `script-src 'self' 'unsafe-inline'${desarrollo ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  `connect-src 'self' ${origenApi}${desarrollo ? " ws:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const cabeceras = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Frame-Options", value: "DENY" },                        // evita clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(desarrollo
    ? []
    : [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]),
];

const nextConfig: NextConfig = {
  poweredByHeader: false, // no anuncia "X-Powered-By: Next.js"
  async headers() {
    return [{ source: "/:path*", headers: cabeceras }];
  },
};

export default nextConfig;

import { getRedis } from "@/lib/redis";

export type ResultadoRateLimit = {
  // true si la request está permitida.
  permitido: boolean;
  // Cantidad de requests restantes en la ventana.
  restantes: number;
  // Segundos hasta que se reinicia la ventana.
  reinicioEn: number;
};

// ----------------------------------------------------------------------------
// Fallback en memoria (Map) cuando NO hay Redis.
//
// Si REDIS_URL no está configurada, usamos un contador de ventana fija en
// memoria del proceso. Así el rate limiting SIGUE funcionando sin Redis y la
// app no se rompe. Limitación conocida: en entornos serverless cada instancia
// tiene su propio Map (no se comparte entre lambdas), pero es suficiente como
// defensa básica y es exactamente el comportamiento buscado ("usar Map").
// ----------------------------------------------------------------------------
const globalForMem = globalThis as unknown as {
  rateLimitMem: Map<string, { cantidad: number; expiraEn: number }> | undefined;
};

const memStore =
  globalForMem.rateLimitMem ??
  new Map<string, { cantidad: number; expiraEn: number }>();
if (process.env.NODE_ENV !== "production") {
  globalForMem.rateLimitMem = memStore;
}

function rateLimitEnMemoria(
  clave: string,
  limite: number,
  ventanaSeg: number,
): ResultadoRateLimit {
  const ahora = Date.now();
  const entrada = memStore.get(clave);

  // Ventana nueva o vencida: reiniciamos el contador.
  if (!entrada || ahora >= entrada.expiraEn) {
    memStore.set(clave, { cantidad: 1, expiraEn: ahora + ventanaSeg * 1000 });
    return { permitido: true, restantes: limite - 1, reinicioEn: ventanaSeg };
  }

  entrada.cantidad += 1;
  const reinicioEn = Math.max(0, Math.ceil((entrada.expiraEn - ahora) / 1000));
  return {
    permitido: entrada.cantidad <= limite,
    restantes: Math.max(0, limite - entrada.cantidad),
    reinicioEn,
  };
}

// Limpieza perezosa: cada tanto borramos claves vencidas para que el Map no
// crezca sin control en procesos de larga vida.
let ultimaLimpieza = 0;
function limpiarVencidas() {
  const ahora = Date.now();
  if (ahora - ultimaLimpieza < 60_000) return;
  ultimaLimpieza = ahora;
  const vencidas: string[] = [];
  memStore.forEach((valor, clave) => {
    if (ahora >= valor.expiraEn) vencidas.push(clave);
  });
  vencidas.forEach((clave) => memStore.delete(clave));
}

// ----------------------------------------------------------------------------
// Rate limiting con ventana fija.
// - `clave`: identificador único (por ejemplo "registro:<ip>").
// - `limite`: cantidad máxima de requests permitidas en la ventana.
// - `ventanaSeg`: duración de la ventana en segundos.
//
// Usa Redis si está disponible; si no, cae al Map en memoria. Si Redis existe
// pero falla, también cae al Map (nunca rompe la app).
// ----------------------------------------------------------------------------
export async function rateLimit(
  clave: string,
  limite: number,
  ventanaSeg: number,
): Promise<ResultadoRateLimit> {
  const redis = getRedis();
  if (!redis) {
    limpiarVencidas();
    return rateLimitEnMemoria(clave, limite, ventanaSeg);
  }

  const claveRedis = `ratelimit:${clave}`;

  try {
    // Incrementamos el contador; si es la primera vez, fijamos el TTL.
    const cantidad = await redis.incr(claveRedis);
    if (cantidad === 1) {
      await redis.expire(claveRedis, ventanaSeg);
    }

    const ttl = await redis.ttl(claveRedis);
    const reinicioEn = ttl >= 0 ? ttl : ventanaSeg;
    const restantes = Math.max(0, limite - cantidad);

    return {
      permitido: cantidad <= limite,
      restantes,
      reinicioEn,
    };
  } catch (error) {
    // Si Redis falla, caemos al Map en memoria en vez de romper.
    console.error("Rate limit: error de Redis, se usa memoria:", error);
    limpiarVencidas();
    return rateLimitEnMemoria(clave, limite, ventanaSeg);
  }
}

// Extrae la IP del cliente a partir de los headers de la request.
export function obtenerIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]!.trim();
  }
  return request.headers.get("x-real-ip") ?? "desconocida";
}

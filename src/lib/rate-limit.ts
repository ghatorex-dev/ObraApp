import { getRedis } from "@/lib/redis";

export type ResultadoRateLimit = {
  // true si la request está permitida.
  permitido: boolean;
  // Cantidad de requests restantes en la ventana.
  restantes: number;
  // Segundos hasta que se reinicia la ventana.
  reinicioEn: number;
};

// Rate limiting con ventana fija sobre Redis.
// - `clave`: identificador único (por ejemplo "registro:<ip>").
// - `limite`: cantidad máxima de requests permitidas en la ventana.
// - `ventanaSeg`: duración de la ventana en segundos.
//
// Si Redis no está disponible, "falla abierto" (permite la request) para no
// romper la app; se registra el aviso en consola.
export async function rateLimit(
  clave: string,
  limite: number,
  ventanaSeg: number,
): Promise<ResultadoRateLimit> {
  const redis = getRedis();
  if (!redis) {
    return { permitido: true, restantes: limite, reinicioEn: ventanaSeg };
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
    console.error("Rate limit: error de Redis, se permite la request:", error);
    return { permitido: true, restantes: limite, reinicioEn: ventanaSeg };
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

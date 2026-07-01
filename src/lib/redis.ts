import Redis from "ioredis";

// Cliente de Redis (ioredis) creado de forma perezosa y reutilizado entre
// recargas en desarrollo. Si REDIS_URL no está configurada, devolvemos null
// para que la app funcione igual (el rate limiting queda desactivado).
const globalForRedis = globalThis as unknown as {
  redis: Redis | null | undefined;
};

export function getRedis(): Redis | null {
  if (globalForRedis.redis !== undefined) {
    return globalForRedis.redis;
  }

  const url = process.env.REDIS_URL;
  if (!url) {
    globalForRedis.redis = null;
    return null;
  }

  const cliente = new Redis(url, {
    maxRetriesPerRequest: 2,
    // No frenamos la app si Redis no está disponible.
    lazyConnect: false,
  });
  // Evitamos que un error de conexión tire un throw no capturado.
  cliente.on("error", (error) => {
    console.error("Error de conexión a Redis:", error.message);
  });

  globalForRedis.redis = cliente;
  return cliente;
}

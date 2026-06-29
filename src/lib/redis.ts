import Redis from "ioredis";

// Cliente único de Redis (ioredis) reutilizado entre recargas en desarrollo.
const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

// La URL se toma exclusivamente de la variable de entorno REDIS_URL.
const redisUrl = process.env.REDIS_URL;

export const redis =
  globalForRedis.redis ??
  (redisUrl
    ? new Redis(redisUrl, { maxRetriesPerRequest: 3 })
    : (() => {
        throw new Error(
          "Falta la variable de entorno REDIS_URL. Cargala en .env.local.",
        );
      })());

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

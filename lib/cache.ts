import ms from "ms"
import { default as storage } from "node-persist"
import stringify from "safe-stable-stringify"

export const getCache = async () => {
  await storage.init({
    dir: ".cache",
  })
  return storage
}

export const cacheCall = async <T>(
  cache_key: string,
  fn: () => Promise<T>
): Promise<T> => {
  const cache = await getCache()

  const cached_val = await cache.getItem(cache_key)

  if (cached_val) return cached_val

  const val = await fn()

  await cache.setItem(cache_key, val, {
    ttl: ms("1h"),
  })

  return val
}

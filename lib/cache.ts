import { default as storage } from "node-persist"

export const getCache = async () => {
  await storage.init({
    dir: ".cache",
  })
  return storage
}

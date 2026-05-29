import type { RunGetters } from "../types"
import { uncapitalize } from "./uncapitalize"

export const runGetters = <T extends object>(x: T): RunGetters<T> =>
  Object.fromEntries(
    Object.entries(x).map(([key, value]) => {
      if (typeof value === "function" && key.startsWith("get")) {
        try {
          return [uncapitalize(key.replace(/^get/, "")), value()]
        } catch {
          return [key, value]
        }
      }

      return [key, value]
    }),
  ) as RunGetters<T>

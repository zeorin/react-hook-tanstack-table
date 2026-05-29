import type { Simplify } from 'type-fest'

export type IsEqual<Selection> = (prev: Selection, next: Selection) => boolean

type GetterKeys<T> = {
  [k in keyof T]-?: k extends `get${string}` ?
    T[k] extends () => unknown ?
      k
    : never
  : never
}[keyof T]

type GottenKey<k extends string> =
  k extends `get${infer K}` ? Uncapitalize<K> : never

type GetterReturn<T> = T extends () => unknown ? ReturnType<T> : never

export type RunGetters<T> = Simplify<
  {
    [k in GetterKeys<T> as GottenKey<k>]: GetterReturn<T[k]>
  } & {
    [k in Exclude<keyof T, GetterKeys<T>>]: T[k]
  }
>

import type {
  RowData,
  Table,
} from "@tanstack/table-core"

import { tableRegistry } from "./tableRegistry"

const isTable = <TData extends RowData>(
  x: unknown | Table<TData>,
): x is Table<TData> =>
  typeof x === "object" && x !== null && tableRegistry.has(x as Table<TData>)

export const hasTableArg = <
  TData extends RowData,
  Rest extends [unknown?, ...unknown[]],
>(
  args: [Table<TData> | undefined, ...Rest] | Rest,
): args is [Table<TData> | undefined, ...Rest] =>
  isTable(args[0]) || args[0] === undefined

import { useCallback } from "react"

import type {
  RequiredKeys,
  Row,
  RowData,
  Table,
  TableOptionsResolved,
} from "@tanstack/table-core"

import { identity } from "../lib/identity"
import { hasTableArg } from "../lib/hasTableArg"
import { runGetters } from "../lib/runGetters"
import { isShallowEqual } from "../lib/isShallowEqual"

import type { IsEqual, RunGetters } from "../types"

import { useTableWithSelector } from "./useTableWithSelector"

export interface RowValues<TData extends RowData> extends RunGetters<
  Row<TData>
> {}

const hookRowCache = new WeakMap<
  RequiredKeys<TableOptionsResolved<any>, "state">,
  Map<string, RowValues<any>>
>()

const rowHandlersCache = new WeakMap<
  Row<any>,
  {
    toggleExpandedHandler: ReturnType<Row<any>["getToggleExpandedHandler"]>
    toggleSelectedHandler: ReturnType<Row<any>["getToggleSelectedHandler"]>
  }
>()

const getRowValues = <TData extends RowData>(
  table: Table<TData>,
  rowId: string,
): RowValues<TData> => {
  let rowCache = hookRowCache.get(table.options)
  if (!rowCache) {
    rowCache = new Map()
    hookRowCache.set(table.options, rowCache)
  }

  let cached = rowCache.get(rowId)

  if (!cached) {
    const row = table.getRow(rowId)

    let cachedHandlers = rowHandlersCache.get(row)
    if (!cachedHandlers) {
      cachedHandlers = {
        toggleExpandedHandler: row.getToggleExpandedHandler(),
        toggleSelectedHandler: row.getToggleSelectedHandler(),
      }
      rowHandlersCache.set(row, cachedHandlers)
    }

    const { toggleExpandedHandler, toggleSelectedHandler } = cachedHandlers

    const { getGroupingValue, getUniqueValues, getValue, ...rest } = row

    cached = {
      ...runGetters(rest),
      getGroupingValue,
      getUniqueValues,
      getValue,
      toggleExpandedHandler,
      toggleSelectedHandler,
    }

    rowCache.set(rowId, cached)
  }

  return cached
}

type Selector<TData extends RowData, Selection> = (
  rowValues: RowValues<TData>,
) => Selection

export const useRow = <TData extends RowData, Selection = RowValues<TData>>(
  ...args:
    | [
        table: Table<TData> | undefined,
        row: Row<TData> | RowValues<TData> | { id: string } | string,
        selector?: Selector<TData, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
    | [
        row: Row<TData> | RowValues<TData> | { id: string } | string,
        selector?: Selector<TData, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
): Selection => {
  const [
    table,
    rowOrId,
    selector = identity as never,
    isEqual = isShallowEqual,
  ] = hasTableArg(args) ? args : [undefined, ...args]

  const rowId = typeof rowOrId === "string" ? rowOrId : rowOrId.id

  const getSelection = useCallback(
    (table: Table<TData>) => selector(getRowValues(table, rowId)),
    [rowId, selector],
  )

  return useTableWithSelector(table, getSelection, isEqual)
}

const rowHook = useRow

const rowHookʹ =
  <TData extends RowData>(
    ...args:
      | [
          table: Table<TData> | undefined,
          row: Row<TData> | RowValues<TData> | { id: string } | string,
        ]
      | [row: Row<TData> | RowValues<TData> | { id: string } | string]
  ) =>
  <Selection = RowValues<TData>>(
    selector?: Selector<TData, Selection> | undefined,
    isEqual?: IsEqual<NoInfer<Selection>> | undefined,
  ): Selection =>
    rowHook(...[...args, selector, isEqual])

export { rowHookʹ as useRowʹ }

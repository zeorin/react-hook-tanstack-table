import { useCallback } from "react"

import type {
  RequiredKeys,
  RowData,
  Table,
  TableOptionsResolved,
} from "@tanstack/table-core"

import { identity } from "../lib/identity"
import { runGetters } from "../lib/runGetters"
import { isShallowEqual } from "../lib/isShallowEqual"
import { hasTableArg } from "../lib/hasTableArg"

import type { IsEqual, RunGetters } from "../types"

import { useTableWithSelector } from "./useTableWithSelector"

export interface TableValues<TData extends RowData> extends RunGetters<
  Table<TData>
> {}

const tableValuesCache = new WeakMap<
  RequiredKeys<TableOptionsResolved<any>, "state">,
  TableValues<any>
>()

const tableHandlersCache = new WeakMap<
  Table<any>,
  {
    toggleAllColumnsVisibilityHandler: ReturnType<
      Table<any>["getToggleAllColumnsVisibilityHandler"]
    >
    toggleAllPageRowsSelectedHandler: ReturnType<
      Table<any>["getToggleAllPageRowsSelectedHandler"]
    >
    toggleAllRowsExpandedHandler: ReturnType<
      Table<any>["getToggleAllRowsExpandedHandler"]
    >
    toggleAllRowsSelectedHandler: ReturnType<
      Table<any>["getToggleAllRowsSelectedHandler"]
    >
  }
>()

const getTableValues = <TData extends RowData>(
  table: Table<TData>,
): TableValues<TData> => {
  let cached = tableValuesCache.get(table.options)
  if (!cached) {
    let cachedHandlers = tableHandlersCache.get(table)
    if (!cachedHandlers) {
      cachedHandlers = {
        toggleAllColumnsVisibilityHandler:
          table.getToggleAllColumnsVisibilityHandler(),
        toggleAllPageRowsSelectedHandler:
          table.getToggleAllPageRowsSelectedHandler(),
        toggleAllRowsExpandedHandler: table.getToggleAllRowsExpandedHandler(),
        toggleAllRowsSelectedHandler: table.getToggleAllRowsSelectedHandler(),
      }
      tableHandlersCache.set(table, cachedHandlers)
    }

    const {
      toggleAllColumnsVisibilityHandler,
      toggleAllPageRowsSelectedHandler,
      toggleAllRowsExpandedHandler,
      toggleAllRowsSelectedHandler,
    } = cachedHandlers

    const { getColumn, getRow, ...rest } = table

    cached = {
      ...runGetters(rest),
      getColumn,
      getRow,
      toggleAllColumnsVisibilityHandler,
      toggleAllPageRowsSelectedHandler,
      toggleAllRowsExpandedHandler,
      toggleAllRowsSelectedHandler,
    }
    tableValuesCache.set(table.options, cached)
  }
  return cached
}

type Selector<TData extends RowData, Selection> = (
  tableValues: TableValues<TData>,
) => Selection

export const useTable = <TData extends RowData, Selection = TableValues<TData>>(
  ...args:
    | [
        table: Table<TData> | undefined,
        selector?: Selector<TData, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
    | [
        selector?: Selector<TData, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
): Selection => {
  const [
    table,
    selector = identity as never,
    isEqual = isShallowEqual,
  ] = hasTableArg(args) ? args : [undefined, ...args]

  const getSelection = useCallback(
    (table: Table<TData>) => selector(getTableValues(table)),
    [selector],
  )

  return useTableWithSelector(table, getSelection, isEqual)
}

const tableHook = useTable

const tableHookʹ =
  <TData extends RowData>(table?: Table<TData> | undefined) =>
  <Selection = TableValues<TData>>(
    selector?: Selector<TData, Selection> | undefined,
    isEqual?: IsEqual<NoInfer<Selection>> | undefined
  ): Selection =>
    tableHook(table, selector, isEqual)

export { tableHookʹ as useTableʹ }

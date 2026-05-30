import { useCallback } from "react"

import type {
  Column,
  RequiredKeys,
  RowData,
  Table,
  TableOptionsResolved,
} from "@tanstack/table-core"

import { identity } from "../lib/identity"
import { hasTableArg } from "../lib/hasTableArg"
import { runGetters } from "../lib/runGetters"
import { isShallowEqual } from "../lib/isShallowEqual"
import { invariant } from "../lib/invariant"

import type { IsEqual, RunGetters } from "../types"

import { useTableBase } from "../lib/useTableBase"

export interface ColumnSnapshot<
  TData extends RowData,
  TValue = unknown,
> extends RunGetters<Column<TData, TValue>> {}

const columnSnapshotCache = new WeakMap<
  RequiredKeys<TableOptionsResolved<any>, "state">,
  Map<string, ColumnSnapshot<any, any>>
>()

const columnHandlersCache = new WeakMap<
  Column<any, any>,
  {
    toggleGroupingHandler: ReturnType<
      Column<any, any>["getToggleGroupingHandler"]
    >
    toggleSortingHandler: ReturnType<
      Column<any, any>["getToggleSortingHandler"]
    >
    toggleVisibilityHandler: ReturnType<
      Column<any, any>["getToggleVisibilityHandler"]
    >
  }
>()

const getColumn = <TData extends RowData, TValue = unknown>(table: Table<TData>, columnId: string) => {
	const column = table.getColumn(columnId) as
		| Column<TData, TValue>
		| undefined
	invariant(column)
	return column
}

const getColumnSnapshot = <TData extends RowData, TValue = unknown>(
  table: Table<TData>,
  columnId: string,
): ColumnSnapshot<TData, TValue> => {
  let columnCache = columnSnapshotCache.get(table.options)
  if (!columnCache) {
    columnCache = new Map()
    columnSnapshotCache.set(table.options, columnCache)
  }

  let cached = columnCache.get(columnId)

  if (!cached) {
    const column = getColumn<TData, TValue>(table, columnId)

    let cachedHandlers = columnHandlersCache.get(column)
    if (!cachedHandlers) {
      cachedHandlers = {
        toggleGroupingHandler: column.getToggleGroupingHandler(),
        toggleSortingHandler: column.getToggleSortingHandler(),
        toggleVisibilityHandler: column.getToggleVisibilityHandler(),
      }
      columnHandlersCache.set(column, cachedHandlers)
    }

    const {
      toggleGroupingHandler,
      toggleSortingHandler,
      toggleVisibilityHandler,
    } = cachedHandlers

    cached = {
      ...runGetters(column),
      toggleGroupingHandler,
      toggleSortingHandler,
      toggleVisibilityHandler,
    }

    columnCache.set(columnId, cached)
  }

  return cached
}

type Selector<TData extends RowData, TValue, Selection> = (
  columnSnapshot: ColumnSnapshot<TData, TValue>,
	column: Column<TData, TValue>,
	table: Table<TData>
) => Selection

export const useColumn = <
  TData extends RowData,
  TValue = unknown,
  Selection = ColumnSnapshot<TData, TValue>,
>(
  ...args:
    | [
        table: Table<TData> | undefined,
        column:
          | Column<TData, TValue>
          | ColumnSnapshot<TData, TValue>
          | { id: string }
          | string,
        selector?: Selector<TData, TValue, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
    | [
        column:
          | Column<TData, TValue>
          | ColumnSnapshot<TData, TValue>
          | { id: string }
          | string,
        selector?: Selector<TData, TValue, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
): Selection => {
  const [
    table,
    columnOrId,
    selector = identity as never,
    isEqual = isShallowEqual,
  ] = hasTableArg(args) ? args : [undefined, ...args]

  const columnId = typeof columnOrId === "string" ? columnOrId : columnOrId.id

  const getSelection = useCallback(
    (table: Table<TData>) => selector(
			getColumnSnapshot<TData, TValue>(table, columnId),
			getColumn<TData, TValue>(table, columnId),
			table
		),
    [columnId, selector],
  )

  return useTableBase(table, getSelection, isEqual)
}

const columnHook = useColumn

const columnHookʹ =
  <TData extends RowData, TValue = unknown>(
    ...args:
      | [
          table: Table<TData> | undefined,
          column:
            | Column<TData, TValue>
            | ColumnSnapshot<TData, TValue>
            | { id: string }
            | string,
        ]
      | [
          column:
            | Column<TData, TValue>
            | ColumnSnapshot<TData, TValue>
            | { id: string }
            | string,
        ]
  ) =>
  <Selection = ColumnSnapshot<TData, TValue>>(
    selector?: Selector<TData, TValue, Selection> | undefined,
    isEqual?: IsEqual<NoInfer<Selection>> | undefined,
  ): Selection =>
    columnHook(...[...args, selector, isEqual])

export { columnHookʹ as useColumnʹ }

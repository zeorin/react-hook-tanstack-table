import { useCallback } from "react"

import type {
  Cell,
  Column,
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
import { invariant } from "../lib/invariant"

import type { IsEqual, RunGetters } from "../types"

import type { ColumnValues } from "./useColumn"
import type { RowValues } from "./useRow"
import { useTableWithSelector } from "./useTableWithSelector"

export interface CellValues<TData extends RowData, TValue> extends RunGetters<
  Cell<TData, TValue>
> {}

const cellValuesCache = new WeakMap<
  RequiredKeys<TableOptionsResolved<any>, "state">,
  Map<string, Map<string, CellValues<any, any>>>
>()

const getCellValues = <TData extends RowData, TValue>(
  table: Table<TData>,
  rowId: string,
  columnId: string,
): CellValues<TData, TValue> => {
  let cellCache = cellValuesCache.get(table.options)
  if (!cellCache) {
    cellCache = new Map()
    cellValuesCache.set(table.options, cellCache)
  }

  let rowCache = cellCache.get(rowId)
  if (!rowCache) {
    rowCache = new Map()
    cellCache.set(rowId, rowCache)
  }

  let cached = rowCache.get(columnId)

  if (!cached) {
    const cell = table
      .getRow(rowId)
      ?.getAllCells()
      .find((c) => c.column.id === columnId) as Cell<TData, TValue> | undefined

    invariant(cell)

    cached = runGetters(cell)

    rowCache.set(columnId, cached)
  }

  return cached
}

type Selector<TData extends RowData, TValue, Selection> = (
  cellValues: CellValues<TData, TValue>,
) => Selection

interface CellCoords<TData extends RowData, TValue> {
  column: Column<TData, TValue> | ColumnValues<TData> | string
  row: Row<TData> | RowValues<TData> | string
}

export const useCell = <
  TData extends RowData,
  TValue,
  Selection = CellValues<TData, TValue>,
>(
  ...args:
    | [
        table: Table<TData> | undefined,
        cell:
          | Cell<TData, TValue>
          | CellValues<TData, TValue>
          | CellCoords<TData, TValue>,
        selector?: Selector<TData, TValue, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
    | [
        cell:
          | Cell<TData, TValue>
          | CellValues<TData, TValue>
          | CellCoords<TData, TValue>,
        selector?: Selector<TData, TValue, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
): Selection => {
  const [
    table,
    cellOrCoords,
    selector = identity as never,
    isEqual = isShallowEqual,
  ] = hasTableArg(args) ? args : [undefined, ...args]

  const { columnId, rowId } =
    "id" in cellOrCoords ?
      { columnId: cellOrCoords.column.id, rowId: cellOrCoords.row.id }
    : {
        columnId:
          typeof cellOrCoords.column === "string" ?
            cellOrCoords.column
          : cellOrCoords.column.id,
        rowId:
          typeof cellOrCoords.row === "string" ?
            cellOrCoords.row
          : cellOrCoords.row.id,
      }

  const getSelection = useCallback(
    (table: Table<TData>) => selector(getCellValues(table, rowId, columnId)),
    [columnId, rowId, selector],
  )

  return useTableWithSelector(table, getSelection, isEqual)
}

const cellHook = useCell

const cellHookʹ =
  <TData extends RowData, TValue>(
    ...args:
      | [
          table: Table<TData> | undefined,
          cell:
            | Cell<TData, TValue>
            | CellValues<TData, TValue>
            | CellCoords<TData, TValue>,
        ]
      | [
          cell:
            | Cell<TData, TValue>
            | CellValues<TData, TValue>
            | CellCoords<TData, TValue>,
        ]
  ) =>
  <Selection = CellValues<TData, TValue>>(
    selector?: Selector<TData, TValue, Selection> | undefined,
    isEqual?: IsEqual<NoInfer<Selection>> | undefined,
  ): Selection =>
    cellHook(...[...args, selector, isEqual])

export { cellHookʹ as useCellʹ }

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

import type { ColumnSnapshot } from "./useColumn"
import type { RowSnapshot } from "./useRow"
import { useTableBase } from "../lib/useTableBase"

export interface CellSnapshot<TData extends RowData, TValue> extends RunGetters<
  Cell<TData, TValue>
> {}

const cellSnapshotCache = new WeakMap<
  RequiredKeys<TableOptionsResolved<any>, "state">,
  Map<string, Map<string, CellSnapshot<any, any>>>
>()

const getCell = <TData extends RowData, TValue>(
  table: Table<TData>,
  rowId: string,
  columnId: string,
) => {
	const cell = table
		.getRow(rowId)
		?.getAllCells()
		.find((c) => c.column.id === columnId) as Cell<TData, TValue> | undefined
	invariant(cell)
	return cell
}

const getCellSnapshot = <TData extends RowData, TValue>(
  table: Table<TData>,
  rowId: string,
  columnId: string,
): CellSnapshot<TData, TValue> => {
  let cellCache = cellSnapshotCache.get(table.options)
  if (!cellCache) {
    cellCache = new Map()
    cellSnapshotCache.set(table.options, cellCache)
  }

  let rowCache = cellCache.get(rowId)
  if (!rowCache) {
    rowCache = new Map()
    cellCache.set(rowId, rowCache)
  }

  let cached = rowCache.get(columnId)
  if (!cached) {
    const cell = getCell(table, rowId, columnId)
    cached = runGetters(cell)
    rowCache.set(columnId, cached)
  }

  return cached
}

type Selector<TData extends RowData, TValue, Selection> = (
  cellSnapshot: CellSnapshot<TData, TValue>,
  cell: Cell<TData, TValue>,
  table: Table<TData>,
) => Selection

interface CellCoords<TData extends RowData, TValue> {
  column: Column<TData, TValue> | ColumnSnapshot<TData> | string
  row: Row<TData> | RowSnapshot<TData> | string
}

export const useCell = <
  TData extends RowData,
  TValue,
  Selection = CellSnapshot<TData, TValue>,
>(
  ...args:
    | [
        table: Table<TData> | undefined,
        cell:
          | Cell<TData, TValue>
          | CellSnapshot<TData, TValue>
          | CellCoords<TData, TValue>,
        selector?: Selector<TData, TValue, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
    | [
        cell:
          | Cell<TData, TValue>
          | CellSnapshot<TData, TValue>
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
    (table: Table<TData>) => selector(
			getCellSnapshot<TData, TValue>(table, rowId, columnId),
			getCell<TData, TValue>(table, rowId, columnId),
			table
		),
    [columnId, rowId, selector],
  )

  return useTableBase(table, getSelection, isEqual)
}

const cellHook = useCell

const cellHookʹ =
  <TData extends RowData, TValue>(
    ...args:
      | [
          table: Table<TData> | undefined,
          cell:
            | Cell<TData, TValue>
            | CellSnapshot<TData, TValue>
            | CellCoords<TData, TValue>,
        ]
      | [
          cell:
            | Cell<TData, TValue>
            | CellSnapshot<TData, TValue>
            | CellCoords<TData, TValue>,
        ]
  ) =>
  <Selection = CellSnapshot<TData, TValue>>(
    selector?: Selector<TData, TValue, Selection> | undefined,
    isEqual?: IsEqual<NoInfer<Selection>> | undefined,
  ): Selection =>
    cellHook(...[...args, selector, isEqual])

export { cellHookʹ as useCellʹ }

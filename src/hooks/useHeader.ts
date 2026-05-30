import { useCallback } from "react"

import type {
  Header,
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

export interface HeaderSnapshot<TData extends RowData, TValue> extends RunGetters<
  Header<TData, TValue>
> {}

const headerSnapshotCache = new WeakMap<
  RequiredKeys<TableOptionsResolved<any>, "state">,
  Map<string, HeaderSnapshot<any, any>>
>()

const headerHandlersCache = new WeakMap<
  Header<any, any>,
  {
    resizeHandler: ReturnType<Header<any, any>["getResizeHandler"]>
  }
>()

const getHeader = <TData extends RowData, TValue>(table: Table<TData>, headerId: string) => {
	const header = table.getFlatHeaders().find((h) => h.id === headerId) as
		| Header<TData, TValue>
		| undefined
	invariant(header)
	return header 
}

const getHeaderSnapshot = <TData extends RowData, TValue>(
  table: Table<TData>,
  headerId: string,
): HeaderSnapshot<TData, TValue> => {
  let headerCache = headerSnapshotCache.get(table.options)
  if (!headerCache) {
    headerCache = new Map()
    headerSnapshotCache.set(table.options, headerCache)
  }

  let cached = headerCache.get(headerId)

  if (!cached) {
    const header = getHeader<TData, TValue>(table, headerId)

    let cachedHandlers = headerHandlersCache.get(header)
    if (!cachedHandlers) {
      cachedHandlers = {
        resizeHandler: header.getResizeHandler(),
      }
      headerHandlersCache.set(header, cachedHandlers)
    }

    const { resizeHandler } = cachedHandlers

    cached = {
      ...runGetters(header),
      resizeHandler,
    }

    headerCache.set(headerId, cached)
  }

  return cached
}

type Selector<TData extends RowData, TValue, Selection> = (
  headerSnapshot: HeaderSnapshot<TData, TValue>,
	header: Header<TData, TValue>,
	table: Table<TData>
) => Selection

export const useHeader = <
  TData extends RowData,
  TValue,
  Selection = HeaderSnapshot<TData, TValue>,
>(
  ...args:
    | [
        table: Table<TData> | undefined,
        header:
          | Header<TData, TValue>
          | HeaderSnapshot<TData, TValue>
          | { id: string }
          | string,
        selector?: Selector<TData, TValue, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
    | [
        header:
          | Header<TData, TValue>
          | HeaderSnapshot<TData, TValue>
          | { id: string }
          | string,
        selector?: Selector<TData, TValue, Selection> | undefined,
        isEqual?: IsEqual<NoInfer<Selection>> | undefined,
      ]
): Selection => {
  const [
    table,
    headerOrId,
    selector = identity as never,
    isEqual = isShallowEqual,
  ] = hasTableArg(args) ? args : [undefined, ...args]

  const headerId = typeof headerOrId === "string" ? headerOrId : headerOrId.id

  const getSelection = useCallback(
    (table: Table<TData>) => selector(
			getHeaderSnapshot<TData, TValue>(table, headerId),
			getHeader<TData, TValue>(table, headerId),
			table
		),
    [headerId, selector],
  )

  return useTableBase(table, getSelection, isEqual)
}

const headerHook = useHeader

const headerHookʹ =
  <TData extends RowData, TValue>(
    ...args:
      | [
          table: Table<TData> | undefined,
          header:
            | Header<TData, TValue>
            | HeaderSnapshot<TData, TValue>
            | { id: string }
            | string,
        ]
      | [
          header:
            | Header<TData, TValue>
            | HeaderSnapshot<TData, TValue>
            | { id: string }
            | string,
        ]
  ) =>
  <Selection = HeaderSnapshot<TData, TValue>>(
    selector?: Selector<TData, TValue, Selection> | undefined,
    isEqual?: IsEqual<NoInfer<Selection>> | undefined,
  ): Selection =>
    headerHook(...[...args, selector, isEqual])

export { headerHookʹ as useHeaderʹ }

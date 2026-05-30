import {
  use,
  useCallback,
  useInsertionEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react"

import type {
  RequiredKeys,
  RowData,
  Table,
  TableOptionsResolved,
} from "@tanstack/table-core"

import { TableContext } from "../contexts/TableContext"

import { identity } from "./identity"
import { tableRegistry } from "./tableRegistry"
import { invariant } from "./invariant"

import type { IsEqual } from "../types"

export const useTableBase = <
  TData extends RowData,
  Selection = Table<TData>,
>(
  table?: Table<TData> | undefined,
  selector: (table: Table<TData>) => Selection = identity as never,
  isEqual?: IsEqual<NoInfer<Selection>> | undefined,
): Selection => {
  "use no memo"

  const resolvedTable = table ?? use<Table<TData> | null>(TableContext)

  invariant(
    resolvedTable,
    "`useTableBase` must be used as a descendent of `TableContext` or provided with a `Table` as an argument!",
  )

  const listeners = useMemo(
    () => (tableRegistry.get(resolvedTable) ?? {}).listeners,
    [resolvedTable],
  )

  invariant(
    listeners,
    "The provided/found `Table` instance cannot be subscribed to. Was it created by the correct `useReactTable` hook?",
  )

  const subscribe = useCallback(
    (onTableChange: () => void) => {
      listeners.add(onTableChange)
      return () => {
        listeners.delete(onTableChange)
      }
    },
    [listeners],
  )

  // Use this to track the rendered snapshot.
  const instRef = useRef<
    | {
        hasValue: false
        value: null
      }
    | { hasValue: true; value: Selection }
  >({
    hasValue: false,
    value: null,
  })

  // eslint-disable-next-line react-hooks/immutability
  const getSnapshot = useMemo(() => {
    let hasMemo = false,
      memoizedTableOptions: RequiredKeys<TableOptionsResolved<TData>, "state">,
      memoizedSelection: Selection

    return () => {
      const nextTableOptions = resolvedTable.options
      if (!hasMemo) {
        // The first time the hook is called, there is no memoized result.
        // eslint-disable-next-line react-hooks/immutability -- should be fine 😅 this is how it is in the upstream, too
        hasMemo = true
        memoizedTableOptions = nextTableOptions
        const nextSelection = selector(resolvedTable)

        if (isEqual !== undefined) {
          // Even if the selector has changed, the currently rendered selection
          // may be equal to the new selection. We should attempt to reuse the
          // current value if possible, to preserve downstream memoizations.
          if (instRef.current.hasValue) {
            const currentSelection = instRef.current.value
            if (isEqual(currentSelection, nextSelection)) {
              memoizedSelection = currentSelection
              return currentSelection
            }
          }
        }

        memoizedSelection = nextSelection
        return nextSelection
      }

      const prevTableOptions = memoizedTableOptions
      // eslint-disable-next-line react-hooks/memo-dependencies
      const prevSelection = memoizedSelection

      if (Object.is(prevTableOptions, nextTableOptions)) {
        // The snapshot is the same as last time. Reuse the previous selection.
        return prevSelection
      }

      // The snapshot has changed, so we need to compute a new selection.
      const nextSelection = selector(resolvedTable)

      // If a custom isEqual function is provided, use that to check if the data
      // has changed. If it hasn't, return the previous selection. That signals
      // to React that the selections are conceptually equal, and we can bail
      // out of rendering.
      if (isEqual !== undefined && isEqual(prevSelection, nextSelection)) {
        // The snapshot still has changed, so make sure to update to not keep
        // old references alive
        memoizedTableOptions = nextTableOptions
        return prevSelection
      }

      memoizedTableOptions = nextTableOptions
      memoizedSelection = nextSelection
      return nextSelection
    }
  }, [selector, resolvedTable, isEqual])

  const value = useSyncExternalStore(subscribe, getSnapshot)

  useInsertionEffect(() => {
    instRef.current.hasValue = true
    instRef.current.value = value
  }, [value])

  return value
}

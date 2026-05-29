import { useCallback, useState } from "react"

import {
  type OnChangeFn,
  type RowData,
  type Table,
  type TableOptions,
  type TableState,
  createTable,
} from "@tanstack/table-core"

import { useShallowMemo } from "../lib/useShallowMemo"
import { tableRegistry } from "../lib/tableRegistry"
import { invariant } from "../lib/invariant"
import { useLayoutEffect } from "../lib/useLayoutEffect"

export const useReactTable = <TData extends RowData>({
  state,
  ...options
}: TableOptions<TData>): Table<TData> => {
  const memoOptions = useShallowMemo(options)
  const memoState = useShallowMemo(state)

  // We'll maintain both our internal state and any user-provided
  // state.
  const [internalState, setInternalState] = useState<TableState>(null!)

  const onStateChange = useCallback<OnChangeFn<TableState>>(
    (updater) => {
      setInternalState(updater)
      memoOptions.onStateChange?.call(undefined, updater)
    },
    [memoOptions.onStateChange],
  )

  // Create a new table and store it in state
  const [table] = useState(() => {
    // Compose in the generic memoOptions to the user memoOptions
    const resolvedOptions = {
      state: {}, // Dummy state
      onStateChange: () => {}, // noop
      renderFallbackValue: null,
      ...memoOptions,
    }

    const table = createTable<TData>(resolvedOptions)

    table.setOptions((prev) => ({
      ...prev,
      ...memoOptions,
      state: {
        ...table.initialState,
        ...memoState,
      },
      onStateChange,
    }))

    tableRegistry.set(table, { listeners: new Set() })

    return table
  })

  if (!internalState) {
    setInternalState(table.initialState)
  }

  useLayoutEffect(() => {
    // Compose the default state above with any user state. This will allow the user
    // to only control a subset of the state if desired.
    table.setOptions((prev) => ({
      ...prev,
      ...memoOptions,
      state: {
        ...internalState,
        ...memoState,
      },
      onStateChange,
    }))

    const { listeners } = tableRegistry.get(table) ?? {}
    invariant(listeners)
    for (const listener of listeners) {
      listener()
    }
  }, [memoOptions, memoState, onStateChange, table, internalState])

  return table
}

import type { Table } from "@tanstack/table-core"

export const tableRegistry: WeakMap<Table<any>, { listeners: Set<() => void> }> = new WeakMap()

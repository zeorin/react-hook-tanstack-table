import { createContext } from "react"

import type { Table } from "@tanstack/table-core"

export const TableContext: React.Context<Table<any> | null> = createContext<Table<any> | null>(null)

TableContext.displayName = "TableContext"

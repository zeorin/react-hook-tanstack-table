# React Hook TanStack Table

[Rules of React](https://react.dev/reference/rules) respecting bindings for [TanStack Table](https://tanstack.com/table).

Because these hooks respect the Rules of React, they are compatible with the React Compiler, or just memoization in general. They are more performant than `@tanstack/react-table`'s API.

## Usage

Install this package and its peer dependencies:

```sh
yarn install react-hook-tanstack-table @tanstack/table-core @tanstack/react-table
```

`react-hook-tanstack-table` is a drop-in replacement for `@tanstack/react-table`.

**Use our `useReactTable` hook to create your table instance.**

You may use our `TableContext` and provide your `table` to it. Our hooks will find it through the context.
Alternatively, you can provide your `table` instance directly to the hooks.

## How it works

Our `useReactTable` hook creates a `table` instance, and hooks into its `onStateChanged` handler to listen to state changes.

Our other hooks subscribe to these changes using React's [`useSyncExternalStore`](https://react.dev/reference/react/useSyncExternalStore), and run the getters on the relevant part of TanStack Table's API. You can then select the parts of the state that you need.

## Hooks

### `useTable`

```typescript
import { useTable } from 'react-hook-tanstack-table'

const Table = () => {
	const tableState = useTable((table) => table.state)
}
```

### `useColumn`

```typescript
import { useColumn } from 'react-hook-tanstack-table'

const Column = ({ columnId }: { columnId: string }) => {
	const canFilter = useColumn(columnId, (column) => column.canFilter)
}
```

### `useHeader`

```typescript
import { useHeader } from 'react-hook-tanstack-table'

const Header = ({ headerId }: { headerId: string }) => {
	const isPlaceholder = useHeader(headerId, (header) => header.isPlaceholder)
}
```

### `useRow`

```typescript
import { useRow } from 'react-hook-tanstack-table'

const Row = ({ rowId }, { rowId: string }) => {
	const canSelect = useRow(rowId, (row) => row.canSelect)
}
```

### `useCell`

```typescript
import { useCell } from 'react-hook-tanstack-table'

const Cell = ({ column, rowId }: { columnId: string, rowId: string }) => {
	const cellValue = useCell({ column: columnId, row: rowId }, (cell) => cell.value)
}
```

## See also

If you use [TanStack Virtual](https://tanstack.com/Virtual), you may be interested in our sister package, [`react-hook-tanstack-virtual`](https://www.npmjs.com/package/react-hook-tanstack-virtual).

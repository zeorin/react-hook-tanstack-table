export function invariant(
	condition: any,
	message?: string | (() => string) | undefined
): asserts condition {
  if (condition) return
  throw new Error(
		[
			'Invariant failed',
			typeof message === 'function' ? message() : message
		].filter(Boolean).join(': ')
	);
}

import { defineConfig } from 'tsdown'

export default defineConfig({
	platform: 'neutral',
	dts: {
		sourcemap: true
	},
	exports: true,
	format: ["esm", "cjs"],
	minify: true,
	deps: {
		neverBundle: [/^@tanstack\//],
	},
	entry: [
		'src/index.ts',
		{ '*': 'src/contexts/*.ts' },
		{ '*': 'src/hooks/*.ts' }
	]
})

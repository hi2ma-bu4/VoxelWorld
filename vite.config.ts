import { threeMinifier } from "@yushijinhun/three-minifier-rollup";
import { defineConfig } from "vite";

export default defineConfig({
	base: "./",
	publicDir: "public",
	plugins: [{ ...threeMinifier(), enforce: "pre" }],
	server: {
		// 開発サーバーのヘッダー設定 (SharedArrayBufferなどに必要になる場合がある)
		headers: {
			"Cross-Origin-Opener-Policy": "same-origin",
			"Cross-Origin-Embedder-Policy": "require-corp",
		},
	},
	optimizeDeps: {
		// COOP/COEP設定時に必要
		exclude: ["@js-joda/core"],
	},
	build: {
		copyPublicDir: false,
		rollupOptions: {
			output: {
				manualChunks: {
					three: ["three"],
				},
			},
		},
	},
});

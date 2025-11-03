import { defineConfig } from "vite";

export default defineConfig({
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
});

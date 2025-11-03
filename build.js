import { execSync } from "child_process";
import { rmSync } from "fs";

const RUST_SRC_DIR = "src-rust";
const RUST_OUT_DIR = "src/rust-pkg";

try {
	console.log("Cleaning up old Rust build...");
	rmSync(RUST_OUT_DIR, { recursive: true, force: true });
	console.log("Old Rust build cleaned up.");

	console.log("Building Rust (WebAssembly)...");
	execSync(
		`npx wasm-pack build --target web --out-dir ../${RUST_OUT_DIR}`,
		{ stdio: "inherit", cwd: RUST_SRC_DIR }
	);
	console.log("Rust build complete.");

	console.log("Building TypeScript...");
	execSync("npm run build:ts", { stdio: "inherit" });
	console.log("TypeScript build complete.");

	console.log("\nBuild finished successfully!");
} catch (error) {
	console.error("\nBuild failed:", error);
	process.exit(1);
}

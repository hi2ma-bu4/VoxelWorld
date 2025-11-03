import { CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, CHUNK_VOLUME, xyz_to_index, type GeneratedMesh, type WorkerRequestMessage, type WorkerResponseMessage } from "../common/types";
import init, { WorldGenerator } from "../rust-pkg/voxel_world";
import wasmUrl from "../rust-pkg/voxel_world_bg.wasm?url";
import { IndexedDBManager } from "./IndexedDB";

console.log("Worker: スクリプト読み込み完了");

let generator: WorldGenerator | null = null;
const db = new IndexedDBManager();

// ワーカー内にチャンクデータをキャッシュ (DBのミラー)
const chunkDataCache = new Map<string, Uint8Array>();

// WASMの初期化
async function initializeWasm() {
	if (generator) return;
	console.log("Worker: WASMモジュール初期化開始...");
	await init(wasmUrl);
	generator = new WorldGenerator(12345); // 固定シード
	console.log("Worker: WASMモジュール初期化完了");
}

// DBからワールドデータを読み込み、キャッシュに格納
async function loadWorldFromDB() {
	console.log("Worker: IndexedDBからワールド読み込み開始...");
	await db.openDB();
	const allChunks = await db.getAllChunks();
	allChunks.forEach((data, key) => {
		chunkDataCache.set(key, data);
	});
	console.log(`Worker: ${allChunks.size}個のチャンクをDBからキャッシュに読み込みました`);

	// メインスレッドに読み込み完了を通知
	const response: WorkerResponseMessage = { type: "worldLoaded" };
	self.postMessage(response);
}

// チャンクデータを取得 (キャッシュ -> なければWASMで生成)
async function getChunkData(cx: number, cy: number, cz: number): Promise<Uint8Array> {
	const key = `${cx},${cy},${cz}`;

	// 1. キャッシュ確認
	if (chunkDataCache.has(key)) {
		return chunkDataCache.get(key)!;
	}

	// 2. WASM (generator) が初期化されているか確認
	await initializeWasm();

	// 3. WASMで新規生成
	const newData = generator!.generate_chunk_data(cx, cy, cz);
	const chunkData = new Uint8Array(newData); // Box<[u8]> から Uint8Array に

	// 4. キャッシュに保存 (DBには保存しない。変更されたものだけDBに保存)
	chunkDataCache.set(key, chunkData);
	return chunkData;
}

// チャンクメッシュを生成してメインスレッドに送信
async function generateAndSendMesh(cx: number, cy: number, cz: number) {
	const key = `${cx},${cy},${cz}`;

	// 1. チャンクデータを取得 (キャッシュ or 新規生成)
	const chunkData = await getChunkData(cx, cy, cz);

	// 2. WASMでメッシュ生成
	await initializeWasm();
	const mesh = generator!.generate_chunk_mesh(chunkData) as GeneratedMesh;

	// 3. メインスレッドに転送
	const response: WorkerResponseMessage = {
		type: "chunkMesh",
		chunkKey: key,
		mesh: mesh,
	};
	self.postMessage(
		response,
		{
			transfer: [
				mesh.positions,
				mesh.normals,
				mesh.uvs, // UVs追加
				mesh.indices,
			],
		}
	);
}

// ブロックを設置/破壊
async function setBlock(worldX: number, worldY: number, worldZ: number, blockId: number) {
	// 1. ワールド座標 -> チャンク座標 + ローカル座標
	const cx = Math.floor(worldX / CHUNK_SIZE_X);
	const cy = Math.floor(worldY / CHUNK_SIZE_Y);
	const cz = Math.floor(worldZ / CHUNK_SIZE_Z);

	const lx = worldX - cx * CHUNK_SIZE_X;
	const ly = worldY - cy * CHUNK_SIZE_Y;
	const lz = worldZ - cz * CHUNK_SIZE_Z;

	// 2. 対象チャンクのデータを取得 (キャッシュ or 新規生成)
	const chunkData = await getChunkData(cx, cy, cz);

	// 3. データを変更
	const index = xyz_to_index(lx, ly, lz);
	if (index < 0 || index >= CHUNK_VOLUME) {
		console.error("setBlock: インデックスが範囲外です", { lx, ly, lz });
		return;
	}

	// 既に同じブロックなら何もしない
	if (chunkData[index] === blockId) return;

	chunkData[index] = blockId;

	// 4. キャッシュを更新
	chunkDataCache.set(`${cx},${cy},${cz}`, chunkData);

	// 5. IndexedDBに非同期で保存
	// (エラーハンドリングは省略。本来はリトライ処理などが必要)
	db.setChunk(`${cx},${cy},${cz}`, chunkData).catch(console.error);

	// 6. メッシュを再生成して送信
	await generateAndSendMesh(cx, cy, cz);

	// 7. チャンク境界チェック (重要)
	// もし変更したブロックがチャンクの端だった場合、隣のチャンクのメッシュも更新
	if (lx === 0 && chunkDataCache.has(`${cx - 1},${cy},${cz}`)) {
		await generateAndSendMesh(cx - 1, cy, cz);
	}
	if (lx === CHUNK_SIZE_X - 1 && chunkDataCache.has(`${cx + 1},${cy},${cz}`)) {
		await generateAndSendMesh(cx + 1, cy, cz);
	}
	if (ly === 0 && chunkDataCache.has(`${cx},${cy - 1},${cz}`)) {
		await generateAndSendMesh(cx, cy - 1, cz);
	}
	if (ly === CHUNK_SIZE_Y - 1 && chunkDataCache.has(`${cx},${cy + 1},${cz}`)) {
		await generateAndSendMesh(cx, cy + 1, cz);
	}
	if (lz === 0 && chunkDataCache.has(`${cx},${cy},${cz - 1}`)) {
		await generateAndSendMesh(cx, cy, cz - 1);
	}
	if (lz === CHUNK_SIZE_Z - 1 && chunkDataCache.has(`${cx},${cy},${cz + 1}`)) {
		await generateAndSendMesh(cx, cy, cz + 1);
	}
}

// --- メインスレッドからのメッセージ受信 ---
self.onmessage = async (e: MessageEvent<WorkerRequestMessage>) => {
	const msg = e.data;

	try {
		switch (msg.type) {
			case "loadWorld":
				await initializeWasm();
				await loadWorldFromDB();
				break;

			case "generate":
				await generateAndSendMesh(msg.chunkX, msg.chunkY, msg.chunkZ);
				break;

			case "setBlock":
				await setBlock(msg.worldX, msg.worldY, msg.worldZ, msg.blockId);
				break;

			case "saveWorld":
				// setBlock時に自動保存されるため、ここでは特に何もしない
				// (もし手動セーブにする場合は、ここでキャッシュをDBに書き込む)
				console.log("Worker: (自動保存のため手動保存はスキップ)");
				break;
		}
	} catch (error) {
		console.error("Worker: メッセージ処理中にエラーが発生", error);
	}
};

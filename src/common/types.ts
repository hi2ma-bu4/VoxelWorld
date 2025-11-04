// --- ブロック定義 ---
export const BLOCK_AIR = 0;
export const BLOCK_GRASS = 1;
export const BLOCK_DIRT = 2;
export const BLOCK_STONE = 3;

// --- チャンク定義 ---
export const CHUNK_SIZE_X = 16;
export const CHUNK_SIZE_Y = 16;
export const CHUNK_SIZE_Z = 16;
export const CHUNK_VOLUME = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

// 3D -> 1D インデックス変換 (JS側)
export function xyz_to_index(x: number, y: number, z: number): number {
	return x + z * CHUNK_SIZE_X + y * CHUNK_SIZE_X * CHUNK_SIZE_Z;
}

// 1D -> 3D インデックス変換 (JS側)
export function index_to_xyz(index: number): [number, number, number] {
	const y = Math.floor(index / (CHUNK_SIZE_X * CHUNK_SIZE_Z));
	const z = Math.floor((index % (CHUNK_SIZE_X * CHUNK_SIZE_Z)) / CHUNK_SIZE_X);
	const x = index % CHUNK_SIZE_X;
	return [x, y, z];
}

// --- Worker <-> Main ---

// Worker -> Main メッシュデータ
export interface GeneratedMesh {
	positions: ArrayBuffer;
	normals: ArrayBuffer;
	uvs: ArrayBuffer;
	indices: ArrayBuffer;
}

// Worker -> Main メッセージ
export type WorkerResponseMessage =
	| {
			type: "worldLoaded"; // ワールド読み込み完了
	  }
	| {
			type: "chunkMesh"; // チャンクメッシュ生成完了
			chunkKey: string;
			mesh: GeneratedMesh;
	  };

// Main -> Worker メッセージ
export type WorkerRequestMessage =
	| {
			type: "loadWorld"; // ワールド読み込み要求
	  }
	| {
			type: "generate"; // チャンク生成要求
			chunkX: number;
			chunkY: number;
			chunkZ: number;
			chunkKey: string;
	  }
	| {
			type: "setBlock"; // ブロック設置/破壊
			worldX: number;
			worldY: number;
			worldZ: number;
			blockId: number;
	  }
	| {
			type: "saveWorld"; // (手動保存用だが今回は setBlock で自動保存)
	  };

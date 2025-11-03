const DB_NAME = "MyVoxelWorldDB";
const DB_VERSION = 1;
const STORE_NAME = "chunks";

export class IndexedDBManager {
	private db: IDBDatabase | null = null;

	// データベースを開く
	public async openDB(): Promise<void> {
		return new Promise((resolve, reject) => {
			if (this.db) {
				resolve();
				return;
			}

			const request = indexedDB.open(DB_NAME, DB_VERSION);

			request.onerror = () => {
				console.error("IndexedDB error:", request.error);
				reject(new Error("Failed to open DB"));
			};

			request.onsuccess = (event) => {
				this.db = (event.target as IDBOpenDBRequest).result;
				resolve();
			};

			// データベースのバージョンアップ時 (初回作成時)
			request.onupgradeneeded = (event) => {
				const db = (event.target as IDBOpenDBRequest).result;
				if (!db.objectStoreNames.contains(STORE_NAME)) {
					db.createObjectStore(STORE_NAME, { keyPath: "key" });
				}
			};
		});
	}

	// チャンクをDBに保存 (上書き)
	public async setChunk(key: string, data: Uint8Array): Promise<void> {
		if (!this.db) await this.openDB();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(STORE_NAME, "readwrite");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.put({ key: key, data: data });

			request.onsuccess = () => resolve();
			request.onerror = () => reject(request.error);
		});
	}

	// チャンクをDBから取得
	public async getChunk(key: string): Promise<Uint8Array | null> {
		if (!this.db) await this.openDB();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(STORE_NAME, "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.get(key);

			request.onsuccess = () => {
				resolve(request.result ? request.result.data : null);
			};
			request.onerror = () => reject(request.error);
		});
	}

	// 保存されている全てのチャンクデータを取得 (起動時用)
	public async getAllChunks(): Promise<Map<string, Uint8Array>> {
		if (!this.db) await this.openDB();

		return new Promise((resolve, reject) => {
			const transaction = this.db!.transaction(STORE_NAME, "readonly");
			const store = transaction.objectStore(STORE_NAME);
			const request = store.getAll();

			request.onsuccess = () => {
				const map = new Map<string, Uint8Array>();
				for (const item of request.result) {
					map.set(item.key, item.data);
				}
				resolve(map);
			};
			request.onerror = () => reject(request.error);
		});
	}
}

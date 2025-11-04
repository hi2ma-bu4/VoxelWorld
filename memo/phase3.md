## 🏔️ フェーズ3: 物理演算・インベントリ・最終調整

このフェーズでは、プレイヤーの物理演算（重力、ジャンプ、衝突判定）、インベントリ（ホットバー）、UIの改善を実装します。

**アーキテクチャに関する重要な変更:**
正確な衝突判定をメインスレッドで（同期的に）行うため、**ブロックデータの管理主体を `WorldWorker.ts` からメインスレッドの `World.ts` に移管します。**
Workerは純粋な「地形データ生成」と「メッシュ生成」の計算のみを担当するようになります。

### ⚠️ 実行前の準備

Rustのコード (`lib.rs`) がわずかに変更されています（主にWASMに公開する関数の調整）。フェーズ2でビルド済みであっても、念のため**WASMを再ビルド**してください。

```bash
wasm-pack build ./src-rust --target web --out-dir ./src/rust-pkg
```

-----

## 📄 1. 公開ファイル (`public/`)

### `public/index.html` (変更)

(インベントリ(ホットバー)のHTMLを追加し、説明文を更新)

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Voxel World (Final)</title>
    <link rel="stylesheet" href="/style.css" />
  </head>
  <body>
    <canvas id="main-canvas"></canvas>

    <div id="ui-container">
      <div id="reticle">+</div>
      <div id="instructions">
        クリックして操作開始 (W, A, S, Dキーで移動, Spaceでジャンプ)<br />
        左クリック: 破壊 / 右クリック: 設置 (1, 2, 3キーでブロック切替)
      </div>
      <div id="loading-screen">
        <div class="spinner"></div>
        <p>ワールドを読み込み中...</p>
      </div>
      <button id="save-button">ワールドを保存</button>

      <div id="hotbar">
        <div class="slot active" data-block-id="1">草</div>
        <div class="slot" data-block-id="2">土</div>
        <div class="slot" data-block-id="3">石</div>
      </div>

    </div>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

### `public/style.css` (変更)

(ホットバーのスタイルを追加)

```css
body {
  margin: 0;
  font-family: sans-serif;
  color: white;
  background-color: #333;
  overflow: hidden; /* スクロールバー非表示 */
}

/* キャンバスを全画面表示 */
#main-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #87ceeb;
}

/* UIコンテナ */
#ui-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* UIはクリックを透過 (ボタン除く) */
}

/* 十字線 */
#reticle {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 24px;
  color: rgba(255, 255, 255, 0.7);
}

/* 操作説明 */
#instructions {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -100px);
  background: rgba(0, 0, 0, 0.5);
  padding: 10px 20px;
  border-radius: 5px;
  text-align: center;
}

/* PointerLock (操作中) のスタイル */
body.locked #instructions {
  display: none;
}
body:not(.locked) #reticle {
  display: none;
}
body:not(.locked) #instructions {
  display: block;
}

/* --- ローディング画面 --- */
#loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
  transition: opacity 0.5s;
}
#loading-screen.hidden {
  opacity: 0;
  pointer-events: none;
}
.spinner {
  border: 8px solid #f3f3f3;
  border-top: 8px solid #3498db;
  border-radius: 50%;
  width: 60px;
  height: 60px;
  animation: spin 1s linear infinite;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* --- セーブボタン --- */
#save-button {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  pointer-events: all; /* ボタンだけクリック可能に */
  z-index: 50;
}
#save-button:hover {
  background: #45a049;
}

/* --- インベントリ (ホットバー) --- */
#hotbar {
  position: fixed;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 5px;
  user-select: none;
}
.slot {
  width: 50px;
  height: 50px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #555;
  margin: 5px;
  background: rgba(0, 0, 0, 0.2);
  color: #ddd;
  font-size: 14px;
}
.slot.active {
  border-color: #fff;
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}
```

-----

## 🦀 2. Rust (WASM) コード (`src-rust/`)

### `src-rust/src/lib.rs` (変更)

(フェーズ2の `generate_chunk_mesh` 関数は `uvs` を含んでいました。このコードはフェーズ2の最終状態を反映しています。)

```rust
mod chunk;
mod generation;
mod meshing;

use wasm_bindgen::prelude::*;

// JS側で new WorldGenerator() のように使えるようになる
#[wasm_bindgen]
pub struct WorldGenerator {
    generator: generation::TerrainGenerator,
}

#[wasm_bindgen]
impl WorldGenerator {
    // コンストラクタ (JS: new WorldGenerator(seed))
    #[wasm_bindgen(constructor)]
    pub fn new(seed: u32) -> Self {
        Self {
            generator: generation::TerrainGenerator::new(seed),
        }
    }

    // チャンクデータを生成 (ブロックIDの配列)
    // JS側には Uint8Array として渡される
    #[wasm_bindgen]
    pub fn generate_chunk_data(&self, chunk_x: i32, chunk_y: i32, chunk_z: i32) -> Box<[u8]> {
        let blocks = self.generator.generate_chunk(chunk_x, chunk_y, chunk_z);
        blocks.into_boxed_slice()
    }

    // チャンクデータからメッシュを生成
    // (フェーズ2でUVs追加済み)
    #[wasm_bindgen]
    pub fn generate_chunk_mesh(&self, chunk_data: &[u8]) -> JsValue {
        let mesh_data = meshing::generate_mesh(chunk_data);
        
        // メッシュデータをJSの型 (Float32Array, Uint32Array) に変換
        let positions = js_sys::Float32Array::from(mesh_data.positions.as_slice());
        let normals = js_sys::Float32Array::from(mesh_data.normals.as_slice());
        let uvs = js_sys::Float32Array::from(mesh_data.uvs.as_slice()); // UVs
        let indices = js_sys::Uint32Array::from(mesh_data.indices.as_slice());

        // JSオブジェクトを作成して返す
        let obj = js_sys::Object::new();
        js_sys::Reflect::set(&obj, &"positions".into(), &positions.buffer()).unwrap();
        js_sys::Reflect::set(&obj, &"normals".into(), &normals.buffer()).unwrap();
        js_sys::Reflect::set(&obj, &"uvs".into(), &uvs.buffer()).unwrap(); // UVs
        js_sys::Reflect::set(&obj, &"indices".into(), &indices.buffer()).unwrap();
        
        obj.into()
    }
}

// WASMモジュール初期化時に一度だけ呼ばれる
#[wasm_bindgen(start)]
pub fn setup() {
    // WASMがパニックしたときにJSコンソールにエラーを表示
    console_error_panic_hook::set_once();
}
```

-----

## 💻 3. TypeScript (メイン) コード (`src/`)

### `src/common/types.ts` (変更)

(アーキテクチャ変更に伴い、Workerとの通信メッセージを変更。衝突判定用のヘルパー関数を追加。)

```typescript
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
  return x + (z * CHUNK_SIZE_X) + (y * CHUNK_SIZE_X * CHUNK_SIZE_Z);
}

// 1D -> 3D インデックス変換 (JS側)
export function index_to_xyz(index: number): [number, number, number] {
  const y = Math.floor(index / (CHUNK_SIZE_X * CHUNK_SIZE_Z));
  const z = Math.floor((index % (CHUNK_SIZE_X * CHUNK_SIZE_Z)) / CHUNK_SIZE_X);
  const x = index % CHUNK_SIZE_X;
  return [x, y, z];
}

// --- ブロックの当たり判定 (AABB) ---
export function is_block_solid(blockId: number): boolean {
  return blockId !== BLOCK_AIR;
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
      type: 'chunkGenerated'; // 地形データ生成完了
      chunkKey: string;
      chunkData: Uint8Array;
    }
  | {
      type: 'chunkMesh';   // チャンクメッシュ生成完了
      chunkKey: string;
      mesh: GeneratedMesh;
    };

// Main -> Worker メッセージ
export type WorkerRequestMessage = 
  | {
      type: 'init'; // WASM初期化
      wasmUrl: string;
    }
  | {
      type: 'generateData'; // チャンクデータ生成要求
      chunkX: number;
      chunkY: number;
      chunkZ: number;
      chunkKey: string;
    }
  | {
      type: 'generateMesh'; // メッシュ生成要求
      chunkKey: string;
      chunkData: Uint8Array;
    };
```

### `src/world/WorldWorker.ts` (大幅変更)

(WorkerからデータキャッシュとIndexedDBロジックを削除。純粋なWASM計算機になります。)

```typescript
import init, { WorldGenerator } from '../rust-pkg';
// import wasmUrl from '../rust-pkg/my_voxel_world_bg.wasm?url'; (main.tsから渡される)
import { 
  type WorkerRequestMessage, 
  type WorkerResponseMessage,
  type GeneratedMesh
} from '../common/types';

console.log('Worker: スクリプト読み込み完了');

let generator: WorldGenerator | null = null;

// WASMの初期化
async function initializeWasm(wasmUrl: string) {
  if (generator) return;
  console.log('Worker: WASMモジュール初期化開始...');
  await init(wasmUrl);
  generator = new WorldGenerator(12345); // 固定シード
  console.log('Worker: WASMモジュール初期化完了');
}

// チャンクデータを生成 (WASM)
async function generateData(chunkX: number, chunkY: number, chunkZ: number, chunkKey: string) {
  if (!generator) {
    console.error('Worker: WASM 未初期化');
    return;
  }
  
  const newData = generator.generate_chunk_data(chunkX, chunkY, chunkZ);
  const chunkData = new Uint8Array(newData); // Box<[u8]> -> Uint8Array
  
  // メインスレッドにデータを転送
  const response: WorkerResponseMessage = {
    type: 'chunkGenerated',
    chunkKey: chunkKey,
    chunkData: chunkData,
  };
  // chunkData.buffer を Transferable として転送
  self.postMessage(response, [chunkData.buffer]);
}

// チャンクメッシュを生成 (WASM)
async function generateMesh(chunkKey: string, chunkData: Uint8Array) {
  if (!generator) {
    console.error('Worker: WASM 未初期化');
    return;
  }

  // メッシュ生成
  const mesh = generator.generate_chunk_mesh(chunkData) as GeneratedMesh;

  // メインスレッドにメッシュを転送
  const response: WorkerResponseMessage = {
    type: 'chunkMesh',
    chunkKey: chunkKey,
    mesh: mesh,
  };
  self.postMessage(response, [
    mesh.positions,
    mesh.normals,
    mesh.uvs,
    mesh.indices,
  ]);
}


// --- メインスレッドからのメッセージ受信 ---
self.onmessage = async (e: MessageEvent<WorkerRequestMessage>) => {
  const msg = e.data;

  try {
    switch (msg.type) {
      case 'init':
        await initializeWasm(msg.wasmUrl);
        break;
      
      case 'generateData':
        // 地形データ生成を依頼された
        await generateData(msg.chunkX, msg.chunkY, msg.chunkZ, msg.chunkKey);
        break;

      case 'generateMesh':
        // メッシュ生成を依頼された
        await generateMesh(msg.chunkKey, msg.chunkData);
        break;
    }
  } catch (error) {
    console.error('Worker: メッセージ処理中にエラーが発生', error);
  }
};
```

### `src/world/World.ts` (大幅変更)

(IndexedDB、ブロックデータキャッシュ(`chunkDataCache`)、ブロック操作 (`setBlock`) ロジックをメインスレッドに実装)

```typescript
import * as THREE from 'three';
import { 
  BLOCK_AIR, BLOCK_STONE, BLOCK_DIRT, BLOCK_GRASS,
  CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z,
  is_block_solid, xyz_to_index,
  type WorkerRequestMessage, type WorkerResponseMessage, type GeneratedMesh
} from '../common/types';
import type { Renderer } from '../rendering/Renderer';
import type { Player } from '../rendering/Player';
import { IndexedDBManager } from './IndexedDB';
// wasmUrlはmain.tsからWorkerに渡される
import wasmUrl from '../rust-pkg/my_voxel_world_bg.wasm?url';

// ワールドの描画範囲
const RENDER_DISTANCE_X = 4;
const RENDER_DISTANCE_Z = 4;
const WORLD_HEIGHT_Y = 2; // Y=0 と 1

export class World {
  private renderer: Renderer;
  public player: Player; // main.tsからセットされる
  private worker: Worker;
  
  // 描画用メッシュ
  private chunks = new Map<string, THREE.Mesh>();
  // メッシュ生成リクエスト中
  private requestedChunks = new Set<string>();

  // --- フェーズ3: データ管理をメインスレッドに移行 ---
  private db = new IndexedDBManager();
  // ブロックデータ本体 (メインスレッドで管理)
  private chunkDataCache = new Map<string, Uint8Array>();
  // 地形データ生成リクエスト中
  private generatingData = new Set<string>();
  // ---

  private texture: THREE.Texture;
  private chunkMaterial: THREE.MeshStandardMaterial;
  private raycaster = new THREE.Raycaster();
  private selectionBox: THREE.Mesh;
  
  public selectedBlock = {
    position: new THREE.Vector3(),
    normal: new THREE.Vector3(),
    exists: false,
  };
  public currentPlaceBlockId = BLOCK_STONE; // 現在設置するブロック

  constructor(renderer: Renderer, player: Player, texture: THREE.Texture) {
    this.renderer = renderer;
    this.player = player; // (初期化中は仮のオブジェクトの場合がある)
    this.texture = texture;

    // テクスチャ設定
    this.texture.magFilter = THREE.NearestFilter;
    this.texture.minFilter = THREE.NearestFilter;
    
    // マテリアル
    this.chunkMaterial = new THREE.MeshStandardMaterial({
      map: this.texture,
      side: THREE.FrontSide,
    });

    // ブロック選択ハイライト
    const selectionGeom = new THREE.BoxGeometry(1.001, 1.001, 1.001);
    const selectionMat = new THREE.MeshBasicMaterial({ 
      color: 0xffffff, 
      wireframe: true, 
      transparent: true, 
      opacity: 0.5 
    });
    this.selectionBox = new THREE.Mesh(selectionGeom, selectionMat);
    this.selectionBox.visible = false;
    this.renderer.scene.add(this.selectionBox);

    // Web Worker初期化
    this.worker = new Worker(new URL('./WorldWorker.ts', import.meta.url), {
      type: 'module',
    });

    // Workerからのメッセージ受信
    this.worker.onmessage = (e: MessageEvent<WorkerResponseMessage>) => {
      
      if (e.data.type === 'chunkGenerated') {
        // 1. Workerが生成した地形データを受け取り、キャッシュに保存
        this.chunkDataCache.set(e.data.chunkKey, e.data.chunkData);
        this.generatingData.delete(e.data.chunkKey);
        // 2. すぐにメッシュ生成をリクエスト
        this.requestMeshGeneration(e.data.chunkKey, e.data.chunkData);
      
      } else if (e.data.type === 'chunkMesh') {
        // 3. Workerが生成したメッシュを受け取り、シーンに追加
        this.addChunkMesh(e.data.chunkKey, e.data.mesh);
      }
    };

    // WorkerにWASMの初期化を指示
    this.worker.postMessage({ type: 'init', wasmUrl: wasmUrl } as WorkerRequestMessage);
    
    // DBからワールド読み込み開始
    this.loadWorldFromDB();
  }

  // DBから全チャンクを読み込み、キャッシュに入れる
  private async loadWorldFromDB() {
    await this.db.openDB();
    const allChunks = await this.db.getAllChunks();
    allChunks.forEach((data, key) => {
      this.chunkDataCache.set(key, data);
    });
    console.log(`Main: ${allChunks.size}個のチャンクをDBから読み込みました`);
    
    // ローディング画面を非表示
    (document.getElementById('loading-screen') as HTMLElement).classList.add('hidden');
    // 最初のチャンク読み込みを開始
    this.loadChunksAroundPlayer();
  }

  // Workerから受信したメッシュをシーンに追加
  private addChunkMesh(
    chunkKey: string,
    meshData: GeneratedMesh
  ) {
    // 既存メッシュの削除
    if (this.chunks.has(chunkKey)) {
      const oldMesh = this.chunks.get(chunkKey)!;
      this.renderer.scene.remove(oldMesh);
      oldMesh.geometry.dispose();
    }

    // ジオメトリ作成
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(meshData.positions), 3));
    geometry.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(meshData.normals), 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(meshData.uvs), 2));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(meshData.indices), 1));
    
    // メッシュ作成
    const mesh = new THREE.Mesh(geometry, this.chunkMaterial);
    const [cx, cy, cz] = chunkKey.split(',').map(Number);
    mesh.position.set(cx * CHUNK_SIZE_X, cy * CHUNK_SIZE_Y, cz * CHUNK_SIZE_Z);
    mesh.name = chunkKey; // Raycast用

    this.chunks.set(chunkKey, mesh);
    this.renderer.scene.add(mesh);
    this.requestedChunks.delete(chunkKey); // リクエスト中セットから削除
  }

  // ワールドの更新 (毎フレーム)
  update() {
    // Playerオブジェクトがまだ設定されていなければ何もしない
    if (!this.player || !this.player.controls) return;
    
    this.loadChunksAroundPlayer();
    this.updateRaycaster();
  }
  
  // プレイヤー周辺のチャンクを読み込む
  private loadChunksAroundPlayer() {
    const [playerCX, playerCZ] = this.getPlayerChunkPosition();

    for (let x = -RENDER_DISTANCE_X; x <= RENDER_DISTANCE_X; x++) {
      for (let z = -RENDER_DISTANCE_Z; z <= RENDER_DISTANCE_Z; z++) {
        for (let y = 0; y < WORLD_HEIGHT_Y; y++) {
          const cx = playerCX + x;
          const cy = y;
          const cz = playerCZ + z;
          const chunkKey = `${cx},${cy},${cz}`;

          // 1. データもメッシュも無い (かつデータ生成リクエストもしていない)
          if (!this.chunkDataCache.has(chunkKey) && !this.generatingData.has(chunkKey)) {
            // Workerに地形データ生成をリクエスト
            this.generatingData.add(chunkKey);
            const request: WorkerRequestMessage = {
              type: 'generateData',
              chunkX: cx,
              chunkY: cy,
              chunkZ: cz,
              chunkKey: chunkKey,
            };
            this.worker.postMessage(request);
          }
          // 2. データはあるがメッシュが無い (かつメッシュ生成リクエストもしていない)
          else if (this.chunkDataCache.has(chunkKey) && !this.chunks.has(chunkKey) && !this.requestedChunks.has(chunkKey)) {
            // Workerにメッシュ生成をリクエスト
            this.requestMeshGeneration(chunkKey, this.chunkDataCache.get(chunkKey)!);
          }
        }
      }
    }
    // TODO: 遠くのチャンクをアンロードする処理
  }

  // Workerにメッシュ生成を依頼
  private requestMeshGeneration(chunkKey: string, chunkData: Uint8Array) {
    this.requestedChunks.add(chunkKey);
    const request: WorkerRequestMessage = {
      type: 'generateMesh',
      chunkKey: chunkKey,
      chunkData: chunkData,
    };
    // chunkDataをコピーして渡す (Transferableではないため)
    // ※ パフォーマンスが問題になる場合、SharedArrayBufferの使用を検討
    this.worker.postMessage(request);
  }

  private getPlayerChunkPosition(): [number, number] {
    const pos = this.player.controls.getObject().position;
    const cx = Math.floor(pos.x / CHUNK_SIZE_X);
    const cz = Math.floor(pos.z / CHUNK_SIZE_Z);
    return [cx, cz];
  }

  // --- Raycaster (フェーズ2と同じ) ---
  private updateRaycaster() {
    if (!this.player.controls.isLocked) {
      this.selectionBox.visible = false;
      this.selectedBlock.exists = false;
      return;
    }
    this.raycaster.setFromCamera({ x: 0, y: 0 }, this.renderer.camera); // 画面中央
    const intersects = this.raycaster.intersectObjects(Array.from(this.chunks.values()), false);

    if (intersects.length > 0) {
      const intersection = intersects[0];
      // 5ブロック以上離れていたら無視
      if (intersection.distance > 5) {
          this.selectionBox.visible = false;
          this.selectedBlock.exists = false;
          return;
      }

      const pos = intersection.point;
      const normal = intersection.face!.normal;
      // ブロックの中心にスナップ
      const blockPos = new THREE.Vector3(
        Math.floor(pos.x - normal.x * 0.5),
        Math.floor(pos.y - normal.y * 0.5),
        Math.floor(pos.z - normal.z * 0.5)
      );
      this.selectionBox.position.set(blockPos.x + 0.5, blockPos.y + 0.5, blockPos.z + 0.5);
      this.selectionBox.visible = true;
      this.selectedBlock.position.copy(blockPos);
      this.selectedBlock.normal.copy(normal);
      this.selectedBlock.exists = true;
    } else {
      this.selectionBox.visible = false;
      this.selectedBlock.exists = false;
    }
  }

  // --- フェーズ3: メインスレッドでのブロック操作 ---

  // 指定座標のブロックIDを取得 (衝突判定用)
  public getBlock(wx: number, wy: number, wz: number): number {
    const wxFloor = Math.floor(wx);
    const wyFloor = Math.floor(wy);
    const wzFloor = Math.floor(wz);
    
    // チャンク座標
    const cx = Math.floor(wxFloor / CHUNK_SIZE_X);
    const cy = Math.floor(wyFloor / CHUNK_SIZE_Y);
    const cz = Math.floor(wzFloor / CHUNK_SIZE_Z);
    const chunkKey = `${cx},${cy},${cz}`;

    const chunkData = this.chunkDataCache.get(chunkKey);
    if (!chunkData) {
      // Y=0未満は石、それ以外は空気（簡易的な無限ワールド）
      return wyFloor < 0 ? BLOCK_STONE : BLOCK_AIR;
    }

    // ローカル座標
    const lx = wxFloor - (cx * CHUNK_SIZE_X);
    const ly = wyFloor - (cy * CHUNK_SIZE_Y);
    const lz = wzFloor - (cz * CHUNK_SIZE_Z);
    
    const index = xyz_to_index(lx, ly, lz);
    if (index < 0 || index >= chunkData.length) {
        console.warn("getBlock index out of bounds");
        return BLOCK_AIR;
    }
    return chunkData[index];
  }

  // ブロックを設置/破壊 (メインスレッドでデータ変更)
  private setBlock(wx: number, wy: number, wz: number, blockId: number) {
    const cx = Math.floor(wx / CHUNK_SIZE_X);
    const cy = Math.floor(wy / CHUNK_SIZE_Y);
    const cz = Math.floor(wz / CHUNK_SIZE_Z);
    const chunkKey = `${cx},${cy},${cz}`;

    const chunkData = this.chunkDataCache.get(chunkKey);
    // 存在しないチャンク (生成前) には設置/破壊できない
    if (!chunkData) return;
    
    const lx = wx - (cx * CHUNK_SIZE_X);
    const ly = wy - (cy * CHUNK_SIZE_Y);
    const lz = wz - (cz * CHUNK_SIZE_Z);
    const index = xyz_to_index(lx, ly, lz);

    if (chunkData[index] === blockId) return; // 変更なし

    // 1. データを変更
    chunkData[index] = blockId;
    
    // 2. DBに非同期で保存
    this.db.setChunk(chunkKey, chunkData).catch(console.error);

    // 3. このチャンクのメッシュを再生成
    this.requestMeshGeneration(chunkKey, chunkData);

    // 4. チャンク境界の隣接メッシュも更新
    if (lx === 0) this.updateNeighborMesh(cx - 1, cy, cz);
    if (lx === CHUNK_SIZE_X - 1) this.updateNeighborMesh(cx + 1, cy, cz);
    if (ly === 0) this.updateNeighborMesh(cx, cy - 1, cz);
    if (ly === CHUNK_SIZE_Y - 1) this.updateNeighborMesh(cx, cy + 1, cz);
    if (lz === 0) this.updateNeighborMesh(cx, cy, cz - 1);
    if (lz === CHUNK_SIZE_Z - 1) this.updateNeighborMesh(cx, cy, cz + 1);
  }
  
  // 隣接チャンクのメッシュを更新 (データが存在すれば)
  private updateNeighborMesh(cx: number, cy: number, cz: number) {
    const key = `${cx},${cy},${cz}`;
    const data = this.chunkDataCache.get(key);
    if (data) {
      this.requestMeshGeneration(key, data);
    }
  }

  // ブロックを破壊
  public breakBlock() {
    if (!this.selectedBlock.exists) return;
    const { x, y, z } = this.selectedBlock.position;
    this.setBlock(x, y, z, BLOCK_AIR);
  }

  // ブロックを設置
  public placeBlock() {
    if (!this.selectedBlock.exists) return;

    const { position, normal } = this.selectedBlock;
    const x = position.x + normal.x;
    const y = position.y + normal.y;
    const z = position.z + normal.z;

    // プレイヤーと重なるかチェック
    if (this.player.isCollidingWithPlayer(x, y, z)) {
      return; // 重なる場合は設置しない
    }

    this.setBlock(x, y, z, this.currentPlaceBlockId);
  }

  // インベントリ切り替え
  public setSelectedBlockType(id: number) {
    this.currentPlaceBlockId = id;
    
    // UIの .active クラスを更新
    document.querySelectorAll('#hotbar .slot').forEach(slot => {
      slot.classList.remove('active');
      if (parseInt((slot as HTMLElement).dataset.blockId!) === id) {
        slot.classList.add('active');
      }
    });
  }

  // ワールド保存
  public saveWorld() {
    console.log('Main: ワールド保存中...');
    // (setBlock時に自動保存しているので、実質DBへの書き込みは完了している)
    alert('ワールドは自動保存されています');
  }
}
```

### `src/rendering/Player.ts` (大幅変更)

(重力、ジャンプ、AABB（軸並行境界ボックス）による衝突判定を実装)

```typescript
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import type { World } from '../world/World';
import { is_block_solid } from '../common/types';

// --- 物理定数 ---
const GRAVITY = 30.0;
const JUMP_VELOCITY = 10.0;
const MOVE_SPEED = 5.0; // 移動速度
const PLAYER_HEIGHT = 1.8; // プレイヤーの身長
const PLAYER_WIDTH = 0.4; // プレイヤーの幅 (半径)
const EYE_HEIGHT = 1.6; // 視点の高さ (身長より低い)

export class Player {
  public controls: PointerLockControls;
  private camera: THREE.Camera;
  private world: World; // 衝突判定用のワールド
  
  // 移動関連
  private velocity = new THREE.Vector3(0, 0, 0);
  private direction = new THREE.Vector3();
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private isOnGround = false;

  private prevTime: number;
  // プレイヤーのAABB (当たり判定)
  private playerBox = new THREE.Box3();

  constructor(camera: THREE.Camera, domElement: HTMLElement, world: World) {
    this.camera = camera;
    this.world = world;
    this.controls = new PointerLockControls(camera, domElement);
    this.prevTime = performance.now();

    // プレイヤーの初期位置 (地表より少し上)
    this.camera.position.set(8, 50, 8); // Y=50 (高い位置)
    // PointerLockControls はカメラを直接動かすため、
    // カメラ(視点)の高さをAABBの中心からずらす
    this.camera.position.y = 50 + EYE_HEIGHT;

    // PointerLock イベント
    this.controls.addEventListener('lock', () => {
      document.body.classList.add('locked');
    });
    this.controls.addEventListener('unlock', () => {
      document.body.classList.remove('locked');
    });

    // 画面クリックで操作開始
    domElement.addEventListener('click', () => {
      if (!this.controls.isLocked) {
        this.controls.lock();
      }
    });

    // キー入力
    document.addEventListener('keydown', (e) => this.onKeyDown(e.key));
    document.addEventListener('keyup', (e) => this.onKeyUp(e.key));
  }

  private onKeyDown(key: string) {
    switch (key.toLowerCase()) {
      case 'w': this.moveForward = true; break;
      case 'a': this.moveLeft = true; break;
      case 's': this.moveBackward = true; break;
      case 'd': this.moveRight = true; break;
      case ' ': // ジャンプ
        if (this.isOnGround) {
          this.velocity.y = JUMP_VELOCITY;
        }
        break;
    }
  }
  
  private onKeyUp(key: string) {
    switch (key.toLowerCase()) {
      case 'w': this.moveForward = false; break;
      case 'a': this.moveLeft = false; break;
      case 's': this.moveBackward = false; break;
      case 'd': this.moveRight = false; break;
    }
  }

  // プレイヤーが指定座標のブロックと重なるか (設置用)
  public isCollidingWithPlayer(x: number, y: number, z: number): boolean {
    const playerPos = this.controls.getObject().position;
    // プレイヤーの足元座標
    const playerFootPos = playerPos.y - EYE_HEIGHT;
    
    // ブロックのAABB
    const blockBox = new THREE.Box3(
      new THREE.Vector3(x, y, z),
      new THREE.Vector3(x + 1, y + 1, z + 1)
    );
    
    // プレイヤーのAABB (現在地)
    this.updatePlayerBox(playerPos.x, playerFootPos, playerPos.z);
    
    return this.playerBox.intersectsBox(blockBox);
  }

  // プレイヤーのAABBを更新 (中心座標ではなく足元(x, y, z)基準)
  private updatePlayerBox(x: number, y: number, z: number) {
    this.playerBox.set(
      // (X, Z) は中心から PLAYER_WIDTH ずらす
      new THREE.Vector3(x - PLAYER_WIDTH, y, z - PLAYER_WIDTH),
      // (Y) は足元から PLAYER_HEIGHT 上
      new THREE.Vector3(x + PLAYER_WIDTH, y + PLAYER_HEIGHT, z + PLAYER_WIDTH)
    );
  }

  // 毎フレーム更新 (物理演算)
  update() {
    if (!this.controls.isLocked) {
      return;
    }

    const time = performance.now();
    const delta = (time - this.prevTime) / 1000.0; // 経過時間 (秒)

    // --- 1. 入力による速度の計算 ---
    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize(); // 斜め移動が速くならないように

    // プレイヤーの向き（Y軸回転）を取得
    const cameraDirection = new THREE.Vector3();
    this.camera.getWorldDirection(cameraDirection);
    cameraDirection.y = 0; // 上下は見ない
    cameraDirection.normalize();

    const moveDirection = new THREE.Vector3();
    // 前後移動
    if (this.moveForward || this.moveBackward) {
      moveDirection.add(cameraDirection.clone().multiplyScalar(this.direction.z));
    }
    // 左右移動 (カメラの向きの90度横)
    if (this.moveLeft || this.moveRight) {
      const cross = new THREE.Vector3().crossVectors(this.camera.up, cameraDirection);
      moveDirection.add(cross.multiplyScalar(-this.direction.x));
    }
    moveDirection.normalize();

    // 最終的な水平速度 (Yは重力で計算)
    this.velocity.x = moveDirection.x * MOVE_SPEED;
    this.velocity.z = moveDirection.z * MOVE_SPEED;

    // --- 2. 重力 ---
    this.velocity.y -= GRAVITY * delta;

    // --- 3. 衝突判定と移動 ---
    const pos = this.controls.getObject().position;
    // プレイヤーの「足元」の座標 (カメラ位置 - 視点の高さ)
    let playerFootY = pos.y - EYE_HEIGHT;
    
    // Y軸 (垂直) の衝突判定
    let dy = this.velocity.y * delta;
    this.updatePlayerBox(pos.x, playerFootY + dy, pos.z);
    if (this.isColliding(this.playerBox)) {
      if (this.velocity.y < 0) { // 下に落ちている
        this.isOnGround = true;
        // 接地 (床にスナップ)
        playerFootY = Math.ceil(this.playerBox.min.y) - 0.001; // わずかに浮かせる
        dy = 0; // 垂直方向の移動をキャンセル
      }
      this.velocity.y = 0;
    } else {
      this.isOnGround = false;
    }
    playerFootY += dy; // Y座標を更新

    // X軸 (水平) の衝突判定
    let dx = this.velocity.x * delta;
    this.updatePlayerBox(pos.x + dx, playerFootY, pos.z);
    if (this.isColliding(this.playerBox)) {
      dx = 0; // 壁にぶつかった
    }
    pos.x += dx;

    // Z軸 (水平) の衝突判定
    let dz = this.velocity.z * delta;
    this.updatePlayerBox(pos.x, playerFootY, pos.z + dz);
    if (this.isColliding(this.playerBox)) {
      dz = 0; // 壁にぶつかった
    }
    pos.z += dz;
    
    // カメラ位置を更新 (足元の位置 + 視点の高さ)
    pos.y = playerFootY + EYE_HEIGHT;

    this.prevTime = time;
  }

  // AABBがワールドと衝突しているか判定
  private isColliding(box: THREE.Box3): boolean {
    // AABBの最小・最大のブロック座標
    const minX = Math.floor(box.min.x);
    const maxX = Math.floor(box.max.x);
    const minY = Math.floor(box.min.y);
    const maxY = Math.floor(box.max.y);
    const minZ = Math.floor(box.min.z);
    const maxZ = Math.floor(box.max.z);

    // AABBがまたぐ全てのブロックをチェック
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        for (let x = minX; x <= maxX; x++) {
          const blockId = this.world.getBlock(x, y, z);
          if (is_block_solid(blockId)) {
            return true; // 固いブロックと衝突
          }
        }
      }
    }
    return false;
  }
}
```

### `src/main.ts` (大幅変更)

(WorldとPlayerの相互参照を解決する初期化ロジックに変更。インベントリのキー入力を追加。)

```typescript
import * as THREE from 'three';
import { Renderer } from './rendering/Renderer';
import { Player } from './rendering/Player';
import { World } from './world/World';
import { BLOCK_DIRT, BLOCK_GRASS, BLOCK_STONE } from './common/types';

// --- 初期化処理 ---
async function main() {
  // 1. キャンバス要素
  const canvas = document.getElementById('main-canvas') as HTMLCanvasElement;
  if (!canvas) throw new Error('Canvas element not found');

  // 2. レンダリング
  const renderer = new Renderer(canvas);
  
  // 3. テクスチャ読み込み
  const textureLoader = new THREE.TextureLoader();
  const texture = await textureLoader.loadAsync('/textures.png');
  console.log('Main: テクスチャ読み込み完了');

  // 4. ワールドとプレイヤーの初期化 (相互参照の解決)
  // PlayerはWorldのgetBlock()を必要とし、
  // WorldはPlayerのgetPlayerChunkPosition()を必要とします。

  let world: World;
  let player: Player;

  // (1) 仮のPlayer参照を作成 (コンストラクタ内でまだ使われないプロパティに注意)
  const playerRef = {} as Player; 
  
  // (2) Worldを初期化 (内部でWorker起動、DB読み込み開始)
  // この時点では world.player は仮の参照
  world = new World(renderer, playerRef, texture);
  
  // (3) 本物のPlayerを初期化 (Worldインスタンスを渡す)
  player = new Player(renderer.camera, canvas, world);
  
  // (4) Worldに本物のPlayerをセット
  world.player = player;

  // 5. クリックイベント (ブロック操作)
  canvas.addEventListener('mousedown', (event) => {
    if (!player.controls.isLocked) return;
    switch (event.button) {
      case 0: // 左クリック
        world.breakBlock();
        break;
      case 2: // 右クリック
        world.placeBlock();
        break;
    }
  });
  
  // 右クリックメニューを無効化
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());

  // 6. セーブボタン
  const saveButton = document.getElementById('save-button') as HTMLButtonElement;
  saveButton.addEventListener('click', () => {
    world.saveWorld();
  });
  
  // 7. インベントリ (キー入力)
  document.addEventListener('keydown', (e) => {
    switch (e.key) {
      case '1': world.setSelectedBlockType(BLOCK_GRASS); break;
      case '2': world.setSelectedBlockType(BLOCK_DIRT); break;
      case '3': world.setSelectedBlockType(BLOCK_STONE); break;
    }
  });
  // 初期選択 (石)
  world.setSelectedBlockType(BLOCK_STONE);

  // 8. レンダリングループ開始
  function animate() {
    requestAnimationFrame(animate);

    // ワールドの状態更新 (チャンク読み込み、Raycastなど)
    world.update();
    
    // 描画 (内部でプレイヤーの物理演算・更新も行う)
    renderer.render(player);
  }

  // アニメーション開始
  animate();

  console.log('Main: アプリケーション初期化完了');
}

// アプリケーション実行
main().catch(console.error);
```

-----

## 🚀 変更のないファイル

以下のファイルは、フェーズ1またはフェーズ2から変更ありません。そのままご使用ください。

  * `src-rust/src/chunk.rs` (フェーズ1)
  * `src-rust/src/generation.rs` (フェーズ1)
  * `src-rust/src/meshing.rs` (フェーズ2)
  * `src/world/IndexedDB.ts` (フェーズ2)
  * `src/rendering/Renderer.ts` (フェーズ1)

これで、3つのフェーズ全てが結合され、機能が完結します。
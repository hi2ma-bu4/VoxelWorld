import * as THREE from "three";
import { BLOCK_AIR, BLOCK_STONE, CHUNK_SIZE_X, CHUNK_SIZE_Y, CHUNK_SIZE_Z, type WorkerRequestMessage, type WorkerResponseMessage } from "../common/types";
import type { Player } from "../rendering/Player";
import type { Renderer } from "../rendering/Renderer";

// ワールドの描画範囲 (フェーズ1と同じ)
const RENDER_DISTANCE_X = 4;
const RENDER_DISTANCE_Z = 4;
const WORLD_HEIGHT_Y = 2;

export class World {
	private renderer: Renderer;
	private player: Player;
	private worker: Worker;

	private chunks = new Map<string, THREE.Mesh>();
	private requestedChunks = new Set<string>();

	// --- フェーズ2 追加 ---
	private texture: THREE.Texture;
	private chunkMaterial: THREE.MeshStandardMaterial;
	private raycaster = new THREE.Raycaster();
	private selectionBox: THREE.Mesh; // ブロック選択ハイライト

	// 現在選択中のブロック (破壊/設置用)
	public selectedBlock = {
		position: new THREE.Vector3(), // 破壊対象のブロックのワールド座標
		normal: new THREE.Vector3(), // 破壊対象のブロックの面
		exists: false,
	};
	// ---

	constructor(renderer: Renderer, player: Player, texture: THREE.Texture) {
		this.renderer = renderer;
		this.player = player;
		this.texture = texture;

		// テクスチャ設定
		this.texture.magFilter = THREE.NearestFilter; // ピクセル感を出す
		this.texture.minFilter = THREE.NearestFilter;

		// マテリアル (テクスチャ使用)
		this.chunkMaterial = new THREE.MeshStandardMaterial({
			map: this.texture,
			side: THREE.FrontSide,
		});

		// ブロック選択ハイライト用のメッシュ
		const selectionGeom = new THREE.BoxGeometry(1.001, 1.001, 1.001); // 1.001にしてカリングを防ぐ
		const selectionMat = new THREE.MeshBasicMaterial({
			color: 0xffffff,
			wireframe: true,
			transparent: true,
			opacity: 0.5,
		});
		this.selectionBox = new THREE.Mesh(selectionGeom, selectionMat);
		this.selectionBox.visible = false;
		this.renderer.scene.add(this.selectionBox);

		// Web Worker初期化
		this.worker = new Worker(new URL("./WorldWorker.ts", import.meta.url), {
			type: "module",
		});

		this.worker.onmessage = (e: MessageEvent<WorkerResponseMessage>) => {
			if (e.data.type === "chunkMesh") {
				this.addChunkMesh(e.data.chunkKey, e.data.mesh);
			}
			if (e.data.type === "worldLoaded") {
				// ワールド読み込み完了
				(document.getElementById("loading-screen") as HTMLElement).classList.add("hidden");
				this.loadChunksAroundPlayer(); // 最初のチャンク読み込みを開始
			}
		};

		// Workerにワールド読み込みを要求
		this.worker.postMessage({ type: "loadWorld" } as WorkerRequestMessage);
	}

	// Workerから受信したメッシュをシーンに追加 (UVs追加)
	private addChunkMesh(chunkKey: string, meshData: { positions: ArrayBuffer; normals: ArrayBuffer; uvs: ArrayBuffer; indices: ArrayBuffer }) {
		if (this.chunks.has(chunkKey)) {
			const oldMesh = this.chunks.get(chunkKey)!;
			this.renderer.scene.remove(oldMesh);
			oldMesh.geometry.dispose();
		}

		// ジオメトリ作成
		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(meshData.positions), 3));
		geometry.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(meshData.normals), 3));
		geometry.setAttribute(
			// UVs追加
			"uv",
			new THREE.BufferAttribute(new Float32Array(meshData.uvs), 2)
		);
		geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(meshData.indices), 1));

		// メッシュ作成
		const mesh = new THREE.Mesh(geometry, this.chunkMaterial);
		const [cx, cy, cz] = chunkKey.split(",").map(Number);
		mesh.position.set(cx * CHUNK_SIZE_X, cy * CHUNK_SIZE_Y, cz * CHUNK_SIZE_Z);

		// ワールド座標で Raycast できるようにする
		mesh.name = chunkKey; // Raycast用にキーを保持

		this.chunks.set(chunkKey, mesh);
		this.renderer.scene.add(mesh);
		this.requestedChunks.delete(chunkKey);
	}

	// ワールドの更新 (毎フレーム)
	update() {
		this.loadChunksAroundPlayer();
		this.updateRaycaster();
	}

	// プレイヤー周辺のチャンクを読み込む (フェーズ1と同じ)
	private loadChunksAroundPlayer() {
		const [playerCX, playerCZ] = this.getPlayerChunkPosition();

		for (let x = -RENDER_DISTANCE_X; x <= RENDER_DISTANCE_X; x++) {
			for (let z = -RENDER_DISTANCE_Z; z <= RENDER_DISTANCE_Z; z++) {
				for (let y = 0; y < WORLD_HEIGHT_Y; y++) {
					const cx = playerCX + x;
					const cy = y;
					const cz = playerCZ + z;
					const chunkKey = `${cx},${cy},${cz}`;

					if (!this.chunks.has(chunkKey) && !this.requestedChunks.has(chunkKey)) {
						this.requestedChunks.add(chunkKey);
						const request: WorkerRequestMessage = {
							type: "generate",
							chunkX: cx,
							chunkY: cy,
							chunkZ: cz,
							chunkKey: chunkKey,
						};
						this.worker.postMessage(request);
					}
				}
			}
		}
	}

	private getPlayerChunkPosition(): [number, number] {
		const pos = this.player.controls.getObject().position;
		const cx = Math.floor(pos.x / CHUNK_SIZE_X);
		const cz = Math.floor(pos.z / CHUNK_SIZE_Z);
		return [cx, cz];
	}

	// --- フェーズ2: Raycasterとブロック操作 ---

	// 視線の先のブロックを特定し、ハイライトする
	private updateRaycaster() {
		if (!this.player.controls.isLocked) {
			this.selectionBox.visible = false;
			this.selectedBlock.exists = false;
			return;
		}

		// カメラ（視点）からレイを飛ばす
		this.raycaster.setFromCamera({ x: 0, y: 0 }, this.renderer.camera); // 画面中央
		const intersects = this.raycaster.intersectObjects(Array.from(this.chunks.values()), false);

		if (intersects.length > 0) {
			const intersection = intersects[0];

			// 衝突点がブロックのどの位置にあるかを計算
			const pos = intersection.point;
			const normal = intersection.face!.normal;

			// ブロックの中心にスナップさせる (法線方向に0.5ずらす)
			const blockPos = new THREE.Vector3(Math.floor(pos.x - normal.x * 0.5), Math.floor(pos.y - normal.y * 0.5), Math.floor(pos.z - normal.z * 0.5));

			// ハイライト用のボックスを更新
			this.selectionBox.position.set(blockPos.x + 0.5, blockPos.y + 0.5, blockPos.z + 0.5);
			this.selectionBox.visible = true;

			// 選択中のブロック情報を保存
			this.selectedBlock.position.copy(blockPos);
			this.selectedBlock.normal.copy(normal);
			this.selectedBlock.exists = true;
		} else {
			// 何もヒットしなかった
			this.selectionBox.visible = false;
			this.selectedBlock.exists = false;
		}
	}

	// ブロックを破壊 (Workerに依頼)
	public breakBlock() {
		if (!this.selectedBlock.exists) return;

		const { x, y, z } = this.selectedBlock.position;

		const request: WorkerRequestMessage = {
			type: "setBlock",
			worldX: x,
			worldY: y,
			worldZ: z,
			blockId: BLOCK_AIR, // 空気で上書き
		};
		this.worker.postMessage(request);
	}

	// ブロックを設置 (Workerに依頼)
	public placeBlock() {
		if (!this.selectedBlock.exists) return;

		// 選択したブロックの法線方向に新しいブロックを設置
		const { position, normal } = this.selectedBlock;
		const x = position.x + normal.x;
		const y = position.y + normal.y;
		const z = position.z + normal.z;

		// TODO: プレイヤーと重なっていないかチェック (フェーズ3)

		const request: WorkerRequestMessage = {
			type: "setBlock",
			worldX: x,
			worldY: y,
			worldZ: z,
			blockId: BLOCK_STONE, // とりあえず石を設置
		};
		this.worker.postMessage(request);
	}

	// ワールド保存をWorkerに依頼
	public saveWorld() {
		console.log("Main: ワールド保存をリクエスト...");
		// (setBlock時に自動保存しているので、これは実質不要だがUIとして残す)
		this.worker.postMessage({ type: "saveWorld" } as WorkerRequestMessage);
	}
}

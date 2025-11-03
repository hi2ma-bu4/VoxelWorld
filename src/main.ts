import { TextureLoader } from "three";
import { Player } from "./rendering/Player";
import { Renderer } from "./rendering/Renderer";
import { World } from "./world/World";

// --- 初期化処理 ---
async function main() {
	// 1. キャンバス要素
	const canvas = document.getElementById("main-canvas") as HTMLCanvasElement;
	if (!canvas) throw new Error("Canvas element not found");

	// 2. レンダリングとプレイヤー
	const renderer = new Renderer(canvas);
	const player = new Player(renderer.camera, canvas);

	// 3. テクスチャの読み込み (非同期)
	const textureLoader = new TextureLoader();
	const texture = await textureLoader.loadAsync("../public/assets/img/textures.png");
	console.log("Main: テクスチャ読み込み完了");

	// 4. ワールドを初期化 (Worker起動、DB読み込み開始)
	// テクスチャを渡す
	const world = new World(renderer, player, texture);

	// 5. クリックイベント (ブロック操作)
	canvas.addEventListener("mousedown", (event) => {
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
	canvas.addEventListener("contextmenu", (event) => event.preventDefault());

	// 6. セーブボタン
	const saveButton = document.getElementById("save-button") as HTMLButtonElement;
	saveButton.addEventListener("click", () => {
		world.saveWorld();
	});

	// 7. レンダリングループ開始
	function animate() {
		requestAnimationFrame(animate);

		// ワールドの状態更新 (チャンク読み込み、Raycastなど)
		world.update();

		// 描画 (内部でプレイヤーの更新も行う)
		renderer.render(player);
	}

	// アニメーション開始
	animate();

	console.log("Main: アプリケーション初期化完了");
}

// アプリケーション実行
main().catch(console.error);

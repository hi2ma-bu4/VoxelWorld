import * as THREE from "three";
import { Player } from "./Player";

export class Renderer {
	public scene: THREE.Scene;
	public camera: THREE.PerspectiveCamera;
	private renderer: THREE.WebGLRenderer;
	private canvas: HTMLCanvasElement;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		// 1. シーン
		this.scene = new THREE.Scene();
		this.scene.background = new THREE.Color(0x87ceeb); // 空の色

		// 2. カメラ
		this.camera = new THREE.PerspectiveCamera(
			75, // 視野角
			window.innerWidth / window.innerHeight, // アスペクト比
			0.1, // ニアクリップ
			1000 // ファークリップ
		);

		// 3. レンダラー
		this.renderer = new THREE.WebGLRenderer({
			canvas: this.canvas,
			antialias: true, // アンチエイリアス
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		// 4. ライティング
		const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
		directionalLight.position.set(50, 100, 50); // 太陽の位置
		directionalLight.target.position.set(0, 0, 0);
		this.scene.add(directionalLight);

		// 5. リサイズ対応
		window.addEventListener("resize", () => this.onResize());
	}

	private onResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
	}

	// レンダリング実行
	render(player: Player) {
		player.update(); // プレイヤーの移動を更新
		this.renderer.render(this.scene, this.camera);
	}
}

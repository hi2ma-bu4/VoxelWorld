import { AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import { Player } from "./Player";

export class Renderer {
	public scene: Scene;
	public camera: PerspectiveCamera;
	private renderer: WebGLRenderer;
	private canvas: HTMLCanvasElement;

	constructor(canvas: HTMLCanvasElement) {
		this.canvas = canvas;

		// 1. シーン
		this.scene = new Scene();
		this.scene.background = new Color(0x87ceeb); // 空の色

		// 2. カメラ
		this.camera = new PerspectiveCamera(
			75, // 視野角
			window.innerWidth / window.innerHeight, // アスペクト比
			0.1, // ニアクリップ
			1000 // ファークリップ
		);

		// 3. レンダラー
		this.renderer = new WebGLRenderer({
			canvas: this.canvas,
			antialias: true, // アンチエイリアス
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		// 4. ライティング
		const ambientLight = new AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		const directionalLight = new DirectionalLight(0xffffff, 1.0);
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

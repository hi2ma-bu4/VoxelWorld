import { AmbientLight, Color, DirectionalLight, PerspectiveCamera, Scene, WebGLRenderer } from "three";
import Stats from "three/examples/jsm/libs/stats.module.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { Player } from "./Player";

export class Renderer {
	public scene: Scene;
	public camera: PerspectiveCamera;
	private renderer: WebGLRenderer;
	private canvas: HTMLCanvasElement;
	private composer: EffectComposer;
	private fxaaPass: ShaderPass;
	private stats: Stats;

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
			antialias: false,
		});
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.renderer.setPixelRatio(window.devicePixelRatio);

		// 4. ポストプロセシング (アンチエイリアス)
		this.composer = new EffectComposer(this.renderer);
		const renderPass = new RenderPass(this.scene, this.camera);
		this.composer.addPass(renderPass);

		this.fxaaPass = new ShaderPass(FXAAShader);
		this.fxaaPass.material.uniforms["resolution"].value.x = 1 / (window.innerWidth * window.devicePixelRatio);
		this.fxaaPass.material.uniforms["resolution"].value.y = 1 / (window.innerHeight * window.devicePixelRatio);
		this.composer.addPass(this.fxaaPass);

		// 5. ライティング
		const ambientLight = new AmbientLight(0xffffff, 0.6);
		this.scene.add(ambientLight);

		const directionalLight = new DirectionalLight(0xffffff, 1.0);
		directionalLight.position.set(50, 100, 50); // 太陽の位置
		directionalLight.target.position.set(0, 0, 0);
		this.scene.add(directionalLight);

		// 5. リサイズ対応
		window.addEventListener("resize", () => this.onResize());

		// 6. FPS表示
		this.stats = new Stats();
		this.stats.dom.style.position = "absolute";
		this.stats.dom.style.top = "0px";
		this.stats.dom.style.left = "0px";
		document.body.appendChild(this.stats.dom);
	}

	private onResize() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(window.innerWidth, window.innerHeight);
		this.composer.setSize(window.innerWidth, window.innerHeight);
		this.fxaaPass.material.uniforms["resolution"].value.x = 1 / (window.innerWidth * window.devicePixelRatio);
		this.fxaaPass.material.uniforms["resolution"].value.y = 1 / (window.innerHeight * window.devicePixelRatio);
	}

	// レンダリング実行
	render(player: Player) {
		player.update(); // プレイヤーの移動を更新
		this.composer.render();
		this.stats.update();
	}
}

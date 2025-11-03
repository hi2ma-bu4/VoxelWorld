import * as THREE from "three";
// PointerLockControls は three/examples からインポートする必要がある
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

export class Player {
	public controls: PointerLockControls;

	// 移動関連
	private velocity = new THREE.Vector3();
	private direction = new THREE.Vector3();
	private moveForward = false;
	private moveBackward = false;
	private moveLeft = false;
	private moveRight = false;
	// private canJump = false; // TODO: ジャンプ (フェーズ2)

	private prevTime: number;

	constructor(camera: THREE.Camera, domElement: HTMLElement) {
		this.controls = new PointerLockControls(camera, domElement);
		this.prevTime = performance.now();

		// プレイヤーの初期位置 (地表より少し上)
		camera.position.set(8, 48, 8); // (16, 16) チャンクの中央、高さ48

		// PointerLock イベント
		this.controls.addEventListener("lock", () => {
			console.log("Pointer locked");
			document.body.classList.add("locked");
		});
		this.controls.addEventListener("unlock", () => {
			console.log("Pointer unlocked");
			document.body.classList.remove("locked");
		});

		// 画面クリックで操作開始
		domElement.addEventListener("click", () => {
			if (!this.controls.isLocked) {
				this.controls.lock();
			}
		});

		// キー入力
		document.addEventListener("keydown", (e) => this.onKeyDown(e.key));
		document.addEventListener("keyup", (e) => this.onKeyUp(e.key));
	}

	private onKeyDown(key: string) {
		switch (key.toLowerCase()) {
			case "w":
				this.moveForward = true;
				break;
			case "a":
				this.moveLeft = true;
				break;
			case "s":
				this.moveBackward = true;
				break;
			case "d":
				this.moveRight = true;
				break;
			// case ' ': // ジャンプ
			//   if (this.canJump) this.velocity.y += 350.0;
			//   this.canJump = false;
			//   break;
		}
	}

	private onKeyUp(key: string) {
		switch (key.toLowerCase()) {
			case "w":
				this.moveForward = false;
				break;
			case "a":
				this.moveLeft = false;
				break;
			case "s":
				this.moveBackward = false;
				break;
			case "d":
				this.moveRight = false;
				break;
		}
	}

	// 毎フレーム更新
	update() {
		if (!this.controls.isLocked) {
			return;
		}

		const time = performance.now();
		const delta = (time - this.prevTime) / 1000.0; // 経過時間 (秒)

		const moveSpeed = 10.0; // 移動速度
		const damping = 10.0; // 減速の強さ (1.0 = 減速なし)

		// 速度の減衰
		this.velocity.x -= this.velocity.x * damping * delta;
		this.velocity.z -= this.velocity.z * damping * delta;

		// TODO: 重力 (フェーズ2)
		// this.velocity.y -= 9.8 * 100.0 * delta; // 簡易重力

		// キー入力による進行方向の計算
		this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
		this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
		this.direction.normalize(); // 斜め移動が速くならないように

		if (this.moveForward || this.moveBackward) {
			this.velocity.z -= this.direction.z * moveSpeed * damping * delta;
		}
		if (this.moveLeft || this.moveRight) {
			this.velocity.x -= this.direction.x * moveSpeed * damping * delta;
		}

		// PointerLockControls の移動メソッド
		this.controls.moveRight(-this.velocity.x * delta);
		this.controls.moveForward(-this.velocity.z * delta);

		// TODO: 重力によるY軸移動 (フェーズ2)
		// this.controls.getObject().position.y += this.velocity.y * delta;

		// TODO: 衝突判定 (フェーズ2)
		// if (this.controls.getObject().position.y < 10) {
		//   this.velocity.y = 0;
		//   this.controls.getObject().position.y = 10;
		//   this.canJump = true;
		// }

		this.prevTime = time;
	}
}

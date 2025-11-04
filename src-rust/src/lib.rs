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
    // JS側には { positions, normals, indices } のオブジェクトとして渡される
    #[wasm_bindgen]
    pub fn generate_chunk_mesh(&self, chunk_data: &[u8]) -> JsValue {
        let mesh_data = meshing::generate_mesh(chunk_data);

        let positions = js_sys::Float32Array::from(mesh_data.positions.as_slice());
        let normals = js_sys::Float32Array::from(mesh_data.normals.as_slice());
        let uvs = js_sys::Float32Array::from(mesh_data.uvs.as_slice());
        let indices = js_sys::Uint32Array::from(mesh_data.indices.as_slice());

        let obj = js_sys::Object::new();
        js_sys::Reflect::set(&obj, &"positions".into(), &positions.buffer()).unwrap();
        js_sys::Reflect::set(&obj, &"normals".into(), &normals.buffer()).unwrap();
        js_sys::Reflect::set(&obj, &"uvs".into(), &uvs.buffer()).unwrap();
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

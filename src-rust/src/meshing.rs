use crate::chunk::*;

// JSに返すメッシュデータ
pub struct MeshData {
    pub positions: Vec<f32>,
    pub normals: Vec<f32>,
    pub uvs: Vec<f32>, // テクスチャ座標
    pub indices: Vec<u32>,
}

// テクスチャアトラス設定 (16x16 のタイル)
const ATLAS_SIZE: f32 = 16.0;
const TILE_SIZE: f32 = 1.0 / ATLAS_SIZE;

// ブロックIDと面の向き -> テクスチャ座標 (X, Y)
fn get_texture_coords(block_id: u8, face_index: usize) -> (f32, f32) {
    match block_id {
        BLOCK_GRASS => {
            match face_index {
                2 => (0.0, 0.0), // 上面 (Y+)
                3 => (2.0, 0.0), // 下面 (Y-)
                _ => (3.0, 0.0), // 側面
            }
        }
        BLOCK_DIRT => (2.0, 0.0),
        BLOCK_STONE => (1.0, 0.0),
        _ => (1.0, 1.0), // デフォルト
    }
}

// 6面 (法線)
const FACE_NORMALS: [[f32; 3]; 6] = [
    [1.0, 0.0, 0.0],  // 右 (Positive X)
    [-1.0, 0.0, 0.0], // 左 (Negative X)
    [0.0, 1.0, 0.0],  // 上 (Positive Y)
    [0.0, -1.0, 0.0], // 下 (Negative Y)
    [0.0, 0.0, 1.0],  // 奥 (Positive Z)
    [0.0, 0.0, -1.0], // 手前 (Negative Z)
];

// 6面の頂点インデックス (4頂点)
const FACE_VERTICES: [[[f32; 3]; 4]; 6] = [
    // 右 (X+)
    [
        [1.0, 0.0, 1.0],
        [1.0, 1.0, 1.0],
        [1.0, 1.0, 0.0],
        [1.0, 0.0, 0.0],
    ],
    // 左 (X-)
    [
        [0.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 1.0, 1.0],
        [0.0, 0.0, 1.0],
    ],
    // 上 (Y+)
    [
        [0.0, 1.0, 1.0],
        [0.0, 1.0, 0.0],
        [1.0, 1.0, 0.0],
        [1.0, 1.0, 1.0],
    ],
    // 下 (Y-)
    [
        [0.0, 0.0, 0.0],
        [0.0, 0.0, 1.0],
        [1.0, 0.0, 1.0],
        [1.0, 0.0, 0.0],
    ],
    // 奥 (Z+)
    [
        [0.0, 0.0, 1.0],
        [0.0, 1.0, 1.0],
        [1.0, 1.0, 1.0],
        [1.0, 0.0, 1.0],
    ],
    // 手前 (Z-)
    [
        [1.0, 0.0, 0.0],
        [1.0, 1.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, 0.0, 0.0],
    ],
];

// 頂点のUV座標 (固定)
const FACE_UVS: [[f32; 2]; 4] = [[0.0, 0.0], [0.0, 1.0], [1.0, 1.0], [1.0, 0.0]];

// 面を構成する2つの三角形 (インデックス)
const FACE_INDICES: [u32; 6] = [0, 1, 2, 0, 2, 3];
const TOP_FACE_INDICES: [u32; 6] = [0, 2, 1, 0, 3, 2]; // Y+面だけ逆回り

// チャンクデータからメッシュを生成
pub fn generate_mesh(chunk_data: &[u8]) -> MeshData {
    let mut positions = Vec::new();
    let mut normals = Vec::new();
    let mut uvs = Vec::new();
    let mut indices = Vec::new();
    let mut current_index: u32 = 0;

    for y in 0..CHUNK_SIZE_Y {
        for z in 0..CHUNK_SIZE_Z {
            for x in 0..CHUNK_SIZE_X {
                let index = xyz_to_index(x, y, z);
                let block_id = chunk_data[index];

                if !is_block_solid(block_id) {
                    continue; // 空気のブロック
                }

                // 6方向 (隣接ブロック) をチェック
                for face_index in 0..6 {
                    // --- この面を描画するかどうかを決定 ---
                    let normal = FACE_NORMALS[face_index];
                    let normal = FACE_NORMALS[face_index];

                    let neighbor_x = x as i32 + normal[0] as i32;
                    let neighbor_y = y as i32 + normal[1] as i32;
                    let neighbor_z = z as i32 + normal[2] as i32;

                    let mut neighbor_block_id = BLOCK_AIR;

                    // チャンク境界チェック
                    if neighbor_x >= 0
                        && neighbor_x < CHUNK_SIZE_X as i32
                        && neighbor_y >= 0
                        && neighbor_y < CHUNK_SIZE_Y as i32
                        && neighbor_z >= 0
                        && neighbor_z < CHUNK_SIZE_Z as i32
                    {
                        neighbor_block_id = chunk_data[xyz_to_index(
                            neighbor_x as usize,
                            neighbor_y as usize,
                            neighbor_z as usize,
                        )];
                    }

                    // 隣が固体ブロックでなければ、この面を描画
                    if !is_block_solid(neighbor_block_id) {
                        // --- 描画が決まったら、この面のUVを計算 ---
                        let (uv_x_offset, uv_y_offset) = get_texture_coords(block_id, face_index);
                        let uv_base_x = uv_x_offset * TILE_SIZE;
                        let uv_base_y = uv_y_offset * TILE_SIZE;

                        // この面の4頂点を追加
                        let vertices = FACE_VERTICES[face_index];
                        for i in 0..4 {
                            let vertex = vertices[i];
                            // 頂点座標
                            positions.push(vertex[0] + x as f32);
                            positions.push(vertex[1] + y as f32);
                            positions.push(vertex[2] + z as f32);

                            // 法線
                            normals.push(normal[0]);
                            normals.push(normal[1]);
                            normals.push(normal[2]);

                            // UV座標
                            let uv = FACE_UVS[i];
                            // (0.0~1.0) * タイルサイズ + UVオフセット
                            uvs.push(uv[0] * TILE_SIZE + uv_base_x);
                            uvs.push(uv[1] * TILE_SIZE + uv_base_y);
                        }

                        // インデックスを追加
                        let indices_to_add = if face_index == 2 {
                            // 上面 (Y+)
                            &TOP_FACE_INDICES
                        } else {
                            &FACE_INDICES
                        };
                        for &idx in indices_to_add {
                            indices.push(current_index + idx);
                        }
                        current_index += 4;
                    }
                }
            }
        }
    }

    MeshData {
        positions,
        normals,
        uvs,
        indices,
    }
}

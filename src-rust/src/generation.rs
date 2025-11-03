use crate::chunk::*;
use noise::{NoiseFn, Perlin, Simplex};

pub struct TerrainGenerator {
    terrain_noise: Perlin, // 地表の起伏 (2D)
    cave_noise: Simplex,   // 洞窟 (3D)
}

impl TerrainGenerator {
    pub fn new(seed: u32) -> Self {
        Self {
            terrain_noise: Perlin::new(seed),
            cave_noise: Simplex::new(seed.wrapping_add(1)), // シードをずらす
        }
    }

    pub fn generate_chunk(&self, chunk_x: i32, chunk_y: i32, chunk_z: i32) -> Vec<u8> {
        let mut blocks = vec![BLOCK_AIR; CHUNK_VOLUME];

        // チャンクの基点となるワールド座標
        let base_wx = chunk_x * CHUNK_SIZE_X as i32;
        let base_wy = chunk_y * CHUNK_SIZE_Y as i32;
        let base_wz = chunk_z * CHUNK_SIZE_Z as i32;

        for lx in 0..CHUNK_SIZE_X {
            for lz in 0..CHUNK_SIZE_Z {
                // ワールド座標 (x, z) で地表の高さを計算
                let wx = base_wx + lx as i32;
                let wz = base_wz + lz as i32;

                // 2Dパーリンノイズで地表の高さを決定
                let height_scale = 0.01; // ノイズの縮尺 (大きいと滑らか)
                let height_offset = 32.0; // 基準高さ
                let amplitude = 16.0; // 起伏の激しさ

                let terrain_height = self
                    .terrain_noise
                    .get([wx as f64 * height_scale, wz as f64 * height_scale])
                    * amplitude
                    + height_offset;

                let terrain_height_i = terrain_height.round() as i32;

                for ly in 0..CHUNK_SIZE_Y {
                    let wy = base_wy + ly as i32;
                    let index = xyz_to_index(lx, ly, lz);

                    // 1. 地形生成
                    if wy > terrain_height_i {
                        blocks[index] = BLOCK_AIR;
                    } else if wy == terrain_height_i {
                        blocks[index] = BLOCK_GRASS;
                    } else if wy > terrain_height_i - 3 {
                        // 地表から3ブロック下まで土
                        blocks[index] = BLOCK_DIRT;
                    } else {
                        blocks[index] = BLOCK_STONE;
                    }

                    // 2. 洞窟生成 (石ブロックのみ対象)
                    if blocks[index] == BLOCK_STONE {
                        let cave_scale = 0.05;
                        let cave_threshold = 0.6; // この値以上を空洞にする

                        let cave_value = self
                            .cave_noise
                            .get([
                                wx as f64 * cave_scale,
                                wy as f64 * cave_scale,
                                wz as f64 * cave_scale,
                            ])
                            .abs(); // 0.0 ~ 1.0 の範囲に

                        if cave_value > cave_threshold {
                            blocks[index] = BLOCK_AIR;
                        }
                    }
                }
            }
        }
        blocks
    }
}

// チャンクのサイズ (1辺のブロック数)
pub const CHUNK_SIZE_X: usize = 16;
pub const CHUNK_SIZE_Y: usize = 16;
pub const CHUNK_SIZE_Z: usize = 16;

// チャンク内の総ブロック数
pub const CHUNK_VOLUME: usize = CHUNK_SIZE_X * CHUNK_SIZE_Y * CHUNK_SIZE_Z;

// ブロックID定義
pub const BLOCK_AIR: u8 = 0;
pub const BLOCK_GRASS: u8 = 1;
pub const BLOCK_DIRT: u8 = 2;
pub const BLOCK_STONE: u8 = 3;

// 3Dインデックスを1D配列のインデックスに変換
#[inline]
pub fn xyz_to_index(x: usize, y: usize, z: usize) -> usize {
    x + (z * CHUNK_SIZE_X) + (y * CHUNK_SIZE_X * CHUNK_SIZE_Z)
}

// ブロックIDからブロックが「固い」（描画対象）かどうかを判定
#[inline]
pub fn is_block_solid(block_id: u8) -> bool {
    block_id != BLOCK_AIR
}

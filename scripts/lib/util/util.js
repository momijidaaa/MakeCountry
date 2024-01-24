/**
 * 座標をチャンクに変換
 * @param {number} x 
 * @param {number} z 
 * @returns 
 */
export function ConvertChunk(x,z) {
    return `${Math.floor(x / 16) * 16}_${Math.floor(z / 16) * 16}`
}
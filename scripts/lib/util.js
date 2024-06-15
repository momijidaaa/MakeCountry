import { Player } from "@minecraft/server";
import * as Dyprop from "./DyProp"

/**
 * 指定した座標、ディメンションのチャンクのダイプロのプロパティを取得
 * @param {number} rawX マイクラのX座標
 * @param {number} rawZ マイクラのZ座標 
 * @param {Dimension} dimension ディメンション
 * @returns {string}
 */
export function GetChunkPropertyId(rawX, rawZ, dimension = `overworld`) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    return `chunk_${x}_${z}_${dimension.id.replace(`minecraft:`, ``)}`;
};

/**
 * プレイヤーがいるチャンクのダイプロのidを取得
 * @param {Player} player
 * @returns {string}
 */
export function GetPlayerChunkPropertyId(player) {
    let {x: rawX,z: rawZ} = player.location;
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    return `chunk_${x}_${z}_${player.dimension.id.replace(`minecraft:`, ``)}`;
};

/**
 * 指定したIDのダイプロのデータをJSON.parseして取得
 * @param {string} id
 * @returns {any|undefined}
 */
export function GetAndParsePropertyData(id) {
    let dataString = Dyprop.getDynamicProperty(id);
    if(!dataString || typeof dataString !== "string") return undefined;
    try {
        return JSON.parse(dataString);
    } catch (error) {
        console.warn(error);
        return undefined;
    }
};

/**
 * 指定したIDのダイプロにデータをJSON形式にして保存
 * @param {string} id
 * @param {any} data
 * @returns 
 */
export function StringifyAndSavePropertyData(id, data) {
    Dyprop.setDynamicProperty(id,JSON.stringify(data));
};

/**
 * x座標とz座標をチャンクデータに変換
 * @param {*} rawX 
 * @param {*} rawZ 
 * @returns {{x: number,y: number}}
 */
export function ConvertChunk(rawX, rawZ) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    return {x , z}
};
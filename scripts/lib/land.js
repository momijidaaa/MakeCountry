/**
 * gridデータのフォーマット
 * {  [key: string]:    {      country: string,      owner: string|undefined,      price: number,      id: string,      permission: {[roleId: string]: [[permission: string]: string]}}}
 */

import { world } from "@minecraft/server";
import * as DyProp from "./DyProp";

// 領土データを管理するやつ
let grid = DyProp.get(`grid`) ?? "{}";
grid = JSON.parse(grid);

//国データを管理
let countries = DyProp.get(`countries`) ?? "{}";
countries = JSON.parse(countries);

/**
 * データ内のセルを取得する関数
 * @param {number} rawX マイクラのX座標
 * @param {number} rawZ マイクラのZ座標 
 * @returns {undefined|{  [key: string]:    {      country: string,      owner: string|undefined,      price: number,      id: string,      permission: {[roleId: string]: [string]}}}}
 */
export function getChunkData(rawX, rawZ) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    if (!grid[x]) {
        grid[x] = {};
    }
    if (!grid[x][z]) {
        grid[x][z] = { land: null, owner: null, permission: 0 };
    }
    return grid[x][z];
}

/**
 * マイクラの座標をチャンクのデータに変換
 * @param {number} rawX マイクラのX座標
 * @param {number} rawZ マイクラのZ座標
 * @returns {[x: number,z: number]} それぞれの座標を16で割って四捨五入
 */
export function convertChunk(rawX, rawZ) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    return [x, z];
}

// 国のデータを保存する配列
// ユニークなIDを管理する変数
let nextCountryId = DyProp.get(`nextCountryId`) ?? 1;
if (typeof nextCountryId === "string") nextCountryId = Number(nextCountryId);

// 新しい国を追加する関数
/**
 * 
 * @param {string} name 
 * @param {*} capital 
 * @param {*} population 
 * @param {*} resources 
 * @param {*} territories 
 */
function addCountry(name, capital, population, resources, territories) {
    let newCountry = {
        nextCountryId: {
            lands: [] // 領土情報を追加
        }
    }
}

/**
 * 
 * @param {Player} player 
 * @param {string} countryName 
 */
export function MakeCountry(player, countryName) {
    /**
    * @type {{"name": string,"money": number ,"country": {name: string ,"role": string}}}
    */
    const status = world.getDynamicProperty(`player_${player.id}`);

    if (status.country.name !== 0) {
        player.sendMessage(`§cあなたは既に国に所属しています`);
        return;
    };
    /**
     * @type {{"country": string,"special": boolean}|`noCountry`}
     */
    const chunkStatus = world.getDynamicProperty(`chunk_${convertChunk(player.location.x, player.location.z)}`) ?? `noCountry`;
    if (chunkStatus !== `noCountry`) {
        if (chunkStatus.country.length !== 0) {
            player.sendMessage(`§cこのチャンクは国があるため建国できません`);
            return;
        } else {
            player.sendMessage(`§cこのチャンクには建国できません`);
            return;
        };
    };
    if (status.money < configs.makeCountryCost) {
        player.sendMessage(`§c建国には${configs.makeCountryCost}${configs}必要です(${configs.makeCountryCost - status.money}${configs.CurrencyUnit})`);
    };
};

// 国を削除する関数
function removeCountry(countryId) {
    countries = countries.filter(country => country.id !== countryId);
}

// 使用例
let japanTerritories = [{ x: 3, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 6 }];
addCountry("Japan", "Tokyo", 126800000, ["rice", "fish", "electronics"], japanTerritories);

let usaTerritories = [{ x: 8, y: 12 }, { x: 9, y: 12 }, { x: 10, y: 12 }];
addCountry("USA", "Washington D.C.", 331000000, ["corn", "wheat", "oil"], usaTerritories);

let germanyTerritories = [{ x: 15, y: 20 }, { x: 16, y: 20 }, { x: 15, y: 21 }];
addCountry("Germany", "Berlin", 83100000, ["automobiles", "machinery", "chemicals"], germanyTerritories);

console.log(countries);

// Japan を削除する
removeCountry(1);

console.log(countries);

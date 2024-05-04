/**
 * gridデータのフォーマット
 * {  [key: string]:    {      country: string,      owner: string|undefined,      price: number,      id: string,     permission: {[roleId: string]: [[permission: string]: string]} ,dimension: string}}
 * 
 * 国データのフォーマット
 * {
 *   [key: string]: {
 *     name: string, //国の名前
 *     power: number, //国力
 *     funds: number, //国の金データ
 *     lands: [string], //領土にしてるチャンクのデータ
 *     members: [string], //メンバーのデータ
 *     roles: [string], //ロールのデータ
 *     pacifism: [boolean], //平和主義
 *     enemy: [string], //敵対国
 *     ally: [string], //同盟国
 *     neutral: [string], //中立国
 *     warnow: [string] 戦争中の国
 *   }
 * }
 * 
 *  * プレイヤーデータ フォーマット
 * 
 * {
 *     [key: string]: { name: string, roles: [string], money: number, country: string|undefined }
 * } 
 */

import { Dimension, Player, world } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { firstRoleSetUp } from "./role";

// 領土データを管理するやつ
/**
 * @type {{  [key: string]:    {      country: string,      owner: string|undefined,      price: number,      id: string,     permission: {[roleId: string]: [[permission: string]: string]} ,dimension: string}}}
 */
let grid = DyProp.get(`grid`) ?? "{}";
grid = JSON.parse(grid);

//プレイヤーデータのインポート
/**
 * @type {{ [key: string]: { name: string,  roles: [string], money: number, country: string|undefined }}}
 */
let playersData = DyProp.get(`players`) ?? `{}`;
playersData = JSON.parse(playersData);

//国データを管理
/**
 * @type {{[key: string]: {name: string, power: number,funds: number, lands: [string], members: [string], roles: [string] ,pacifism: [boolean], enemy: [string], ally: [string], neutral: [string], warnow: [string]}}}
 */
let countries = DyProp.get(`countries`) ?? "{}";
countries = JSON.parse(countries);

/**
 * データ内のセルを取得する関数
 * @param {number} rawX マイクラのX座標
 * @param {number} rawZ マイクラのZ座標 
 * @param {Dimension} dimension ディメンション
 * @returns {undefined|{  [key: string]:    {      country: string,      owner: string|undefined,      price: number,      id: string,      permission: {[roleId: string]: [string]},dimension: string}}}
 */
export function getChunkData(rawX, rawZ, dimension = `overworld`) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    return grid[`${x}_${z}_${dimension.id.replace(`minecraft:`, ``)}`];
}

/**
 * マイクラの座標をチャンクのデータに変換
 * @param {number} rawX マイクラのX座標
 * @param {number} rawZ マイクラのZ座標
 * @param {Dimension} dimension ディメンション
 * @returns {string} それぞれの座標を16で割って四捨五入してディメンション入れたキーを返す
 */
export function convertChunk(rawX, rawZ, dimension) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    return `${x}_${z}_${dimension.id.replace(`minecraft:`, ``)}`;
}

// 国のデータを保存する配列
// ユニークなIDを管理する変数
let nextCountryId = DyProp.get(`nextCountryId`) ?? "1";

/**
 * 国自体を作成
 * @param {string} name 国の名前
 * @param {Player} owner 
 * @param {string} firstLand
 * @returns {void} 
 */
function addCountry(name, owner, firstLand) {
    const defaultCountryMoneyString = world.getDynamicProperty(`defaultCountryMoney`) ?? `1000`;
    const defaultCountryMoneyNumber = Number(defaultCountryMoneyString);
    /**
     * @type {string}
     */
    const playerId = owner.getDynamicProperty(`player_${owner.id}`);

    countries[nextCountryId] = {
        name: name, //国の名前
        owner: playerId,
        funds: defaultCountryMoneyNumber, //国の金データ
        lands: [firstLand], //領土にしてるチャンクのデータ
        members: [playerId], //メンバーのデータ
        roles: [], //ロールのデータ
    };
    DyProp.set(`countries`,countries);
    firstRoleSetUp(nextCountryId);
    playersData[playerId].country = nextCountryId
    DyProp.set(`players`,playersData);
    nextCountryId = `${Number(nextCountryId) + 1}`;
    DyProp.set(`nextCountryId`, `${Number(nextCountryId)}`);
};

/**
 * 国を作る関数
 * @param {Player} player 
 * @param {string} countryName 
 */
export function MakeCountry(player, countryName) {
    /**
     * @type {string|undefined}
     */
    const playerId = player.getDynamicProperty(`player_${player.id}`)
    if (!playerId) {
        player.sendMessage(`§cプレイヤーデータが登録されていません`);
        return;
    };
    /**
    * @type {{"name": string,"money": number ,"country": undefined|string}}
    */
    const status = playersData[playerId];

    if (typeof status.country !== "undefined") {
        player.sendMessage(`§cあなたは既に国に所属しています`);
        return;
    };
    const { x: lx, z: lz } = player.location
    const chunkStatus = getChunkData(lx, lz, player.dimension);
    if (chunkStatus) {
        player.sendMessage(`§cこのチャンクには建国できません`);
        return;
    };
    const needMoneyString = world.getDynamicProperty(`needMoneyForMakeCountry`) ?? `10000`;
    const needMoneyNumber = Number(needMoneyString);
    if (status.money < needMoneyNumber) {
        player.sendMessage(`§c建国には${needMoneyNumber}${configs}必要です(${needMoneyNumber - status.money}${needMoneyNumber})`);
        return
    };
    status.money -= needMoneyNumber;
    playersData[playerId] = status;
    DyProp.set(`players`,playersData);
    addCountry(countryName,player,convertChunk(lx, lz, player.dimension));
};

// 国を削除する関数
function removeCountry(countryId) {
    countries = countries.filter(country => country.id !== countryId);
}

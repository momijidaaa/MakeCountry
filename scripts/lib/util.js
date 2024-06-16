import { Player } from "@minecraft/server";
import * as Dyprop from "./DyProp";
import config from "../config";

/**
 * 指定した座標、ディメンションのチャンクのダイプロのプロパティを取得
 * @param {number} rawX マイクラのX座標
 * @param {number} rawZ マイクラのZ座標 
 * @param {string} dimension ディメンションID
 * @returns {string}
 */
export function GetChunkPropertyId(rawX, rawZ, dimension = `overworld`) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    return `chunk_${x}_${z}_${dimension.replace(`minecraft:`, ``)}`;
};

/**
 * プレイヤーがいるチャンクのダイプロのidを取得
 * @param {Player} player
 * @returns {string}
 */
export function GetPlayerChunkPropertyId(player) {
    let { x: rawX, z: rawZ } = player.location;
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
    if (!dataString || typeof dataString !== "string") return undefined;
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
    Dyprop.setDynamicProperty(id, JSON.stringify(data));
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
    return { x, z }
};

/**
 * 権限確認
 * @param {Player} player 
 * @param {string} permission 
 * @returns {boolean}
 */
export function CheckPermission(player, permission) {
    if (player.hasTag(`adminmode`)) return false;
    const chunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(player));
    if (!chunkData) {
        if (config.wildernessAllowPermissions.includes(permission)) {
            return false;
        } else {
            return true;
        };
    };
    const allow = chunkData[`${permission}Allow`].includes(player.id);
    if (!chunkData.countryId && !chunkData.special && !chunkData.owner && !config.wildernessAllowPermissions.includes(permission)) return true;
    if (chunkData.special && !config.specialAllowPermissions.includes(permission)) return true;
    const countryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    if (countryData.warNowCountries.includes(playerData.country)) return false;
    if (allow) return false;
    if (chunkData[`${permission}Restriction`] && !allow) {
        if (countryData.id === playerData.country) {
            for (const role of playerData.roles) {
                if (GetAndParsePropertyData(`role_${role}`).permissions.includes(`owner`) || GetAndParsePropertyData(`role_${role}`).permissions.includes(`admin`)) return false;
            };
        };
        return true;
    };
    if (countryData.id === playerData.country) {
        for (const role of playerData.roles) {
            if (GetAndParsePropertyData(`role_${role}`).permissions.includes(permission)) return false;
        };
        return true;
    };
    if (countryData.alliance.includes(playerData.country)) {
        if (countryData.alliancePermission.includes(permission)) return false;
        return true;
    };
    if (countryData.hostility.includes(playerData.country)) {
        if (countryData.hostilityPermission.includes(permission)) return false;
        return true;
    };
    if (countryData.neutralityPermission.includes(permission)) return false;
    return true;
};

/**
 * 権限確認
 * @param {Player} player 
 * @param {string} permission 
 * @returns {boolean}
 */
export function CheckPermissionFromLocation(player, x, z, dimension, permission) {
    if (player.hasTag(`adminmode`)) return false;
    const restrictionPermissions = [`makeCountry`,`buyChunk`,`sellChunk`];
    const selfCountryRestrictionPermissions = [`makeCountry`,`buyChunk`];
    const chunkData = GetAndParsePropertyData(GetChunkPropertyId(x, z, dimension));
    if (!chunkData) {
        if (config.wildernessAllowPermissions.includes(permission)) {
            return false;
        } else {
            return true;
        };
    };
    if(chunkData.owner) {
        if(chunkData.owner === player.id) return false;
        if(restrictionPermissions.includes(permission)) return true;
    };
    const allow = chunkData[`${permission}Allow`].includes(player.id);
    if (!chunkData.countryId && !chunkData.special && chunkData.owner && chunkData[`${permission}Restriction`] && !config.wildernessAllowPermissions.includes(permission)) return true;
    if (chunkData.special && !config.specialAllowPermissions.includes(permission)) return true;
    const countryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    if (countryData.warNowCountries.includes(playerData.country)) return false;
    if (allow) return false;
    if (chunkData[`${permission}Restriction`] && !allow) {
        if (countryData.id === playerData.country) {
            for (const role of playerData.roles) {
                if (GetAndParsePropertyData(`role_${role}`).permissions.includes(`owner`) || GetAndParsePropertyData(`role_${role}`).permissions.includes(`admin`)) return false;
            };
        };
        return true;
    };
    if (countryData.id === playerData.country) {
        if(selfCountryRestrictionPermissions.includes(permission)) return true;
        for (const role of playerData.roles) {
            if (GetAndParsePropertyData(`role_${role}`).permissions.includes(permission)) return false;
        };
        return true;
    };
    if (countryData.alliance.includes(playerData.country)) {
        if (countryData.alliancePermission.includes(permission)) return false;
        return true;
    };
    if (countryData.hostility.includes(playerData.country)) {
        if (countryData.hostilityPermission.includes(permission)) return false;
        return true;
    };
    if (countryData.neutralityPermission.includes(permission)) return false;
    return true;
};

/**
 * 権限があるか確認
 * @param {Player} player 
 * @param {string} permission 
 * @returns {boolean}
 */
export function HasPermission(player,permission) {
    if (player.hasTag(`adminmode`)) return true;
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    for (const role of playerData.roles) {
        if (GetAndParsePropertyData(`role_${role}`).permissions.includes(`owner`) || GetAndParsePropertyData(`role_${role}`).permissions.includes(permission) ) return true;
    };
};
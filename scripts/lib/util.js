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
        const parseData = JSON.parse(dataString);
        return parseData;
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
 * @returns {{x: number, z: number}}
 */
export function ConvertChunk(rawX, rawZ) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    return { x, z }
};

const checkOnlyRole = [
    `invite`,
    `editCountryName`,
    `editCountryLore`,
    `inviteChange`,
    `neutralityPermission`,
    `warAdmin`,
    `allyAdmin`,
    `hostilityAdmin`,
    `taxAdmin`,
    `peaceChange`,
    `kick`,
    `owner`,
    `admin`,
    `withDrawResourcepoint`,
    `withDrawTreasurybudget`,
    `publicHomeAdmin`
];

const restrictionPermissions = [
    `makeCountry`,
    `buyChunk`,
    `sellChunk`
];
/**
 * 権限確認
 * @param {Player} player 
 * @param {string} permission 
 * @returns {boolean}
 */
//AdminMode 許可
//ロールのみチェックすれば良い権限の場合 → チェックしてキャンセル or 許可
//チャンクデータなし → 荒野の権限があれば許可
//荒野 → 荒野の権限があれば許可
//特別区 → 特別区のがあれば許可
//個人所有の土地 → 規制がなければ許可 → 規制があってもallowListにいれば許可 → 自分の国かつownerがあるとき許可 → なければキャンセル
//自分の国 → ロールに権限があれば許可 → なければキャンセル but ownerやadminの権限あれば許可
//他国 → それぞれの国の権限があれば許可 → なければキャンセル
export function CheckPermission(player, permission) {
    //AdminMode 許可
    if (player.hasTag(`adminmode`)) return false;
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    let chunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(player));

    //ロールのみチェックすれば良い権限の場合 → チェックしてキャンセル or 許可
    if (checkOnlyRole.includes(permission)) {
        const countryData = GetAndParsePropertyData(`country_${playerData?.country}`);
        if (countryData.owner === player.id) return false;
        const roleIds = playerData.roles;
        for (let i = 0; i < roleIds.length; i++) {
            const role = GetAndParsePropertyData(`role_${roleIds[i]}`);
            const permissions = role.permissions;
            if (permissions.includes(permission)) {
                return false;
            }
            if (permission !== `owner` && permission !== `admin`) {
                if (permissions.includes(`admin`) || permissions.includes(`owner`)) {
                    return false;
                };
            };
        };
        return true;
    };
    //チャンクデータなし → 荒野の権限があれば許可
    if (!chunkData) {
        if (config.wildernessAllowPermissions.includes(permission)) {
            return false;
        } else {
            return true;
        };
    };
    //荒野 → 荒野の権限があれば許可
    if (!chunkData?.countryId && !chunkData.owner && !chunkData?.special) {
        if (config.wildernessAllowPermissions.includes(permission)) {
            return false;
        } else {
            return true;
        };
    };
    //特別区 → 特別区の権限があれば許可
    if (chunkData?.special) {
        if (config.specialAllowPermissions.includes(permission)) {
            return false;
        } else {
            return true;
        };
    };
    //個人所有の土地 → 規制がなければ許可 → 規制があってもallowListにいれば許可 → 自分の国かつownerがあるとき許可 また、戦争中なら許可 → なければキャンセル
    if (chunkData?.owner) {
        if (chunkData?.owner === playerData?.id) {
            if (!restrictionPermissions.includes(permission)) {
                return false;
            }
        } else {
            if (chunkData[`${permission}Restriction`]) {
                const allow = chunkData[`${permission}Allow`].includes(player.id);
                if (allow) {
                    return false;
                } else {
                    if (chunkData?.countryId) {
                        const countryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);
                        if (!playerData?.country) {
                            return true;
                        }
                        if (countryData?.warNowCountries.includes(playerData.country)) {
                            return false;
                        }
                        if (countryData?.id === playerData?.country) {
                            if (countryData?.owner === playerData?.id) return false;
                            for (const role of playerData.roles) {
                                if (GetAndParsePropertyData(`role_${role}`).permissions.includes(`owner`) || GetAndParsePropertyData(`role_${role}`).permissions.includes(`admin`)) {
                                    return false;
                                };
                            };
                            return true;
                        };
                    };
                };
            } else {
                return false;
            };
        };
    };
    if (chunkData?.countryId) {
        const countryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);
        if (countryData?.id === playerData.country) {
            if (countryData?.owner === playerData?.id) return false;
            for (const role of playerData.roles) {
                const perms = GetAndParsePropertyData(`role_${role}`).permissions;
                if (perms.includes(permission)) {
                    return false;
                } else if (perms.includes(`admin`) || perms.includes(`owner`)) {
                    return false;
                };
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
    return false;
};

/**
 * 権限確認
 * @param {Player} player 
 * @param {string} permission 
 * @returns {boolean}
 */
export function CheckPermissionFromLocation(player, x, z, dimensionId, permission) {
    if (player.hasTag(`adminmode`)) return false;
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    //チャンクデータなし → 荒野の権限があれば許可
    const chunkData = GetAndParsePropertyData(GetChunkPropertyId(x, z, dimensionId));
    if (!chunkData) {
        if (config.wildernessAllowPermissions.includes(permission)) {
            return false;
        } else {
            return true;
        };
    };
    //荒野 → 荒野の権限があれば許可
    if (!chunkData?.countryId && !chunkData.owner && !chunkData?.special) {
        if (config.wildernessAllowPermissions.includes(permission)) {
            return false;
        } else {
            return true;
        };
    };
    //特別区 → 特別区のがあれば許可
    if (chunkData?.special) {
        if (config.specialAllowPermissions.includes(permission)) {
            return false;
        } else {
            return true;
        };
    };
    //個人所有の土地 → 規制がなければ許可 → 規制があってもallowListにいれば許可 → 自分の国かつownerがあるとき許可 また、戦争中なら許可 → なければキャンセル
    if (chunkData?.owner) {
        if (chunkData?.owner === playerData?.id) {
            if (!restrictionPermissions.includes(permission)) {
                return false;
            };
        } else {
            if (chunkData[`${permission}Restriction`]) {
                const allow = chunkData[`${permission}Allow`].includes(player.id);
                if (allow) {
                    return false;
                } else {
                    if (chunkData?.countryId) {
                        const countryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);
                        if (!playerData?.country) {
                            return true;
                        };
                        if (countryData?.warNowCountries.includes(playerData.country)) {
                            return false;
                        };
                        if (countryData?.id === playerData?.country) {
                            if (countryData?.owner === playerData?.id) return false;
                            for (const role of playerData.roles) {
                                if (GetAndParsePropertyData(`role_${role}`).permissions.includes(`owner`) || GetAndParsePropertyData(`role_${role}`).permissions.includes(`admin`)) {
                                    return false;
                                };
                            };
                            return true;
                        };
                    };
                };
            } else {
                return false;
            };
        };
    };
    if (chunkData?.countryId) {
        const countryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);
        if (countryData?.id === playerData?.country) {
            if (countryData?.owner === playerData?.id) return false;
            for (const role of playerData.roles) {
                const perms = GetAndParsePropertyData(`role_${role}`)?.permissions ?? [];
                if (perms.includes(permission)) {
                    return false;
                } else if (perms.includes(`admin`) || perms.includes(`owner`)) {
                    return false;
                };
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
    return false;
};

/**
 * 権限があるか確認
 * @param {Player} player 
 * @param {string} permission 
 * @returns {boolean}
 */
export function HasPermission(player, permission) {
    if (player.hasTag(`adminmode`)) return true;
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData?.country}`);
    if (countryData?.owner === playerData?.id) return true;
    for (const role of playerData.roles) {
        if (GetAndParsePropertyData(`role_${role}`).permissions.includes(`owner`) || GetAndParsePropertyData(`role_${role}`).permissions.includes(permission)) return true;
    };
    return false;
};

export function getRandomInteger(min, max) {
    return Math.floor((Math.random() * (max - min) + min) * 100) / 100;
};

/**
 * 数値かどうか
 * @param {number|string} value 
 * @returns 
 */
export function isDecimalNumber(value) {
    const integerRegex = /^[1-9]\d*$/;
    return integerRegex.test(value);
};
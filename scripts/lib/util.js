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
export function CheckPermission(player, permission) {
    // AdminMode 許可
    if (player.hasTag('adminmode')) return false;

    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    if (!playerData) return true;

    const chunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(player));
    const isWilderness = !chunkData || (!chunkData.countryId && !chunkData.owner && !chunkData.special);

    // ロールのみチェックする権限
    if (checkOnlyRole.includes(permission)) {
        if (playerData.country) {
            const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
            if (countryData?.owner === player.id) return false;
        }
        return !playerData.roles.some(roleId => {
            const role = GetAndParsePropertyData(`role_${roleId}`);
            return role.permissions.includes(permission) ||
                (permission !== 'owner' && permission !== 'admin' && (role.permissions.includes('admin') || role.permissions.includes('owner')));
        });
    }

    // チャンクデータなし、または荒野
    if (isWilderness) {
        return !config.wildernessAllowPermissions.includes(permission);
    }

    // 特別区
    if (chunkData.special) {
        return !config.specialAllowPermissions.includes(permission);
    }

    // 個人所有の土地
    if (chunkData.owner) {
        if (chunkData.owner === playerData.id) {
            return restrictionPermissions.includes(permission);
        }

        if (chunkData[`${permission}Restriction`]) {
            if (chunkData[`${permission}Allow`]?.includes(player.id)) return false;

            if (chunkData.countryId) {
                const chunkCountryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);
                if (chunkCountryData) {
                    if (chunkCountryData.warNowCountries?.includes(playerData.country)) return false;
                    if (chunkCountryData.id === playerData.country) {
                        if (chunkCountryData.owner === playerData.id) return false;
                        return !playerData.roles.some(roleId => {
                            const role = GetAndParsePropertyData(`role_${roleId}`);
                            return role.permissions.includes('owner') || role.permissions.includes('admin');
                        });
                    }
                }
            }
            return true;
        }
        return false;
    }

    // その他のケース（他国の土地）
    if (chunkData.countryId) {
        const chunkCountryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);
        if (chunkCountryData) {
            if (chunkCountryData.id === playerData.country) {
                if (chunkCountryData.owner === playerData.id) return false;
                return !playerData.roles.some(roleId => {
                    const role = GetAndParsePropertyData(`role_${roleId}`);
                    return role.permissions.includes(permission) ||
                        role.permissions.includes('admin') || role.permissions.includes('owner');
                });
            }

            if (chunkCountryData.alliance?.includes(playerData.country) && chunkCountryData.alliancePermission.includes(permission)) return false;
            if (chunkCountryData.hostility?.includes(playerData.country) && chunkCountryData.hostilityPermission.includes(permission)) return false;
            if (chunkCountryData.neutralityPermission.includes(permission)) return false;
        }
    }

    return true;
}

/**
 * 権限確認
 * @param {Player} player 
 * @param {number} x
 * @param {number} z
 * @param {string} dimensionId
 * @param {string} permission 
 * @returns {boolean}
 */
export function CheckPermissionFromLocation(player, x, z, dimensionId, permission) {
    // 管理者モードのチェック
    if (player.hasTag('adminmode')) return false;

    // プレイヤーデータの取得
    const playerData = GetAndParsePropertyData(`player_${player.id}`);

    // チャンクデータの取得
    const chunkData = GetAndParsePropertyData(GetChunkPropertyId(x, z, dimensionId));
    if (!chunkData) {
        return !config.wildernessAllowPermissions.includes(permission);
    }

    // 特別区のチェック
    if (chunkData.special) {
        return !config.specialAllowPermissions.includes(permission);
    }

    // 個人所有の土地のチェック
    if (chunkData.owner) {
        // 自分の土地
        if (chunkData.owner === playerData.id) {
            return false;
        }

        // 他人の土地
        if (chunkData[`${permission}Restriction`]) {
            if (chunkData[`${permission}Allow`]?.includes(player.id)) return false;
        } else {
            return false;
        }
    }
    // 所属国のデータ取得
    if (chunkData.countryId) {
        const countryData = GetAndParsePropertyData(`country_${chunkData.countryId}`);

        // 戦争中のチェック
        if (countryData.warNowCountries.includes(playerData.country)) return false;

        // 自国のチェック
        if (countryData.id === playerData.country) {
            if (countryData.owner === playerData.id) return false;

            // プレイヤーの役職権限のチェック
            for (const role of playerData.roles) {
                const roleData = GetAndParsePropertyData(`role_${role}`);
                if (roleData.permissions.includes('owner') || roleData.permissions.includes('admin')) return false;
            }
            return true;
        }

        // 同盟国のチェック
        if (countryData.alliance.includes(playerData.country)) {
            return !countryData.alliancePermission.includes(permission);
        }

        // 敵対国のチェック
        if (countryData.hostility.includes(playerData.country)) {
            return !countryData.hostilityPermission.includes(permission);
        }

        // 中立国のチェック
        return !countryData.neutralityPermission.includes(permission);
    }

    // チャンクデータが存在しない場合は、荒野の許可をチェック
    return !config.wildernessAllowPermissions.includes(permission);
}

/**
 * 権限があるか確認
 * @param {Player} player 
 * @param {string} permission 
 * @returns {boolean}
 */
export function HasPermission(player, permission) {
    if (player.hasTag('adminmode')) return true;
    const { id, country, roles } = GetAndParsePropertyData(`player_${player.id}`);
    const { owner } = GetAndParsePropertyData(`country_${country}`);
    if (owner === id) return true;
    return roles.some(role => {
        const { permissions } = GetAndParsePropertyData(`role_${role}`);
        return permissions.includes('owner') || permissions.includes(permission);
    });
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
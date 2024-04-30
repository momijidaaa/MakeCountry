/**
 * プレイヤーデータ フォーマット
 * 
 * {
 *     "10001": { name: "test", roles: ["1", "2"], money: 100 },
 *     "10002": { name: "test2", roles: ["3"], money: 100 }
 * } 
 *  
 * ロールデータ フォーマット
 * 
 * {
 *   "1": { name: "people", permission: ["admin", "moderator"] ,priority: 1},
 *   "2": { name: "general", permission: ["moderator"] ,priority: 3}, 
 *   "3": { name: "moderator", permission: ["moderator"] , priority: 2} 
 * }
 * 
 * 国データ フォーマット
 * {
 *   "1": {
 *     name: "テスト王国", //国の名前
 *     funds: 100000, //国の金データ
 *     lands: [ "1_1" , "1_2" ], //領土にしてるチャンクのデータ
 *     members: [ "10001" ], //メンバーのデータ
 *     roles: [ "1" , "2" ] //ロールのデータ
 *   }
 * }
 * 
 * 権限一覧
 * admin: 全機能
 * kickMembers: プレイヤーをキック
 * roleChange: ロールの変更
 * landBuy: 土地の購入
 * landSell: 土地の売却
*/

import { world } from "@minecraft/server";

/**
 * @type {{[key: string]: { name: string, roles: [string], money: number }}}
 */
let playersData = "";

/**
 * @type {{ [key: string]: { name: string, permission: [string], priority: number }}}
 */
let rolesData = "";

/**
 * @type {{[key: string]: { name: string, funds: number, lands: [string], members: [string], roles: [string] }}}
 */
let countryData = "";

//ワールド解放時にプレイヤーデータとロールデータを読み込み
world.afterEvents.worldInitialize.subscribe(() => {
    const rawPlayersData = world.getDynamicProperty(`players`);
    const rawRolesData = world.getDynamicProperty(`roles`);
    const rawCountryData = world.getDynamicProperty(`countries`);

    playersData = rawPlayersData ?? "{}";
    rolesData = rawRolesData ?? "{}";
    countryData = rawCountryData ?? "{}";
    
    if(!rawPlayersData) world.setDynamicProperty(`players`,"{}");
    if(!rawRolesData) world.setDynamicProperty(`roles`,"{}");
    if(!rawCountryData) world.setDynamicProperty(`countries`,"{}");
});

playersData = JSON.parse(playersData);
rolesData = JSON.parse(rolesData);
countryData = JSON.parse(countryData);

/**
 * ロールを持っているかどうかをチェックする関数
 * @param {string} playerId プレイヤーのID
 * @param {string} roleId ロールのID
 * @returns 
 */
export function hasRole(playerId, roleId) {
    return playersData[playerId] && playersData[playerId].roles.includes(roleId);
};

/**
 * プレイヤーが特定の権限を持っているかどうかをチェックする関数
 * @param {string} playerId プレイヤーのID
 * @param {string} permission 権限の文字列
 * @returns 
 */
export function hasPermission(playerId, permission) {
    if (playersData[playerId]) {
        for (let roleId of playersData[playerId].roles) {
            if (rolesData[roleId] && rolesData[roleId].permission.includes(permission)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * メンバーにロールを追加する関数
 * @param {string} playerId プレイヤーのID
 * @param {string} roleId ロールのID
 */
export function addRoleToMember(playerId, roleId) {
    if (playersData[playerId] && rolesData[roleId]) {
        if (!playersData[playerId].roles.includes(roleId)) {
            playersData[playerId].roles.push(roleId);
        }
    }
}

/**
 * メンバーからロールを削除する関数
 * @param {string} playerId プレイヤーのID
 * @param {string} roleId ロールのID
 */
export function removeRoleFromMember(playerId, roleId) {
    if (playersData[playerId]) {
        playersData[playerId].roles = playersData[playerId].roles.filter(role => role !== roleId);
    }
}

/**
 * ロールを削除する関数
 * @param {string} roleId ロールのID
 */
export function deleteRole(roleId) {
    if (rolesData[roleId]) {
        delete rolesData[roleId];
        // 関連するメンバーから削除
        for (let playerId in playersData) {
            if (playersData[playerId].roles.includes(roleId)) {
                removeRoleFromMember(playerId, roleId);
            }
        }
        console.log(`Role "${roleId}" deleted successfully.`);
    } else {
        console.log(`Role "${roleId}" not found.`);
    }
}

/**
 * ロールの権限を編集する関数
 * @param {string} roleId ロールのID
 * @param {string} newPermissions 権限のID
 */
export function editRolePermissions(roleId, newPermissions) {
    if (rolesData[roleId]) {
        rolesData[roleId].permission = newPermissions;
        console.log(`Permissions of role "${roleId}" updated successfully.`);
    } else {
        console.log(`Role "${roleId}" not found.`);
    }
}

/**
 * 国のロールの優先度を変更する関数
 * @param {string} roleId ロールのID
 * @param {number} newPriority 優先度のナンバー(数字が低い方が優先度高い)
 * @param {string} countryId 国のID
 */
export function changeRolePriority(roleId, newPriority, countryId) {
    if (countryData[countryId] && countryData[countryId].roles.includes(roleId)) {
        rolesData[roleId].priority = newPriority;
        console.log(`Priority of role "${roleId}" in country ${countryId} changed to ${newPriority}.`);
    } else {
        console.log(`Role "${roleId}" not found in country ${countryId}.`);
    }
}

/**
 * ロールの権限を削除する関数
 * @param {string} roleId ロールのID
 * @param {string} permissionToRemove 削除する権限の文字列
 */
export function removeRolePermission(roleId, permissionToRemove) {
    if (rolesData[roleId]) {
        rolesData[roleId].permission = rolesData[roleId].permission.filter(permission => permission !== permissionToRemove);
        console.log(`Permission "${permissionToRemove}" removed from role "${roleId}".`);
    } else {
        console.log(`Role "${roleId}" not found.`);
    }
}
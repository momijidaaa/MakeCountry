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
 * 権限一覧
 * admin: 全機能
 * countryManagement: 国のスポーンポイントなどの設定
 * budgetManagement: 資金管理
 * inviteMembers: 新たなプレイヤーを招待
 * kickMembers: プレイヤーをキック
 * roleChange: ロールの変更
 * landOperation: 土地の操作
 * territoryOperation: 領土設定
 * landBuy: 土地の購入
 * landSell: 土地の売却
 * resourcepoint: リソースポイントの操作
 * build: 建築
 * break: 破壊
 * use: 使用
 * taxOperation: 税金設定操作
 * dofwar: 宣戦布告
 * alliance: 同盟
 * peacechange: 平和主義の切り替え
 * surrender: 戦争に降伏
 * armsManagement: 兵器管理
*/

import { world } from "@minecraft/server";
import * as DyProp from "./DyProp";

/**
 * @type {{[key: string]: { name: string, roles: [string], money: number }}}
 */
let playersData = "";

/**
 * @type {{ [key: string]: { name: string, permission: [string], priority: number }}}
 */
let rolesData = "";

/**
 * @type {{[key: string]: {name: string, power: number,funds: number, lands: [string], members: [string], roles: [string] ,pacifism: [boolean], enemy: [string], ally: [string], neutral: [string], warnow: [string]}}}
 */
let countryData = "";

//ワールド解放時にプレイヤーデータとロールデータを読み込み
world.afterEvents.worldInitialize.subscribe(() => {
    const nextPlayerNum = DyProp.get(`nextPlayerNum`);
    const nextRoleNum = DyProp.get(`nextRoleNum`);
    const nextCountryNum = DyProp.get(`nextCountryNum`);

    const rawPlayersData = DyProp.get(`players`);
    const rawRolesData = DyProp.get(`roles`);
    const rawCountryData = DyProp.get(`countries`);

    playersData = rawPlayersData ?? "{}";
    rolesData = rawRolesData ?? "{}";
    countryData = rawCountryData ?? "{}";
    
    if(!rawPlayersData) DyProp.set(`players`,"{}");
    if(!rawRolesData) DyProp.set(`roles`,"{}");
    if(!rawCountryData) DyProp.set(`countries`,"{}");
    if(!nextPlayerNum) DyProp.set(`nextPlayerNum`,"1");
    if(!nextRoleNum) DyProp.set(`nextRoleNum`,"1");
    if(!nextCountryNum) DyProp.set(`nextCountryNum`,"1");

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
            };
            if(rolesData[roleId] && rolesData[roleId].permission.includes(`admin`)) {
                return true;
            };
        };
    };
    return false;
};

/**
 * メンバーにロールを追加する関数
 * @param {string} playerId プレイヤーのID
 * @param {string} roleId ロールのID
 */
export function MemberAddRole(playerId, roleId) {
    if (playersData[playerId] && rolesData[roleId]) {
        if (!playersData[playerId].roles.includes(roleId)) {
            playersData[playerId].roles.push(roleId);
            DyProp.set(`players`,JSON.stringify(playersData));
        };
    };
};

/**
 * メンバーからロールを削除する関数
 * @param {string} playerId プレイヤーのID
 * @param {string} roleId ロールのID
 */
export function MemberRemoveRole(playerId, roleId) {
    if (playersData[playerId]) {
        playersData[playerId].roles = playersData[playerId].roles.filter(role => role !== roleId);
        DyProp.set(`players`,JSON.stringify(playersData));
    };
};

/**
 * ロールを削除する関数
 * @param {string} roleId ロールのID
 */
export function deleteRole(roleId) {
    if (rolesData[roleId]) {
        delete rolesData[roleId];
        DyProp.set(`roles`,JSON.stringify(rolesData));
        // 関連するメンバーから削除
        for (let playerId in playersData) {
            if (playersData[playerId].roles.includes(roleId)) {
                MemberRemoveRole(playerId, roleId);
            };
        };
        console.warn(`Role "${roleId}" deleted successfully.`);
    } else {
        console.warn(`Role "${roleId}" not found.`);
    };
};

/**
 * ロールの権限を編集する関数
 * @param {string} roleId ロールのID
 * @param {string} newPermissions 権限のID
 */
export function addRolePermissions(roleId, newPermissions) {
    if (rolesData[roleId]) {
        rolesData[roleId].permission = newPermissions;
        DyProp.set(`roles`,JSON.stringify(rolesData));
        console.warn(`Permissions of role "${roleId}" updated successfully.`);
    } else {
        console.warn(`Role "${roleId}" not found.`);
    }
}

/**
 * ロールの優先度を変更し、他のロールの優先度も調整する関数
 * @param {string} roleId ロールのID
 * @param {number} newPriority 新しい優先度
 * @param {string} countryId 国のID
 */
export function changeRolePriority(roleId, newPriority, countryId) {
    const country = countryData[countryId];
    if (!country) {
        console.warn(`Country with ID ${countryId} not found.`);
        return;
    }

    const role = rolesData[roleId];
    if (!role) {
        console.warn(`Role with ID ${roleId} not found.`);
        return;
    }

    // ロールの優先度を変更
    role.priority = newPriority;

    // 他のロールの優先度を調整
    const rolesInCountry = country.roles.filter(id => id !== roleId).map(id => rolesData[id]);
    rolesInCountry.sort((a, b) => a.priority - b.priority);

    // 新しい優先度が最上位（1）になる場合
    if (newPriority === 1) {
        let adjustedPriority = 2;
        for (const otherRole of rolesInCountry) {
            otherRole.priority = adjustedPriority++;
        }
    }
    // 新しい優先度が最下位になる場合
    else if (newPriority > rolesInCountry.length) {
        let adjustedPriority = 1;
        for (const otherRole of rolesInCountry) {
            otherRole.priority = adjustedPriority++;
        }
        role.priority = adjustedPriority;
    }
    // それ以外の場合
    else {
        let adjustedPriority = 1;
        for (const otherRole of rolesInCountry) {
            // 新しい優先度と同じ値のロールがすでに存在する場合、他のロールの優先度を1つずつ減少させる
            if (adjustedPriority === newPriority) {
                adjustedPriority++;
            }
            otherRole.priority = adjustedPriority++;
        }
    }
    // データを保存
    DyProp.set(`roles`, JSON.stringify(rolesData));
    console.warn(`Priority of role "${roleId}" in country ${countryId} changed to ${newPriority}.`);
}

/**
 * ロールの権限を削除する関数
 * @param {string} roleId ロールのID
 * @param {string} permissionToRemove 削除する権限の文字列
 */
export function MemberRemoveRolePermission(roleId, permissionToRemove) {
    if (rolesData[roleId]) {
        rolesData[roleId].permission = rolesData[roleId].permission.filter(permission => permission !== permissionToRemove);
        DyProp.set(`roles`,JSON.stringify(rolesData));
        console.warn(`Permission "${permissionToRemove}" removed from role "${roleId}".`);
    } else {
        console.warn(`Role "${roleId}" not found.`);
    }
}

/**
 * ロールを作成する関数
 * @param {string} countryId 国のID
 * @param {string} roleName ロールの名前
 * @param {[string]} permissions 権限の設定
 * @returns 
 */
export function createRole(countryId, roleName, permissions = []) {
    const country = countryData[countryId];
    if (!country) {
        console.warn(`Country with ID ${countryId} not found.`);
        return;
    }

    // 新しいロールの優先度を決定する
    let lowestPriority = 1;
    for (const roleId of country.roles) {
        if (rolesData[roleId].priority < lowestPriority) {
            lowestPriority = rolesData[roleId].priority;
        }
    }
    // 新しいロールの優先度を一番低い優先度の1つ下に設定する
    const newPriority = lowestPriority - 1;

    // 新しいロールを作成して追加する
    let newRoleId = DyProp.get(`nextRoleNum`) ?? "1";
    newRoleId = Number(newRoleId)
    rolesData[newRoleId] = {
        name: roleName,
        permission: permissions,
        priority: newPriority
    };
    // 国のロールリストに新しいロールを追加する
    country.roles.push(newRoleId);
    DyProp.set(`nextRoleNum`,`${newRoleId + 1}`)
    DyProp.set(`roles`, JSON.stringify(rolesData));
    DyProp.set(`countries`, JSON.stringify(countryData));

    console.warn(`New role "${roleName}" added to country ${countryId} with priority ${newPriority}.`);
}

/**
 * 建国時に自動で初期のロールを設定
 * @param {string} countryId 
 */
export function firstRoleSetUp(countryId) {
    createRole(countryId,`Staff`,[`admin`]);
    createRole(countryId,`Member`,[`build`,`break`,`use`]);
};
/**
 * gridデータのフォーマット
 * {      countryId: string,      owner: string|undefined,      price: number,      id: string,     permission: {[roleId: string]: [[permission: string]: string]} ,dimension: string}}
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

import { Player, world } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId, StringifyAndSavePropertyData } from "./util";
import config from "./../config";

/**
 * 国を作る
 * @param {Player} owner 
 * @param {string} name 
 * @param {boolean} peace 
 */
export function MakeCountry(owner, name, peace = config.defaultPeace) {
    const ownerData = GetAndParsePropertyData(`player_${owner.id}`);
    if (ownerData.country) {
        owner.sendMessage({ translate: `already.country.join` });
        return;
    };
    const chunkId = GetPlayerChunkPropertyId(owner);
    const chunkData = GetAndParsePropertyData(chunkId);
    if (chunkData && chunkData.countryId) {
        owner.sendMessage({ translate: `already.country.here` });
        return;
    };
    if (chunkData && chunkData.noTerritory) {
        owner.sendMessage({ translate: `this.chunk.cannot.territory` });
        return;
    };
    if (ownerData.money < config.MakeCountryCost) {
        owner.sendMessage({ translate: `not.enough.makecountry.money`, with: [`${config.MoneyName} ${config.MakeCountryCost - ownerData.money}`] });
        return;
    };
    const idString = world.getDynamicProperty(`countryId`) ?? "1"
    const id = Number(idString);
    const ownerRole = CreateRole(`Owner`, [`admin`]);
    const adminRole = CreateRole(`Admin`, [`admin`]);
    const peopleRole = CreateRole(`People`, [`place`, `break`, `use`]);
    const countryData = {
        name: name,
        id: id,
        owner: owner.id,
        members: [owner.id],
        territories: [chunkId],
        ownerRole: ownerRole,
        adminRole: adminRole,
        peopleRole: peopleRole,
        roles: [ownerRole, adminRole, peopleRole],
        resourcePoint: 0,
        money: 0,
        hideMoney: true,
        peace: peace,
        //同盟国
        alliance: [],
        //敵対国
        hostility: [],
        //中立国の権限
        neutralityPermission: [`blockUse`,`entityUse`,`noTarget`],
        //同盟国の権限
        alliancePermission: [`blockUse`,`entityUse`,`noTarget`],
        //敵対国の権限
        hostilityPermission: [],
        //加盟している国際組織
        internationalOrganizations: [],
        //戦争中
        warNowCountries: [],
        //受け取った戦線布告の国
        declarationReceive: [],
        //送った戦線布告
        declarationSend: [],
        //受け取った同盟申請
        allianceRequestReceive: [],
        //送った同盟申請
        allianceRequestSend: [],
        //招待制
        invite: true,
    };

    StringifyAndSavePropertyData(`country_${id}`, countryData);
    world.setDynamicProperty(`countryId`, `${id++}`);
};


export function DeleteCountry(countryId) {
    const countryData = GetAndParsePropertyData(`country_${countryId}`);
    const roles = countryData.roles;
    const members = countryData.members;
    const territories = countryData.territories;


    const ownerData = GetAndParsePropertyData(`player_${owner.id}`);
    const chunkId = GetPlayerChunkPropertyId(owner);
    const chunkData = GetAndParsePropertyData(chunkId);
    if (chunkData && chunkData.countryId) {
        owner.sendMessage({ translate: `already.country.here` });
    };
    if (chunkData && chunkData.noTerritory) {
        owner.sendMessage({ translate: `this.chunk.cannot.territory` });
    };
    const idString = world.getDynamicProperty(`countryId`) ?? "1"
    const id = Number(idString);
    const ownerRole = CreateRole(`Owner`, [`admin`]);
    const adminRole = CreateRole(`Admin`, [`admin`]);
    const peopleRole = CreateRole(`People`, [`place`, `break`, `use`]);
};

/**
 * 指定した国でロールを作成
 * @param {string} countryId 
 * @param {string} name 
 * @param {Array<string>} permissions 
 * @param {string} iconTextureId 
 * @param {string} color 
 */
export function CreateRoleToCountry(countryId, name, permissions = [], iconTextureId = `stone`, color = `e`) {
    const roleId = CreateRole(name, permissions, iconTextureId, color);
    const countryData = GetAndParsePropertyData(`country_${countryId}`);
    countryData.roles.push(roleId);
    StringifyAndSavePropertyData(`country_${countryId}`, countryData);
    return roleId;
};

/**
 * 完了
 * ロール作成
 * @param {string} name 
 * @param {Array<string>} permissions 
 * @returns {string} RoleId
 */
export function CreateRole(name, permissions = [], iconTextureId = `stone`, color = `e`) {
    const roleIdString = world.getDynamicProperty(`roleId`) ?? "1";
    const id = Number(roleIdString);
    const roleData = {
        name: name,
        color: `§${color}`,
        icon: `textures/blocks/${iconTextureId}`,
        id: id,
        members: [],
        permissions: permissions
    };
    StringifyAndSavePropertyData(`role_${id}`, roleData);
    world.setDynamicProperty(`roleId`, `${id++}`);
    return roleData.id;
};

/**
 * 完了
 * ロールを削除
 * @param {Player} player 
 * @param {number} roleId 
 * @param {number} countryId 
 * @param {boolean} deleteCountry 
 * @returns 
 */
export function DeleteRole(player, roleId, countryId, deleteCountry = false) {
    const countryData = GetAndParsePropertyData(`country_${countryId}`);
    if (!deleteCountry) {
        if (roleId == countryData.ownerRole || roleId == countryData.adminRole || roleId == countryData.peopleRole) {
            player.sendMessage({ translate: `cannot.delete.role` });
            return;
        };
    };
    const roleData = GetAndParsePropertyData(`role_${roleId}`);
    roleData.members.forEach(memberId => {
        try {
            const memberData = GetAndParsePropertyData(`player_${memberId}`);
            memberData.roles.splice(memberData.roles.indexOf(roleId), 1);
        } catch (error) {
            console.warn(error);
        };
    });
    DyProp.setDynamicProperty(`role_${roleId}`);
    player.sendMessage({ translate: `complete.delete.role` })
};

/**
 * 国際組織を作る
 * @param {Player} owner 
 * @param {string} ownerCountryId
 * @param {string} name 
 */
export function MakeInternationalOrganization(owner, ownerCountryId, name) {
    const ownerData = GetAndParsePropertyData(`country_${ownerCountryId}`);
    if (ownerData.money < config.MakeInternationalOrganizationCost) {
        owner.sendMessage({ translate: `not.enough.country.money`, with: [`${config.MoneyName}${config.MakeInternationalOrganizationCost - ownerData.money}`] });
        return;
    };
    const idString = world.getDynamicProperty(`InternationalOrganizationId`) ?? "1"
    const id = Number(idString);

    const OrganizationData = {
        name: name,
        ownerCountryId: ownerCountryId,
        resourcePoint: 0,
        id: id,
        money: 0,
        //加盟国
        signatory: [ ownerCountryId ]
    };

    StringifyAndSavePropertyData(`InternationalOrganization_${id}`, OrganizationData);
    world.setDynamicProperty(`InternationalOrganizationId`, `${id++}`);
    return OrganizationData.id;
};

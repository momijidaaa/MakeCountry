import { Player, world } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { CheckPermission, GetAndParsePropertyData, GetChunkPropertyId, GetPlayerChunkPropertyId, StringifyAndSavePropertyData } from "./util";
import config from "../config";

/**
 * 国を作る
 * @param {Player} owner 
 * @param {string} name 
 * @param {boolean} invite 
 * @param {boolean} peace 
 */
export function MakeCountry(owner, name = `country`, invite = true, peace = config.defaultPeace) {
    const { x, z } = owner.location;
    const dimensionId = owner.dimension.id;
    const ownerData = GetAndParsePropertyData(`player_${owner.id}`);
    if (ownerData.country) {
        owner.sendMessage({ translate: `already.country.join` });
        return;
    };
    const chunkId = GetPlayerChunkPropertyId(owner);
    let chunkData = GetAndParsePropertyData(chunkId);
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
    let id = Number(idString);
    world.setDynamicProperty(`countryId`, `${id + 1}`);
    if (!chunkData) chunkData = GenerateChunkData(x, z, dimensionId, undefined, id, undefined, false);
    chunkData.countryId = id;
    ownerData.country = id;
    ownerData.money -= config.MakeCountryCost;
    const [ownerRole, adminRole, peopleRole] = CreateRole([
        { name: `Owner`, permissions: [`admin`], iconTextureId: `gold_block`, color: `e` },
        { name: `Admin`, permissions: [`admin`], iconTextureId: `iron_block`, color: `f` },
        { name: `People`, permissions: [`place`, `break`, `blockUse`, `entityUse`, `noTarget`, `invite`, `setHome`, `openContainer`], iconTextureId: `stone`, color: `a` }
    ]);
    ownerData.roles.push(ownerRole);
    const countryData = {
        name: name,
        id: id,
        owner: owner.id,
        lore: ``,
        //通貨のID(0が共通通貨)
        currencyUnitId: 0,
        days: 0,
        members: [owner.id],
        peaceChangeCooltime: 0,
        territories: [chunkId],
        ownerRole: ownerRole,
        adminRole: adminRole,
        peopleRole: peopleRole,
        spawn: undefined,
        publicSpawn: false,
        roles: [ownerRole, adminRole, peopleRole],
        resourcePoint: config.initialCountryResourcePoint,
        money: config.initialCountryMoney,
        taxPer: config.taxPer,
        taxInstitutionIsPer: config.taxInstitutionIsPer,
        hideMoney: config.hideCountryMoney,
        peace: peace,
        //色
        color: `e`,
        //同盟国
        alliance: [],
        //敵対国
        hostility: [],
        //中立国の権限
        neutralityPermission: [`blockUse`, `entityUse`, `noTarget`, `setHome`],
        //同盟国の権限
        alliancePermission: [`blockUse`, `entityUse`, `noTarget`, `setHome`],
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
        //受け取った講和申請
        applicationPeaceRequestReceive: [],
        //送った講和申請
        applicationPeaceRequestSend: [],
        //招待制
        invite: invite,
    };
    world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `born.country`, with: [name] }] });
    const ownerRoleData = GetAndParsePropertyData(`role_${ownerRole}`);
    ownerRoleData.members.push(`${owner.id}`);
    StringifyAndSavePropertyData(`country_${id}`, countryData);
    StringifyAndSavePropertyData(`role_${ownerRole}`, ownerRoleData);
    StringifyAndSavePropertyData(`player_${owner.id}`, ownerData);
    StringifyAndSavePropertyData(chunkData.id, chunkData);
};

export function GenerateChunkData(x, z, dimensionId, ownerId = undefined, countryId = undefined, price = config.defaultChunkPrice, special = false) {
    const chunkData = {
        x: x,
        z: z,
        id: GetChunkPropertyId(x, z, dimensionId),
        owner: ownerId,
        countryId: countryId,
        special: special,
        noTerritory: false,
        price: price,
        adminRestriction: false,
        adminAllow: [],
        placeRestriction: false,
        placeAllow: [],
        breakRestriction: false,
        breakAllow: [],
        blockUseRestriction: false,
        blockUseAllow: [],
        entityUseRestriction: false,
        entityUseAllow: [],
        setHomeRestriction: false,
        setHomeAllow: [],
        noTargetRestriction: false,
        noTargetAllow: [],
        editStructureRestriction: false,
        editStructureAllow: [],
    };
    return chunkData;
};

/**完成
 * 国力の計算
 * @param {string} countryId 
 * @returns {number}
 */
export function calculationCountryPower(countryId) {
    const countryData = GetAndParsePropertyData(countryId);
    let countryPower = 0;
    countryPower = countryData.money + countryData.members.length * 20 + countryData.territories.length * 10 + countryData.resourcePoint + countryData.alliance.length * 5 - countryData.hostility.length * 15;
    return countryPower;
};

/**
 * 国を削除
 * @param {string} countryId 
 */
export function DeleteCountry(countryId) {
    const countryData = GetAndParsePropertyData(`country_${countryId}`);
    const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`)
    ownerData.money = ownerData.money + countryData.money + countryData.resourcePoint;
    StringifyAndSavePropertyData(`player_${ownerData.id}`, ownerData);
    countryData.members.forEach(m => {
        const playerData = GetAndParsePropertyData(`player_${m}`);
        playerData.roles = [];
        playerData.country = undefined;
        StringifyAndSavePropertyData(`player_${m}`, playerData);
    });
    countryData.territories.forEach(t => {
        const chunkData = GetAndParsePropertyData(t);
        chunkData.countryId = undefined;
        StringifyAndSavePropertyData(t, chunkData);
    });
    countryData.alliance.forEach(a => {
        RemoveAlliance(countryId, a);
    });
    countryData.hostility.forEach(h => {
        RemoveHostility(countryId, h);
    });
    countryData.roles.forEach(r => {
        DyProp.setDynamicProperty(`role_${r}`);
    });
    //ここら辺に国際組織から抜ける処理を追加しておく
    DyProp.setDynamicProperty(`country_${countryData.id}`);
    world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `deleted.country`, with: [`${countryData.name}`] }] });
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
    const roleId = CreateRole([{ name: name, permissions: permissions, iconTextureId: iconTextureId, color: color }])[0];
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
export function CreateRole(roleDatas = [{ name: ``, permissions: [], iconTextureId: `stone`, color: `e` }]) {
    const roleIdString = world.getDynamicProperty(`roleId`) ?? "1";
    let id = Number(roleIdString);
    let returns = [];
    roleDatas.forEach(role => {
        const roleData = {
            name: role.name,
            color: `§a${role.color}`,
            icon: `textures/blocks/${role.iconTextureId}`,
            id: id,
            members: [],
            permissions: role.permissions
        };
        StringifyAndSavePropertyData(`role_${id}`, roleData);
        returns.push(roleData.id);
        id++
    });
    world.setDynamicProperty(`roleId`, `${id++}`);
    return returns;
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
            StringifyAndSavePropertyData(`player_${memberId}`, memberData);
        } catch (error) {
            console.warn(error);
        };
    });
    countryData.roles.splice(countryData.roles.indexOf(roleId), 1);
    StringifyAndSavePropertyData(`country_${countryId}`, countryData);
    DyProp.setDynamicProperty(`role_${roleId}`);
    player.sendMessage({ translate: `complete.delete.role` })
};

/**完成
 * 敵対国追加
 * @param {string} mainCountryId 
 * @param {string} countryId 
 */
export function AddHostility(mainCountryId, countryId) {
    const mainCountryData = GetAndParsePropertyData(`country_${mainCountryId}`);
    const CountryData = GetAndParsePropertyData(`country_${countryId}`);
    try {
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${countryData.money}`;
            resourcePoint = `${countryData.resourcePoint}`;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody = {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${config.MoneyName} ${money}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
                { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
            ]
        };
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        countryData.members.push(playerData.id);
        playerData.roles.push(countryData.peopleRole);
        playerData.country = countryId;
        const memberRoleData = GetAndParsePropertyData(`role_${countryData.peopleRole}`);
        memberRoleData.members.push(`${player.id}`);
        StringifyAndSavePropertyData(`role_${memberRoleData.id}`, memberRoleData);
        StringifyAndSavePropertyData(`player_${playerData.id}`, playerData);
        StringifyAndSavePropertyData(`country_${countryId}`, countryData);
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `joined.country` }] });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 国から抜けさせる
 * @param {Player} player 
 * @param {Number} countryId 
 */
export function joinCheckFromListForm(player, countryData) {
    try {
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${countryData.money}`;
            resourcePoint = `${countryData.resourcePoint}`;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.hostility;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.warNowCountries;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody = {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${config.MoneyName} ${money}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
                { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
            ]
        };
        const form = new ActionFormData();
        form.title(countryData.name);
        form.body(showBody);
        form.button({ translate: `mc.button.join` });
        form.button({ translate: `mc.button.back` });
        form.show(player).then(rs => {
            if (rs.canceled) {
                allowJoinCountriesList(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    playerCountryJoin(player, countryData.id);
                    return;
                };
                case 1: {
                    allowJoinCountriesList(player);
                    return;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};


/**
 * 
 * @param {Player} player 
 */
export function countryInvitesList(player) {
    let playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countriesData = [];
    for (const id of playerData?.invite) {
        const d = GetAndParsePropertyData(`country_${id}`);
        if (!d) {
            playerData?.invite.splice(playerData.invite.indexOf(id), 1);
            continue;
        };
        countriesData.push(d);
    };
    StringifyAndSavePropertyData(`player_${player.id}`, playerData);
    const form = new ActionFormData();
    if (countriesData.length === 0) {
        form.body({ translate: `no.invite.country` });
        form.button({ translate: `mc.button.back` });
    };
    countriesData.forEach(countryData => {
        form.button(`${countryData.name}\nID: ${countryData.id}`);
    });
    form.show(player).then(rs => {
        if (rs.canceled) {
            joinTypeSelectForm(player);
            return;
        };
        if (countriesData.length === 0) {
            joinTypeSelectForm(player);
            return;
        };
        joinCheckFromInviteForm(player, countriesData[rs.selection]);
        return;
    });
};

/**
 * 
 * @param {Player} player 
 */
export function allowJoinCountriesList(player) {
    const countriesData = [];
    for (const id of DyProp.DynamicPropertyIds().filter(b => b.startsWith(`country_`))) {
        const d = GetAndParsePropertyData(id);
        if (!d.invite) countriesData.push(d);
    };
    const form = new ActionFormData();
    if (countriesData.length === 0) {
        form.body({ translate: `no.allowjoin.country` })
        form.button({ translate: `mc.button.back` });
    };
    countriesData.forEach(countryData => {
        form.button(`${countryData.name}\nID: ${countryData.id}`);
    });
    form.show(player).then(rs => {
        if (rs.canceled) {
            joinTypeSelectForm(player);
            return;
        };
        if (countriesData.length === 0) {
            joinTypeSelectForm(player);
            return;
        };
        joinCheckFromListForm(player, countriesData[rs.selection]);
        return;
    });
};

/**
 * 国庫
 * @param {Player} player 
 */
export function treasuryMainForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const form = new ActionFormData();
    form.title({ translate: `form.treasurymain.title` });
    form.body({ rawtext: [{ translate: `treasurybudget.body` }, { text: `${config.MoneyName} ${countryData.money}\n` }, { translate: `resourcepoint.body` }, { text: `${countryData.resourcePoint}` }] });
    form.button({ translate: `treasurybudget` });
    form.button({ translate: `resourcepoint` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            settingCountry(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                treasurybudgetSelectForm(player);
                break;
            };
            case 1: {
                resourcepointSelectForm(player);
                break;
            };
        };
    });
};

/**
 * 
 * 国家予算のメインフォーム
 * @param {Player} player 
 */
export function treasurybudgetSelectForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const form = new ActionFormData();
    form.title({ translate: `treasurybudget` });
    form.body({ rawtext: [{ translate: `treasurybudget` }, { text: `${config.MoneyName} ${countryData.money}` }] });
    form.button({ translate: `deposit` });
    if (!CheckPermission(player, `withDrawTreasurybudget`)) form.button({ translate: `withdraw` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            treasuryMainForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                treasurybudgetDepositForm(player);
                break;
            };
            case 1: {
                treasurybudgetWithdrawForm(player);
                break;
            };
        };
    });
};

/**
 * 
 * 国家予算の入金フォーム
 * @param {Player} player 
 */
export function treasurybudgetDepositForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const form = new ModalFormData();
    form.title({ translate: `treasurybudget.deposit` });
    form.slider({ translate: `deposit` }, 0, playerData.money, 1);
    form.show(player).then(rs => {
        if (rs.canceled) {
            treasurybudgetSelectForm(player);
            return;
        };
        const playerData2 = GetAndParsePropertyData(`player_${player.id}`);
        const countryData2 = GetAndParsePropertyData(`country_${playerData2.country}`);
        let hasMoney = playerData2.money;
        let needMoney = rs.formValues[0];
        if (hasMoney < needMoney) {
            player.sendMessage({ translate: `error.notenough.money` });
            return;
        };
        countryData2.money += needMoney;
        playerData2.money -= needMoney;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData2);
        StringifyAndSavePropertyData(`country_${playerData2.country}`, countryData2);
        treasurybudgetSelectForm(player);
        return;
    });
};

/**
 * 
 * 国家予算の入金フォーム
 * @param {Player} player 
 */
export function treasurybudgetWithdrawForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const form = new ModalFormData();
    form.title({ translate: `treasurybudget.deposit` });
    form.slider({ translate: `deposit` }, 0, countryData.money, 1);
    form.show(player).then(rs => {
        if (rs.canceled) {
            treasurybudgetSelectForm(player);
            return;
        };
        const playerData2 = GetAndParsePropertyData(`player_${player.id}`);
        const countryData2 = GetAndParsePropertyData(`country_${playerData2.country}`);
        let hasMoney = countryData2.money;
        let needMoney = rs.formValues[0];
        if (hasMoney < needMoney) {
            player.sendMessage({ translate: `error.notenough.treasurybudget` });
            return;
        };
        countryData2.money -= needMoney;
        playerData2.money += needMoney;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData2);
        StringifyAndSavePropertyData(`country_${playerData2.country}`, countryData2);
        treasurybudgetSelectForm(player);
        return;
    });
};

/**
 * 
 * リソースポイントのメインフォーム
 * @param {Player} player 
 */
export function resourcepointSelectForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const form = new ActionFormData();
    form.title({ translate: `resourcepoint` });
    form.body({ rawtext: [{ translate: `resourcepoint` }, { text: `${config.MoneyName} ${countryData.resourcePoint}` }] });
    form.button({ translate: `conversion` });
    if (!CheckPermission(player, `withDrawResourcepoint`)) form.button({ translate: `withdraw` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            treasuryMainForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                resourcepointDepositForm(player);
                break;
            };
            case 1: {
                resourcepointWithdrawForm(player);
                break;
            };
        };
    });
};

/**
 * 
 * リソースポイントの入金フォーム
 * @param {Player} player 
 */
export function resourcepointDepositForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const form = new ModalFormData();
    form.title({ translate: `resourcepoint.conversion` });
    form.slider({ translate: `conversion` }, 0, playerData.money, 1);
    form.show(player).then(rs => {
        if (rs.canceled) {
            resourcepointSelectForm(player);
            return;
        };
        const playerData2 = GetAndParsePropertyData(`player_${player.id}`);
        const countryData2 = GetAndParsePropertyData(`country_${playerData2.country}`);
        let hasMoney = playerData2.money;
        let needMoney = rs.formValues[0];
        if (hasMoney < needMoney) {
            player.sendMessage({ translate: `error.notenough.money` });
            return;
        };
        countryData2.resourcePoint += needMoney;
        playerData2.money -= needMoney;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData2);
        StringifyAndSavePropertyData(`country_${playerData2.country}`, countryData2);
        resourcepointSelectForm(player);
        return;
    });
};

/**
 * 
 * リソースポイント→金フォーム
 * @param {Player} player 
 */
export function resourcepointWithdrawForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const form = new ModalFormData();
    form.title({ translate: `resourcepoint.withdraw` });
    form.slider({ translate: `withdraw` }, 0, countryData.resourcePoint, 1);
    form.show(player).then(rs => {
        if (rs.canceled) {
            resourcepointSelectForm(player);
            return;
        };
        const playerData2 = GetAndParsePropertyData(`player_${player.id}`);
        const countryData2 = GetAndParsePropertyData(`country_${playerData2.country}`);
        let hasMoney = countryData2.resourcePoint;
        let needMoney = rs.formValues[0];
        if (hasMoney < needMoney) {
            player.sendMessage({ translate: `error.notenough.resourcepoint` });
            return;
        };
        countryData2.resourcePoint -= needMoney;
        playerData2.money += needMoney;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData2);
        StringifyAndSavePropertyData(`country_${playerData2.country}`, countryData2);
        resourcepointSelectForm(player);
        return;
    });
};

/**
 * 
 * 国の設定
 * @param {Player} player 
 */
export function settingCountry(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.setting.title` });
    form.body({ translate: `form.setting.body` });
    form.button({ translate: `form.setting.button.info` });
    form.button({ translate: `form.setting.button.treasury` });
    form.button({ translate: `form.setting.button.invite` });
    form.button({ translate: `form.setting.button.members` });
    form.button({ translate: `form.setting.button.role` });
    if (!CheckPermission(player, `owner`)) form.button({ translate: `form.setting.button.delete` });

    form.show(player).then(rs => {
        if (rs.canceled) {
            if (rs.cancelationReason === FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    settingCountry(player);
                    return;
                }, 10);
                return;
            };
            //player.sendMessage({ translate: `form.cancel.message` });
            return;
        };
        switch (rs.selection) {
            case 0: {
                settingCountryInfoForm(player);
                break;
            };
            case 1: {
                treasuryMainForm(player);
                break;
            };
            case 2: {
                inviteForm(player);
                break;
            };
            case 3: {
                settingCountryMembersForm(player);
                break;
            };
            case 4: {
                settingCountryRoleForm(player);
                break;
            };
            case 5: {
                countryDeleteCheckForm(player);
                break;
            };
        };
    });
};

/**
 * 
 * 自国の情報表示
 * @param {Player} player 
 */
export function settingCountryInfoForm(player, countryData = undefined) {
    try {
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        if (!countryData) countryData = GetAndParsePropertyData(`country_${playerData.country}`);
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${config.MoneyName} ${countryData.money}`;
            resourcePoint = countryData.resourcePoint;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const countryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(countryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const countryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(countryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const countryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(countryData.name);
        });

        const showBody = [
            { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
            { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
            { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
            { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
            { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
            { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
            { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
            { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${money}` }] } }, { text: `\n` },
            { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
            { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
            { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
            { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
            { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
            { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
            { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
            { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
        ];

        const form = new ActionFormData();
        form.title({ translate: `form.setting.info.title` });
        form.body({ rawtext: showBody });
        form.button({ translate: `form.setting.info.button.name` });
        form.button({ translate: `form.setting.info.button.lore` });
        form.button({ translate: `form.setting.info.button.peace` });
        form.button({ translate: `form.setting.info.button.invite` });
        form.button({ translate: `form.setting.info.button.tax` });
        form.button({ translate: `form.setting.info.button.external.affairs` });

        form.show(player).then(rs => {
            if (rs.canceled) {
                settingCountry(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    if (!CheckPermission(player, `editCountryName`)) {
                        editCountryNameForm(player, countryData);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 1: {
                    if (!CheckPermission(player, `editCountryLore`)) {
                        editCountryLoreForm(player, countryData);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 2: {
                    if (!CheckPermission(player, `peaceChange`)) {
                        editCountryPeaceForm(player, countryData);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 3: {
                    if (!CheckPermission(player, `inviteChange`)) {
                        editCountryInviteForm(player, countryData);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 4: {
                    if (!CheckPermission(player, `taxAdmin`)) {
                        editTaxMainForm(player);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 5: {
                    externalAffairsMainForm(player);
                    break;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 対外関係メインフォーム
 * @param {Player} player 
 */
export function externalAffairsMainForm(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.setting.info.button.external.affairs` });
    //中立国の権限設定
    form.button({ translate: `neutrality.permission.edit` });
    //同盟国
    form.button({ translate: `alliance` });
    //敵対国
    form.button({ translate: `hostility` });
    //受信した同盟申請
    form.button({ translate: `received.alliance.request` });
    //受信した講和申請
    form.button({ translate: `received.application.request` });

    //戦争
    form.button({ translate: `war` });
    form.show(player).then((rs) => {
        if (rs.canceled) {
            settingCountryInfoForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                //中立国の権限設定
                if (!CheckPermission(player, `neutralityPermission`)) {
                    //form
                    setNeutralityPermissionForm(player);
                    break;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
            };
            case 1: {
                //同盟国
                if (!CheckPermission(player, `allyAdmin`)) {
                    //form
                    AllianceMainForm(player);
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
            case 2: {
                //敵対国
                if (!CheckPermission(player, `hostilityAdmin`)) {
                    //form
                    HostilityMainForm(player);
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
            case 3: {
                //受信した同盟申請
                if (!CheckPermission(player, `allyAdmin`)) {
                    //form
                    ReceivedAllianceRequestForm(player);
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
            case 4: {
                //受信した講和申請
                if (!CheckPermission(player, `hostilityAdmin`)) {
                    ReceivedApplicationRequestForm(player);
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
            case 5: {
                //宣戦布告
                if (!CheckPermission(player, `warAdmin`)) {
                    //form
                    //かみんぐすーん
                    player.sendMessage({ translate: `comingsoon.message` });
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
        };
    });
};

/**
 * 受信した同盟申請
 * @param {Player} player 
 */
export function ReceivedAllianceRequestForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
    let receivedAllianceRequests = playerCountryData.allianceRequestReceive
    const form = new ActionFormData();
    form.title({ translate: `received.alliance.request` });
    if (receivedAllianceRequests.length == 0) form.button({ translate: `mc.button.back` });
    for (const countryId of receivedAllianceRequests) {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        form.button(`${countryData.name}\nID: ${countryData.id}`);
    };
    form.show(player).then((rs) => {
        if (CheckPermission(player, `allyAdmin`)) {
            player.sendMessage({ translate: `no.permission` });
        };
        if (rs.canceled) {
            externalAffairsMainForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                externalAffairsMainForm(player);
                break;
            };
            default: {
                allianceRequestCountryForm(player, receivedAllianceRequests[rs.selection - 1]);
                break;
            };
        };
    });
};

/**
 * 受信リストから選択した国
 * @param {Player} player 
 * @param {number} countryId 
 */
export function allianceRequestCountryForm(player, countryId) {
    try {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${countryData.money}`;
            resourcePoint = `${countryData.resourcePoint}`;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody = {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${config.MoneyName} ${money}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
                { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
            ]
        };
        const form = new ActionFormData();
        form.title(countryData.name);
        form.body(showBody);
        form.button({ translate: `mc.button.back` });
        form.button({ translate: `mc.button.approval` });
        form.button({ translate: `mc.button.delete` });
        form.show(player).then(rs => {
            if (CheckPermission(player, `allyAdmin`)) {
                player.sendMessage({ translate: `no.permission` });
                return;
            };
            if (rs.canceled) {
                ReceivedAllianceRequestForm(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    ReceivedAllianceRequestForm(player);
                    return;
                };
                case 1: {
                    AddAlliance(player, countryId);
                    return;
                };
                case 2: {
                    denyAllianceRequest(player, countryId);
                    return;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 受信した講和申請
 * @param {Player} player 
 */
export function ReceivedApplicationRequestForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
    let receivedApplicationRequests = playerCountryData.applicationPeaceRequestReceive
    const form = new ActionFormData();
    form.title({ translate: `received.application.request` });
    if (receivedApplicationRequests.length == 0) form.button({ translate: `mc.button.back` });
    for (const countryId of receivedApplicationRequests) {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        form.button(`${countryData.name}\nID: ${countryData.id}`);
    };
    form.show(player).then((rs) => {
        if (CheckPermission(player, `hostilityAdmin`)) {
            player.sendMessage({ translate: `no.permission` });
        };
        if (rs.canceled) {
            externalAffairsMainForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                externalAffairsMainForm(player);
                break;
            };
            default: {
                applicationRequestCountryForm(player, receivedApplicationRequests[rs.selection - 1]);
                break;
            };
        };
    });
};

/**
 * 受信リストから選択した国
 * @param {Player} player 
 * @param {number} countryId 
 */
export function applicationRequestCountryForm(player, countryId) {
    try {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${countryData.money}`;
            resourcePoint = `${countryData.resourcePoint}`;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody = {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${config.MoneyName} ${money}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
                { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
            ]
        };
        const form = new ActionFormData();
        form.title(countryData.name);
        form.body(showBody);
        form.button({ translate: `mc.button.back` });
        form.button({ translate: `mc.button.approval` });
        form.button({ translate: `mc.button.delete` });
        form.show(player).then(rs => {
            if (CheckPermission(player, `allyAdmin`)) {
                player.sendMessage({ translate: `no.permission` });
                return;
            };
            if (rs.canceled) {
                ReceivedAllianceRequestForm(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    ReceivedApplicationRequestForm(player);
                    return;
                };
                case 1: {
                    acceptApplicationRequest(player, countryId);
                    return;
                };
                case 2: {
                    denyApplicationRequest(player, countryId);
                    return;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 同盟国メインフォーム
 * @param {Player} player 
 */
export function AllianceMainForm(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.alliance.main.title` });
    form.button({ translate: `alliance.permission.edit` });
    form.button({ translate: `form.alliance.list.title` });
    //ここに一覧ボタン
    //一覧フォームには追加ボタンも用意する
    form.show(player).then((rs) => {
        if (rs.canceled) {
            externalAffairsMainForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                if (!CheckPermission(player, `allyAdmin`)) {
                    //form
                    setAlliancePermissionForm(player);
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
            //1 一覧フォーム
            case 1: {
                if (!CheckPermission(player, `allyAdmin`)) {
                    //form
                    AllianceListForm(player);
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
        };
    });
};

/**
 * 同盟国リストフォーム
 * @param {Player} player 
 */
export function AllianceListForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
    let allianceCountryIds = playerCountryData.alliance;
    const form = new ActionFormData();
    form.title({ translate: `form.alliance.list.title` });
    form.button({ translate: `form.check.alliance.send.title` });
    for (const countryId of allianceCountryIds) {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        form.button(`${countryData.name}\nID: ${countryData.id}`);
    };
    form.show(player).then((rs) => {
        if (rs.canceled) {
            AllianceMainForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                //追加フォーム
                AddAllianceListForm(player);
                break;
            };
            default: {
                //詳細表示＆選択肢
                AllianceCountryFromListForm(player, allianceCountryIds[rs.selection - 1]);
                break;
            };
        };
    });
};

/**
 * 新たに同盟国にする国のリスト
 * @param {Player} player 
 */
export function AddAllianceListForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
    let hostilityCountryIds = playerCountryData.hostility;
    let allianceCountryIds = playerCountryData.alliance;
    const form = new ActionFormData();
    form.title({ translate: `form.check.alliance.send.title` });
    let countryIds = DyProp.DynamicPropertyIds().filter(id => id.startsWith(`country_`)).filter(id => id != `country_${playerData.country}`);
    let filtered1 = countryIds.filter(id => !hostilityCountryIds.includes(id));
    let filtered2 = filtered1.filter(id => !allianceCountryIds.includes(id));
    form.button({ translate: `mc.button.back` });
    let lands = [];
    for (const countryId of filtered2) {
        const countryData = GetAndParsePropertyData(countryId);
        lands.push(countryData.id);
        form.button(`${countryData.name}\nID: ${countryData.id}`);
    };
    form.show(player).then((rs) => {
        if (CheckPermission(player, `hostilityAdmin`)) {
            player.sendMessage({ translate: `no.permission` });
            return;
        };
        if (rs.canceled) {
            AllianceListForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                AllianceListForm(player);
                return;
            };
            case 1: {
                addAllianceCountryFromListForm(player, lands[rs.selection - 1]);
                return;
            };
        };
    });
};

/**
 * 同盟国候補一覧から選んだ国
 * @param {Player} player 
 * @param {number} countryId 
 */
export function addAllianceCountryFromListForm(player, countryId) {
    try {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${countryData.money}`;
            resourcePoint = `${countryData.resourcePoint}`;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody = {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${config.MoneyName} ${money}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
                { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
            ]
        };
        const form = new ActionFormData();
        form.title(countryData.name);
        form.body(showBody);
        form.button({ translate: `mc.button.back` });
        form.button({ translate: `mc.button.send` });
        form.show(player).then(rs => {
            if (CheckPermission(player, `allyAdmin`)) {
                player.sendMessage({ translate: `no.permission` });
                return;
            };
            if (rs.canceled) {
                AllianceListForm(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    AllianceListForm(player);
                    return;
                };
                case 1: {
                    checkAddAllianceForm(player, countryId);
                    return;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 同盟申請送信チェックフォーム
 * @param {Player} player 
 * @param {Number} countryId 
 */
export function checkAddAllianceForm(player, countryId) {
    const form = new ActionFormData();
    form.title({ translate: `form.check.alliance.send.title` });
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.send` });
    form.show(player).then((rs) => {
        if (CheckPermission(player, `allyAdmin`)) {
            player.sendMessage({ translate: `no.permission` });
            return;
        };
        if (rs.canceled) {
            addAllianceCountryFromListForm(player, countryId);
            return;
        };
        switch (rs.selection) {
            case 0: {
                addAllianceCountryFromListForm(player, countryId);
                return;
            };
            case 1: {
                sendAllianceRequest(player, countryId);
                return;
            };
        };
    });
};

/**
 * 同盟国一覧から選んだ国
 * @param {Player} player 
 * @param {number} countryId 
 */
export function AllianceCountryFromListForm(player, countryId) {
    try {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${countryData.money}`;
            resourcePoint = `${countryData.resourcePoint}`;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody = {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${config.MoneyName} ${money}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
                { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
            ]
        };
        const form = new ActionFormData();
        form.title(countryData.name);
        form.body(showBody);
        form.button({ translate: `mc.button.back` });
        form.button({ translate: `mc.button.remove.alliance` });
        form.show(player).then(rs => {
            if (CheckPermission(player, `allyAdmin`)) {
                player.sendMessage({ translate: `no.permission` });
                return;
            };
            if (rs.canceled) {
                AllianceListForm(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    AllianceListForm(player);
                    return;
                };
                case 1: {
                    checkAllianceRemoveForm(player, countryId);
                    return;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 同盟解除チェックフォーム
 * @param {Player} player 
 * @param {Number} countryId 
 */
export function checkAllianceRemoveForm(player, countryId) {
    const form = new ActionFormData();
    form.title({ translate: `form.check.alliance.remove.title` });
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.remove.alliance` });
    form.show(player).then((rs) => {
        if (CheckPermission(player, `allyAdmin`)) {
            player.sendMessage({ translate: `no.permission` });
            return;
        };
        if (rs.canceled) {
            AllianceCountryFromListForm(player, countryId);
            return;
        };
        switch (rs.selection) {
            case 0: {
                AllianceCountryFromListForm(player, countryId);
                return;
            };
            case 1: {
                const playerData = GetAndParsePropertyData(`player_${player.id}`);
                const countryData = GetAndParsePropertyData(`country_${countryId}`);
                RemoveAlliance(playerData.country, countryId);
                player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `remove.alliance`, with: [`${countryData.name}`] }] })
                return;
            };
        };
    });
};

/**
 * 敵対国メインフォーム
 * @param {Player} player 
 */
export function HostilityMainForm(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.hostility.main.title` });
    form.button({ translate: `hostility.permission.edit` });
    form.button({ translate: `form.hostility.list.title` });
    //ここに一覧ボタン
    //一覧フォームには追加ボタンも用意する
    form.show(player).then((rs) => {
        if (rs.canceled) {
            externalAffairsMainForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                if (!CheckPermission(player, `hostilityAdmin`)) {
                    //form
                    setHostilityPermissionForm(player);
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
            //1 一覧フォーム
            case 1: {
                if (!CheckPermission(player, `hostilityAdmin`)) {
                    //form
                    HostilityListForm(player);
                    return;
                } else {
                    player.sendMessage({ translate: `no.permission` });
                };
                break;
            };
        };
    });
};

/**
 * 敵対国リストフォーム
 * @param {Player} player 
 */
export function HostilityListForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
    let hostilityCountryIds = playerCountryData.hostility;
    const form = new ActionFormData();
    form.title({ translate: `form.hostility.list.title` });
    form.button({ translate: `form.hostility.list.button.add` });
    for (const countryId of hostilityCountryIds) {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        form.button(`${countryData.name}\nID: ${countryData.id}`);
    };
    form.show(player).then((rs) => {
        if (rs.canceled) {
            HostilityMainForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                //追加フォーム
                AddHostilityListForm(player);
                break;
            };
            default: {
                //詳細表示＆選択肢
                HostilityCountryFromListForm(player, hostilityCountryIds[rs.selection - 1]);
                break;
            };
        };
    });
};

/**
 * 新たに敵対国にする国のリスト
 * @param {Player} player 
 */
export function AddHostilityListForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
    let hostilityCountryIds = playerCountryData.hostility;
    let allianceCountryIds = playerCountryData.alliance;
    const form = new ActionFormData();
    form.title({ translate: `form.hostility.add.title` });
    let countryIds = DyProp.DynamicPropertyIds().filter(id => id.startsWith(`country_`)).filter(id => id != `country_${playerData.country}`);
    let filtered1 = countryIds.filter(id => !hostilityCountryIds.includes(id));
    let filtered2 = filtered1.filter(id => !allianceCountryIds.includes(id));
    let lands = [];
    form.button({ translate: `mc.button.back` });
    for (const countryId of filtered2) {
        const countryData = GetAndParsePropertyData(countryId);
        lands.push(countryData.id);
        form.button(`${countryData.name}\nID: ${countryData.id}`);
    };
    form.show(player).then((rs) => {
        if (CheckPermission(player, `hostilityAdmin`)) {
            player.sendMessage({ translate: `no.permission` });
            return;
        };
        if (rs.canceled) {
            HostilityListForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                HostilityListForm(player);
                return;
            };
            default: {
                addHostilityCountryFromListForm(player, lands[rs.selection - 1]);
                return;
            };
        };
    });
};

/**
 * 敵対国候補一覧から選んだ国
 * @param {Player} player 
 * @param {number} countryId 
 */
export function addHostilityCountryFromListForm(player, countryId) {
    try {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${countryData.money}`;
            resourcePoint = `${countryData.resourcePoint}`;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody = {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${config.MoneyName} ${money}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
                { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
            ]
        };
        const form = new ActionFormData();
        form.title(countryData.name);
        form.body(showBody);
        form.button({ translate: `mc.button.back` });
        form.button({ translate: `mc.button.add` });
        form.show(player).then(rs => {
            if (CheckPermission(player, `hostilityAdmin`)) {
                player.sendMessage({ translate: `no.permission` });
                return;
            };
            if (rs.canceled) {
                HostilityListForm(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    HostilityListForm(player);
                    return;
                };
                case 1: {
                    checkAddHostilityForm(player, countryId);
                    return;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 講和申請送信チェックフォーム
 * @param {Player} player 
 * @param {Number} countryId 
 */
export function checkAddHostilityForm(player, countryId) {
    const form = new ActionFormData();
    form.title({ translate: `form.check.hostility.add.title` });
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.add` });
    form.show(player).then((rs) => {
        if (CheckPermission(player, `hostilityAdmin`)) {
            player.sendMessage({ translate: `no.permission` });
            return;
        };
        if (rs.canceled) {
            addHostilityCountryFromListForm(player, countryId);
            return;
        };
        switch (rs.selection) {
            case 0: {
                addHostilityCountryFromListForm(player, countryId);
                return;
            };
            case 1: {
                AddHostilityByPlayer(player, countryId);
                return;
            };
        };
    });
};

/**
 * 敵対国一覧から選んだ国
 * @param {Player} player 
 * @param {number} countryId 
 */
export function HostilityCountryFromListForm(player, countryId) {
    try {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
        const ownerData = GetAndParsePropertyData(`player_${countryData.owner}`);
        const membersId = countryData.members.filter(m => m !== ownerData.id);
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        let money = `show.private`;
        let resourcePoint = `show.private`;
        if (!countryData.hideMoney) {
            money = `${countryData.money}`;
            resourcePoint = `${countryData.resourcePoint}`;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody = {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: { rawtext: [{ translate: `${config.MoneyName} ${money}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: { rawtext: [{ translate: `${resourcePoint}` }] } }, { text: `\n` },
                { translate: `form.showcountry.option.peace`, with: [`${countryData.peace}`] }, { text: `\n` },
                { translate: `form.showcountry.option.invite`, with: [`${countryData.invite}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxper`, with: [`${countryData.taxPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.taxinstitutionisper`, with: [`${countryData.taxInstitutionIsPer}`] }, { text: `\n` },
                { translate: `form.showcountry.option.alliance`, with: [`${allianceCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.hostility`, with: [`${hostilityCountryName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.warnow`, with: [`${warNowCountryName.join(`§r , `)}`] }
            ]
        };
        const form = new ActionFormData();
        form.title(countryData.name);
        form.body(showBody);
        form.button({ translate: `mc.button.back` });
        form.button({ translate: `mc.button.application` });
        form.show(player).then(rs => {
            if (CheckPermission(player, `hostilityAdmin`)) {
                player.sendMessage({ translate: `no.permission` });
                return;
            };
            if (rs.canceled) {
                HostilityListForm(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    HostilityListForm(player);
                    return;
                };
                case 1: {
                    checkApplicationForPeaceSendForm(player, countryId);
                    return;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 講和申請送信チェックフォーム
 * @param {Player} player 
 * @param {Number} countryId 
 */
export function checkApplicationForPeaceSendForm(player, countryId) {
    const form = new ActionFormData();
    form.title({ translate: `form.check.application.send.title` });
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.send` });
    form.show(player).then((rs) => {
        if (CheckPermission(player, `hostilityAdmin`)) {
            player.sendMessage({ translate: `no.permission` });
            return;
        };
        if (rs.canceled) {
            HostilityCountryFromListForm(player, countryId);
            return;
        };
        switch (rs.selection) {
            case 0: {
                HostilityCountryFromListForm(player, countryId);
                return;
            };
            case 1: {
                //form
                sendApplicationForPeace(player, countryId);
                return;
            };
        };
    });
};

const landPermissions = [
    `place`,
    `break`,
    `setHome`,
    `blockUse`,
    `entityUse`,
    `noTarget`,
];

/**
 * 中立国の権限を編集
 * @param {Player} player 
 */
export function setNeutralityPermissionForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const form = new ModalFormData();
    form.title({ translate: `neutrality.permission.edit` });
    for (const permission of landPermissions) {
        form.toggle({ translate: `permission.${permission}` }, countryData.neutralityPermission.includes(permission));
    };
    form.submitButton({ translate: `mc.button.save` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            externalAffairsMainForm(player);
            return;
        };
        const values = rs.formValues;
        let newLandPermissions = [];
        for (let i = 0; i < values.length; i++) {
            if (values[i]) {
                newLandPermissions.push(landPermissions[i]);
            };
        };
        countryData.neutralityPermission = newLandPermissions;
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        externalAffairsMainForm(player);
        return;
    });
};

/**
 * 敵対国の権限を編集
 * @param {Player} player 
 */
export function setHostilityPermissionForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const form = new ModalFormData();
    form.title({ translate: `hostility.permission.edit` });
    for (const permission of landPermissions) {
        form.toggle({ translate: `permission.${permission}` }, countryData.hostilityPermission.includes(permission));
    };
    form.submitButton({ translate: `mc.button.save` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            HostilityMainForm(player);
            return;
        };
        const values = rs.formValues;
        let newLandPermissions = [];
        for (let i = 0; i < values.length; i++) {
            if (values[i]) {
                newLandPermissions.push(landPermissions[i]);
            };
        };
        countryData.hostilityPermission = newLandPermissions;
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        HostilityMainForm(player);
        return;
    });
};

/**
 * 同盟国の権限を編集
 * @param {Player} player 
 */
export function setAlliancePermissionForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const form = new ModalFormData();
    form.title({ translate: `alliance.permission.edit` });
    for (const permission of landPermissions) {
        form.toggle({ translate: `permission.${permission}` }, countryData.alliancePermission.includes(permission));
    };
    form.submitButton({ translate: `mc.button.save` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            AllianceMainForm(player);
            return;
        };
        const values = rs.formValues;
        let newLandPermissions = [];
        for (let i = 0; i < values.length; i++) {
            if (values[i]) {
                newLandPermissions.push(landPermissions[i]);
            };
        };
        countryData.alliancePermission = newLandPermissions;
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        AllianceMainForm(player);
        return;
    });
};

/**
 * 税金管理メインフォーム
 * @param {Player} player 
 */
export function editTaxMainForm(player) {
    const form = new ModalFormData();
    const lastPlayerData = GetAndParsePropertyData(`player_${player.id}`)
    const lastountryData = GetAndParsePropertyData(`country_${lastPlayerData?.country}`);
    let taxMessageLabel = `label.input.taxnum`;
    if (lastountryData.taxInstitutionIsPer) taxMessageLabel = `label.input.taxper`;
    form.title({ translate: `form.setting.info.button.tax` })
    form.toggle({ translate: `tax.select.toggle.label` }, lastountryData.taxInstitutionIsPer);
    form.textField({ translate: taxMessageLabel }, { translate: `input.number` }, `${lastountryData.taxPer}`);
    form.show(player).then((rs) => {
        if (rs.canceled) {
            settingCountryInfoForm(player);
            return;
        };
        const cancel = CheckPermission(player, `taxAdmin`);
        if (cancel) {
            player.sendMessage({ translate: `no.permission` });
            return;
        };
        let value = rs.formValues[1];
        if (!isDecimalNumber(value)) {
            player.sendMessage({ translate: `input.error.notnumber` });
            return;
        };
        if (100 < Number(rs.formValues[1]) && rs.formValues[0] == true) {
            player.sendMessage({ translate: `input.error.over100` });
            return;
        };
        if (Number(rs.formValues[1]) < 0) {
            player.sendMessage({ translate: `input.error.under0` });
            return;
        };
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
        countryData.taxInstitutionIsPer = rs.formValues[0];
        countryData.taxPer = Number(rs.formValues[1]);
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        player.sendMessage({ translate: `updated` });
        return;
    });
};

export function editCountryNameForm(player, countryData) {
    const form = new ModalFormData();
    form.title({ translate: `form.editcountryname.title` });
    form.textField({ translate: `form.editcountryname.label` }, { translate: `form.editcountryname.input` }, countryData.name);
    form.submitButton({ translate: `mc.button.change` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            settingCountryInfoForm(player, countryData);
            return;
        };
        let value = rs.formValues[0];
        if (value === ``) value === `Country`;
        const beforeName = countryData.name;
        countryData.name = value;
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `changed.countryname` }, { text: `\n§r${beforeName} ->§r ${value}` }] });
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        settingCountryInfoForm(player, countryData);
        return;
    });
};

export function editCountryPeaceForm(player, countryData) {
    const form = new ModalFormData();
    form.title({ translate: `form.editcountrypeace.title` });
    form.toggle({ translate: `form.editcountrypeace.label` }, countryData.peace);
    form.submitButton({ translate: `mc.button.change` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            settingCountryInfoForm(player, countryData);
            return;
        };
        if (0 < countryData.peaceChangeCooltime) {
            player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `peace.cooltime` }, { text: ` (${countryData.peaceChangeCooltime})` }] });
            return;
        };
        const beforeValue = countryData.peace;
        let value = rs.formValues[0];
        if (rs.formValues[0] == beforeValue) {
            settingCountryInfoForm(player, countryData);
            return;
        };
        countryData.peace = value;
        countryData.peaceChangeCooltime = config.peaceChangeCooltime;
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `changed.peace` }, { text: `\n§r${beforeValue} ->§r ${value}` }] });
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        return;
    });
};

/**
 * 
 * @param {Player} player 
 * @param {Player} member 
 * @param {object} countryData 
 */
export function playerChangeOwner(player, member, countryData) {
    const memberData = GetAndParsePropertyData(`player_${member.id}`);
    if (memberData?.country != countryData?.id) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `ownerchange.error` }] });
        return;
    };
    countryData.owner = member.id;
    world.getPlayers().find(p => p.id == member.id).sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `changed.owner.message.newowner` }] });
    player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `changed.owner.message.sender`, with: [member.name] }] });
    StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
    return;
};

/**
 * プレイヤーに招待を送る
 * @param {Player} receivePlayer 
 * @param {Player} sendPlayer 
 * @param {Number} countryId 
 */
export function playerCountryInvite(receivePlayer, sendPlayer) {
    try {
        if (CheckPermission(sendPlayer, `invite`)) {
            sendPlayer.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§c\n` }, { translate: `send.invite.error.permission.message` }] });
            return;
        };
        const sendPlayerData = GetAndParsePropertyData(`player_${sendPlayer.id}`);
        const receivePlayerData = GetAndParsePropertyData(`player_${receivePlayer.id}`);
        const countryId = sendPlayerData.country;
        receivePlayerData.invite.splice(receivePlayerData.invite.indexOf(countryId), 1);
        receivePlayerData.invite.push(countryId);
        StringifyAndSavePropertyData(`player_${sendPlayer.id}`, sendPlayerData);
        StringifyAndSavePropertyData(`player_${receivePlayer.id}`, receivePlayerData);
        sendPlayer.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `send.invite.message` }] });
        if (receivePlayerData?.settings?.inviteReceiveMessage) receivePlayer.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `receive.invite.message` }] });
        return;
    } catch (error) {
        console.warn(error);
    };
};
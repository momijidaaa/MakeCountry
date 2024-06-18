import { Player, system, world } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import config from "../config";
import { DeleteCountry, DeleteRole, MakeCountry, playerCountryInvite, playerCountryJoin, playerCountryKick } from "./land";
import { CheckPermission, GetAndParsePropertyData, HasPermission, StringifyAndSavePropertyData } from "./util";

/**
 * 国民一覧
 * @param {Player} player 
 */
export function settingCountryMembersForm(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.setting.members.title` });
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const countryData = GetAndParsePropertyData(`country_${playerData?.country}`);
    const members = [];
    countryData.members.forEach(memberId => {
        members.push(GetAndParsePropertyData(`player_${memberId}`));
    });
    members.forEach(member => {
        form.button(`${member.name}\n${member.id}`);
    });
    //処理書け
    form.show(player).then(rs => {
        if (rs.canceled) {
            settingCountry(player);
            return;
        };
        memberSelectedShowForm(player, members[rs.selection], countryData);
        return;
    });
};

/**
 * 選んだメンバーを表示
 * @param {Player} player 
 * @param {Player} member 
 * @param {any} countryData
 */
export function memberSelectedShowForm(player, member, countryData) {
    /**
     * @type {RawMessage}
     */
    const bodyData = [
        { translate: `` }
    ];
    const form = new ActionFormData();
    form.title({ translate: `form.memberselectedshow.title`, with: [member.name] });
    form.body({ rawtext: bodyData });
    //ボタン追加
    /*
    明日の自分へ
    設定項目考えておいて
    */

    //ロール変更(admin権限)
    //国から追い出す(kickMember)
    //オーナー権限の譲渡(owner)
    form.button({ translate: `mc.button.back` });
    if (CheckPermission(player, `kick`)) form.button({ translate: `form.memberselectedshow.button.kick` });
    if (CheckPermission(player, `admin`)) form.button({ translate: `form.memberselectedshow.button.role` });
    if (CheckPermission(player, `owner`)) form.button({ translate: `form.memberselectedshow.button.owner` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            settingCountryMembersForm(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                //戻る
                settingCountryMembersForm(player);
                break;
            };
            case 1: {
                //国から追い出す
                if (player.id === member.id) {
                    player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `form.kick.error.same` }] });
                    return;
                };
                playerKickCheckForm(player, member, countryData);
                break;
            };
            case 2: {
                //ロール変更
                playerRoleChangeForm(player,member,countryData);
                break;
            };
            case 3: {
                //オーナー権限の譲渡
                player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `form.owner.error.same` }] });
                break;
            };
        };
    });
};

/**
 * キックチェック
 * @param {Player} player 
 * @param {Player} member 
 */
export function playerKickCheckForm(player, member, countryData) {
    const form = new ActionFormData();
    form.body({ translate: `kick.check.body`, with: [member.name] });
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.kick` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            memberSelectedShowForm(player, member, countryData);
            return;
        };
        switch (rs.selection) {
            case 0: {
                memberSelectedShowForm(player, member, countryData);
                break;
            };
            case 1: {
                playerCountryKick(member);
                player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `kicked.finish.message.sender`, with: [member.name] }] });
                settingCountryMembersForm(player);
                break;
            };
        };
    });
};

/**
 * 
 * @param {Player} player 
 * @param {Player} member 
 * @param {any} countryData 
 */
export function playerRoleChangeForm(player, member, countryData) {
    let EnableEditRoleIds = [];
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const memberData = GetAndParsePropertyData(`player_${member.id}`);
    if (countryData?.owner === player.id) {
        for (const role of countryData?.roles) {
            EnableEditRoleIds.push(role);
        };
    } else {
        const playerAdminRoles = [];
        for (const playerRoleId of playerData.roles) {
            const role = GetAndParsePropertyData(`role_${playerRoleId}`);
            if (role.permissions.includes(`admin`)) {
                playerAdminRoles.push(role);
            };
        };

        let maxRoleNumber = countryData.roles.length;
        for (const role of playerAdminRoles) {
            const place = countryData.roles.indexOf(role);
            if (-1 < place) {
                if (maxRoleNumber < place) maxRoleNumber = place;
            };
        };
        EnableEditRoleIds = countryData.roles.slice(maxRoleNumber + 1);
    };
    if (EnableEditRoleIds.length === 0) {
        const form = new ActionFormData();
        form.title({ translate: `error.message` });
        form.body({ translate: `not.exsit.can.accessrole` });
        form.button({ translate: `mc.button.back` });
        form.show(player).then(rs => {
            memberSelectedShowForm(player, member, countryData);
            return;
        });
    } else {
        let memberRoleExsits = [];
        const form = new ModalFormData();
        form.title({ translate: `form.role.change.title` });
        for (const roleId of EnableEditRoleIds) {
            const role = GetAndParsePropertyData(`role_${roleId}`);
            const value = memberData.roles.includes(roleId);
            if (value) memberData.roles.splice(memberData.roles.indexOf(roleId), 1);
            memberRoleExsits.push(value);
            form.toggle(role.name, value);
            form.submitButton({ translate: `mc.button.update` });
        };
        form.show(player).then(rs => {
            if (rs.canceled) {
                memberSelectedShowForm(player, member, countryData);
                return;
            };
            for (let i = 0; i < memberRoleExsits.length; i++) {
                if (rs.formValues[i]) {
                    memberData.roles.push(EnableEditRoleIds[i]);
                };
            };
            StringifyAndSavePropertyData(`player_${memberData.id}`, memberData);
            memberSelectedShowForm(player, member, countryData);
            return;
        });
    };
};

/**
 * 
 * @param {Player} player 
 */
export function playerMainMenu(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.mainmenu.title` });
    form.button({ translate: `form.mainmenu.button.profile` });
    form.button({ translate: `form.mainmenu.button.sendmoney` });
    form.button({ translate: `form.mainmenu.button.join` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            if (rs.cancelationReason === FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    playerMainMenu(player);
                }, 10);
                return;
            };
            return;
        };
        switch (rs.selection) {
            case 0: {
                showProfileForm(player);
                break;
            };
            case 1: {
                sendMoneyForm(player);
                break;
            };
            case 2: {
                joinTypeSelectForm(player);
                break;
            };
        };
    });
};

/**
 * 金を送れるプレイヤーのリスト
 * @param {Player} player 
 * @param {boolean} serch 
 * @param {string} keyword 
 */
export function sendMoneyForm(player, serch = false, keyword = ``) {
    const form = new ActionFormData();
    let players = world.getPlayers();
    form.title({ translate: `form.sendmoney.list.title` });
    form.button({ translate: `form.sendmoney.button.serch` });
    if (serch) {
        players = players.filter(p => p.name.includes(keyword));
    };
    players.forEach(p => {
        form.button(`${p.name}§r\n${p.id}`);
    });
    form.show(player).then(rs => {
        if (rs.canceled) {
            playerMainMenu(player);
        };
        switch (rs.selection) {
            case 0: {
                //検索form
                serchSendMoneyForm(player, keyword);
                break;
            };
            default: {
                sendMoneyCheckForm(player, players[0]);
                break;
            };
        };
    });
};

/**
 * 送金するプレイヤーの条件絞り込み検索
 * @param {Player} player 
 * @param {string} keyword 
 */
export function serchSendMoneyForm(player, keyword) {
    const form = new ModalFormData();
    form.title({ translate: `form.serchsendmoney.title` });
    form.textField({ translate: `form.serchsendmoney.word.label` }, { translate: `form.serchsendmoney.word.input` }, keyword);
    form.submitButton({ translate: `mc.button.serch` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            sendMoneyForm(player, true, keyword);
            return;
        };
        sendMoneyForm(player, true, rs.formValues[0]);
        return;
    });
};

/**
 * 送金チェックフォーム
 * @param {Player} sendPlayer 
 * @param {Player} receivePlayer 
 */
export function sendMoneyCheckForm(sendPlayer, receivePlayer) {
    const sendPlayerData = GetAndParsePropertyData(`player_${sendPlayer.id}`);
    const form = new ModalFormData();
    form.title({ translate: `form.sendmoney.check.title` });
    form.slider({ translate: `form.sendmoney.check.label` }, 0, sendPlayerData?.money, 1);
    form.submitButton({ translate: `mc.button.sendmoney` });
    form.show(sendPlayer).then(rs => {
        if (rs.canceled) {
            sendMoneyForm(sendPlayer);
            return;
        };
        const receivePlayerData = GetAndParsePropertyData(`player_${receivePlayer.id}`);
        const value = rs.formValues[0];
        receivePlayerData.money += value;
        sendPlayerData.money -= value;
        sendPlayer.sendMessage({ translate: `command.sendmoney.result.sender`, with: [receivePlayer.name, `${config.MoneyName} ${value}`] });
        receivePlayer.sendMessage({ translate: `command.sendmoney.result.receiver`, with: [sendPlayer.name, `${config.MoneyName} ${value}`] });
        StringifyAndSavePropertyData(`player_${receivePlayer.id}`, receivePlayerData);
        StringifyAndSavePropertyData(`player_${sendPlayer.id}`, sendPlayerData);
        return;
    });
};

/**
 * 招待を送れるプレイヤーのリスト
 * @param {Player} player 
 * @param {boolean} serch 
 * @param {string} keyword 
 */
export function inviteForm(player, serch = false, keyword = ``) {
    if (!CheckPermission(player, `invite`)) {
        player.sendMessage({ translate: `send.invite.error.permission.message` });
        return;
    };
    const form = new ActionFormData();
    let players = world.getPlayers().filter(p => !GetAndParsePropertyData(`player_${p.id}`)?.country);
    form.title({ translate: `form.sendinvite.list.title` })
    form.button({ translate: `form.invite.button.serch` });
    if (serch) {
        players = players.filter(p => p.name.includes(keyword));
    };
    players.forEach(p => {
        form.button(`${p.name}§r\n${p.id}`);
    });
    form.show(player).then(rs => {
        if (rs.canceled) {
            settingCountry(player);
        };
        switch (rs.selection) {
            case 0: {
                //検索form
                serchInviteForm(player, keyword);
                break;
            };
            default: {
                sendInviteCheckForm(player, players[0]);
                break;
            };
        };
    });
};

export function serchInviteForm(player, keyword) {
    const form = new ModalFormData();
    form.title({ translate: `form.serchinvite.title` });
    form.textField({ translate: `form.serchinvite.word.label` }, { translate: `form.serchinvite.word.input` }, keyword);
    form.submitButton({ translate: `mc.button.serch` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            inviteForm(player, true, keyword);
            return;
        };
        inviteForm(player, true, rs.formValues[0]);
        return;
    });
};

/**
 * 招待チェックフォーム
 * @param {Player} sendPlayer 
 * @param {Player} receivePlayer 
 */
export function sendInviteCheckForm(sendPlayer, receivePlayer) {
    const form = new ActionFormData();
    form.title({ translate: `form.sendinvite.check.title` });
    form.body({ translate: `form.sendinvite.check.body`, with: [receivePlayer.name] });
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.send` });
    form.show(sendPlayer).then(rs => {
        if (rs.canceled) {
            inviteForm(sendPlayer);
            return;
        };
        switch (rs.selection) {
            case 0: {
                inviteForm(sendPlayer);
                break;
            };
            case 1: {
                playerCountryInvite(receivePlayer, sendPlayer);
                break;
            };
        };
    });
};

/**
 * プロフィールを表示
 * @param {Player} player 
 */
export function showProfileForm(player) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const showProfile = [
        { translate: `msg.name` }, { text: `${playerData?.name} §r\n` },
        { translate: `msg.lv` }, { text: `${player.level} §r\n` },
        { translate: `msg.havemoney` }, { text: `${playerData?.money} §r\n` },
        { translate: `msg.days` }, { text: `${playerData?.days} §r\n` },
        { translate: `msg.country` }, { text: `${playerData?.country ?? `None`} §r\n` },
        { translate: `msg.invite` }, { text: `${playerData?.invite.length ?? `None`} §r\n` },
        { translate: `msg.havechunks` }, { text: `${playerData?.chunks.length} §r` }
    ];
    const form = new ActionFormData();
    form.title({ translate: `form.profile.title` });
    form.body({ rawtext: showProfile })
    form.button({ translate: `mc.button.back` });
    form.show(player).then(rs => {
        playerMainMenu(player);
        return;
    });
};

/**
 * 国に参加するときの形式選択
 * @param {Player} player 
 */
export function joinTypeSelectForm(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.invite.title` });
    form.button({ translate: `form.invite.check.invite` });
    form.button({ translate: `form.invite.list.allowjoin` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            playerMainMenu(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                //招待を確認
                countryInvitesList(player);
                break;
            };
            case 1: {
                //入れる国のリスト
                allowJoinCountriesList(player);
                break;
            };
        };
    });
};

/**
 * 
 * @param {Player} player 
 * @param {any} countryData 
 */
export function joinCheckFromInviteForm(player, countryData) {
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
            const subCountryData = GetAndParsePropertyData(id);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(id);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(id);
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
        const form = new ActionFormData();
        form.title(countryData.name);
        form.body(showBody);
        form.button({ translate: `mc.button.join` });
        form.button({ translate: `mc.button.back` });
        form.show(player).then(rs => {
            if (rs.canceled) {
                countryInvitesList(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    playerData.invite.splice(playerData.invite.indexOf(countryData.id), 1);
                    StringifyAndSavePropertyData(`player_${playerData.id}`, playerData);
                    playerCountryJoin(player, countryData.id);
                    return;
                };
                case 1: {
                    countryInvitesList(player);
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
 * @param {any} countryData 
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
            const subCountryData = GetAndParsePropertyData(id);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(id);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(id);
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
 * 
 * 国の設定
 * @param {Player} player 
 */
export function settingCountry(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.setting.title` });
    form.body({ translate: `form.setting.body` });
    form.button({ translate: `form.setting.button.info` });
    form.button({ translate: `form.setting.button.invite` });
    form.button({ translate: `form.setting.button.members` });
    form.button({ translate: `form.setting.button.role` });
    form.button({ translate: `form.setting.button.delete` });

    form.show(player).then(rs => {
        if (rs.canceled) {
            if (rs.cancelationReason === FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    settingCountry(player);
                    return;
                }, 10);
                return;
            };
            player.sendMessage({ translate: `form.cancel.message` });
            return;
        };
        switch (rs.selection) {
            case 0: {
                settingCountryInfoForm(player)
                break;
            };
            case 1: {
                inviteForm(player);
                break;
            };
            case 2: {
                settingCountryMembersForm(player);
                break;
            };
            case 3: {
                settingCountryRoleForm(player);
                break;
            };
            case 4: {
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
            money = countryData.money;
            resourcePoint = countryData.resourcePoint;
        };
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const countryData = GetAndParsePropertyData(id);
            allianceCountryName.push(countryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const countryData = GetAndParsePropertyData(id);
            hostilityCountryName.push(countryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const countryData = GetAndParsePropertyData(id);
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
            { translate: `form.showcountry.option.money`, with: [`${config.MoneyName} ${countryData.money}`] }, { text: `\n` },
            { translate: `form.showcountry.option.resourcepoint`, with: [`${countryData.resourcePoint}`] }, { text: `\n` },
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

        form.show(player).then(rs => {
            if (rs.canceled) return;
            switch (rs.selection) {
                case 0: {
                    if (HasPermission(player, `editCountryName`)) {
                        editCountryNameForm(player, countryData);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 1: {
                    if (HasPermission(player, `editCountryLore`)) {
                        editCountryLoreForm(player, countryData);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 2: {
                    if (HasPermission(player, `peaceChange`)) {
                        editCountryPeaceForm(player, countryData);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 3: {
                    if (HasPermission(player, `inviteChange`)) {
                        editCountryInviteForm(player, countryData);
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
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
        };
        const beforeValue = countryData.peace;
        let value = rs.formValues[0];
        countryData.peace = value;
        countryData.peaceChangeCooltime = config.peaceChangeCooltime;
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `changed.peace` }, { text: `\n§r${beforeValue} ->§r ${value}` }] });
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        return;
    });
};

export function editCountryInviteForm(player, countryData) {
    const form = new ModalFormData();
    form.title({ translate: `form.editcountryinvite.title` });
    form.toggle({ translate: `form.editcountryinvite.label` }, countryData.invite);
    form.submitButton({ translate: `mc.button.change` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            settingCountryInfoForm(player, countryData);
            return;
        };
        const beforeValue = countryData.invite;
        let value = rs.formValues[0];
        countryData.invite = value;
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `changed.invite` }, { text: `\n§r${beforeValue} ->§r ${value}` }] });
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        return;
    });
};

export function editCountryLoreForm(player, countryData) {
    const form = new ModalFormData();
    form.title({ translate: `form.editcountrylore.title` });
    form.textField({ translate: `form.editcountrylore.label` }, { translate: `form.editcountrylore.input` }, countryData.lore);
    form.submitButton({ translate: `mc.button.change` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            settingCountryInfoForm(player, countryData);
            return;
        };
        let value = rs.formValues[0];
        const beforeLore = countryData.lore;
        countryData.lore = value;
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `changed.countrylore` }, { text: `\n§r${beforeLore} ->§r ${value}` }] });
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        settingCountryInfoForm(player, countryData);
        return;
    });
};

const rolePermissions = [
    `editCountryName`,
    `editCountryLore`,
    `peaceChange`,
    `inviteChange`,
    `invite`,
    `place`,
    `break`,
    `setHome`,
    `kick`,
    `blockUse`,
    `entityUse`,
    `noTarget`,
    `buyChunk`,
    `sellChunk`,
    `taxAdmin`,
    `allyAdmin`,
    `hostilityAdmin`,
    `warAdmin`,
    `neutralityPermission`
];

/**
 * 国を消す前の確認
 * @param {Player} player 
 */
export function countryDeleteCheckForm(player) {
    try {
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        const form = new ActionFormData();
        form.title({ translate: `form.dismantle.check` });
        form.body({ rawtext: [{ translate: `mc.warning` }, { text: `\n` }, { translate: `form.dismantle.body` }] });
        form.button({ translate: `mc.button.back` });
        form.button({ translate: `mc.button.dismantle` });
        form.show(player).then(rs => {
            if (rs.canceled) {
                settingCountry(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    settingCountry(player);
                    break;
                };
                case 1: {
                    player.sendMessage({ translate: `form.dismantle.complete` })
                    DeleteCountry(playerData.country);
                    break;
                };
            };
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 完成
 * 国の一覧表示
 * @param {Player} player 
 */
export function countryList(player) {
    try {
        const form = new ActionFormData();
        form.title({ translate: `form.countrylist.title` });
        const countryIds = DyProp.DynamicPropertyIds().filter(c => c.startsWith(`country_`));
        let countries = [];
        countryIds.forEach(id => {
            countries[countries.length] = GetAndParsePropertyData(id);
        });
        if (countries.length === 0) {
            form.body({ translate: `no.countries.world` });
            form.button({ translate: `mc.button.close` });
        };
        countries.forEach(country => {
            form.button(`${country.name} \n§rID: ${country.id}`);
        });
        form.show(player).then(rs => {
            if (rs.canceled) {
                if (rs.cancelationReason === FormCancelationReason.UserBusy) {
                    system.runTimeout(() => {
                        countryList(player);
                        return;
                    }, 10);
                    return;
                };
                return;
            };
            if (countries.length === 0) {
                return;
            };
            showCountryInfo(player, countries[rs.selection]);
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 国の情報を表示
 * @param {Player} player 
 * @param {any} countryData 
 */
export function showCountryInfo(player, countryData) {
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
            const subCountryData = GetAndParsePropertyData(id);
            allianceCountryName.push(subCountryData.name);
        });
        const hostilityIds = countryData.alliance;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(id);
            hostilityCountryName.push(subCountryData.name);
        });
        const warNowIds = countryData.hostility;
        let warNowCountryName = [];
        warNowIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(id);
            warNowCountryName.push(subCountryData.name);
        });
        const showBody =
        {
            rawtext: [
                { translate: `form.showcountry.option.name`, with: [countryData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.lore`, with: [countryData.lore] }, { text: `\n` },
                { translate: `form.showcountry.option.id`, with: [`${countryData.id}`] }, { text: `\n` },
                { translate: `form.showcountry.option.owner`, with: [ownerData.name] }, { text: `\n` },
                { translate: `form.showcountry.option.memberscount`, with: [`${countryData.members.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.members`, with: [`${membersName.join(`§r , `)}`] }, { text: `\n` },
                { translate: `form.showcountry.option.territories`, with: [`${countryData.territories.length}`] }, { text: `\n` },
                { translate: `form.showcountry.option.money`, with: [`${config.MoneyName} ${money}`] }, { text: `\n` },
                { translate: `form.showcountry.option.resourcepoint`, with: [`${resourcePoint}`] }, { text: `\n` },
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
        form.show(player).then(rs => {
            countryList(player);
            return;
        });
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 完成
 * ロールの一覧表示
 * @param {Player} player 
 */
export function settingCountryRoleForm(player) {
    try {
        let EnableEditRoleIds = [];
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        const countryData = GetAndParsePropertyData(`country_${playerData?.country}`);
        if (countryData?.owner === player.id) {
            for (const role of countryData?.roles) {
                EnableEditRoleIds.push(role);
            };
        } else {
            const playerAdminRoles = [];
            for (const playerRoleId of playerData.roles) {
                const role = GetAndParsePropertyData(`role_${playerRoleId}`);
                if (role.permissions.includes(`admin`)) {
                    playerAdminRoles.push(role);
                };
            };
            let maxRoleNumber = countryData.roles.length;
            for (const role of playerAdminRoles) {
                const place = countryData.roles.indexOf(role);
                if (-1 < place) {
                    if (maxRoleNumber < place) maxRoleNumber = place;
                };
            };
            EnableEditRoleIds = countryData.roles.slice(maxRoleNumber + 1);
        };
        const form = new ActionFormData();
        if (EnableEditRoleIds.length === 0) {
            form.title({ translate: `form.setting.button.role` });
            form.body({ translate: `not.exsit.can.accessrole` });
            form.button({ translate: `mc.button.back` });
            form.show(player).then(rs => {
                settingCountry(player);
                return;
            });
        } else {
            form.title({ translate: `form.setting.button.role` });
            let roles = [];
            EnableEditRoleIds.forEach(id => {
                roles.push(GetAndParsePropertyData(`role_${id}`));
            });
            roles.forEach(role => {
                form.button(role.name, role.icon);
            });
            form.show(player).then(rs => {
                if (rs.canceled) {
                    settingCountry(player);
                    return;
                };
                selectRoleEditType(player, roles[rs.selection]);
                return;
            });
        };
    } catch (error) {
        console.warn(error);
    };
};

/**
 * 完成
 * ロールのアイコンを変更
 * @param {Player} player 
 * @param {any} roleData 
 */
export function RoleIconChange(player, roleData) {
    if (HasPermission(player, `admin`)) {
        const form = new ModalFormData();
        form.title({ translate: `form.role.iconchange.title`, with: [roleData.name] });
        form.textField({ translate: `form.role.iconchange.label` }, { translate: `form.role.iconchange.input` }, roleData.icon);
        form.submitButton({ translate: `mc.button.change` });
        form.show(player).then(rs => {
            if (rs.canceled) {
                selectRoleEditType(player, roleData);
                return;
            };
            roleData.icon = rs.formValues[0];
            if (rs.formValues[0] === ``) roleData.icon = undefined;
            StringifyAndSavePropertyData(`role_${roleData.id}`, roleData);
            selectRoleEditType(player, roleData);
            return;
        });
    };
};

/**
 * 完成
 * ロールの名前を変更
 * @param {Player} player 
 * @param {any} roleData 
 */
export function RoleNameChange(player, roleData) {
    if (HasPermission(player, `admin`)) {
        const form = new ModalFormData();
        form.title({ translate: `form.role.namechange.title`, with: [roleData.name] });
        form.textField({ translate: `form.role.namechange.label` }, { translate: `form.role.namechange.input` }, roleData.name);
        form.submitButton({ translate: `mc.button.change` });
        form.show(player).then(rs => {
            if (rs.canceled) {
                selectRoleEditType(player, roleData);
                return;
            };
            roleData.name = rs.formValues[0] ?? `None`;
            StringifyAndSavePropertyData(`role_${roleData.id}`, roleData);
            selectRoleEditType(player, roleData);
            return;
        });
    };
};

/**
 * 完成
 * ロールの詳細
 * @param {Player} player 
 * @param {any} roleData 
 */
export function selectRoleEditType(player, roleData) {
    if (HasPermission(player, `admin`)) {
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        const form = new ActionFormData();
        form.title({ translate: `form.role.edit.select.title`, with: [roleData.name] });
        form.button({ translate: `form.role.edit.select.button.name` });
        form.button({ translate: `form.role.edit.select.button.icon` });
        //form.button({translate: `form.role.edit.select.button.members`});
        form.button({ translate: `form.role.edit.select.button.permission` });
        form.button({ translate: `form.role.edit.select.button.delete` });
        form.show(player).then(rs => {
            if (rs.canceled) {
                settingCountryRoleForm(player);
                return;
            };
            switch (rs.selection) {
                case 0: {
                    //名前の変更
                    RoleNameChange(player, roleData);
                    break;
                };
                case 1: {
                    //アイコンの変更
                    RoleIconChange(player, roleData);
                    break;
                };
                case 2: {
                    //権限の編集
                    setRolePermissionForm(player, roleData);
                    break;
                };
                case 3: {
                    //ロールの削除
                    DeleteRole(player, roleData.id, playerData.country);
                    break;
                };
            };
        });
    };
};

/**
 * 完成
 * ロールの権限編集
 * @param {Player} player 
 * @param {any} roleData 
 */
export function setRolePermissionForm(player, roleData) {
    if (HasPermission(player, `admin`)) {
        const form = new ModalFormData();
        form.title({ translate: `role.permission.edit`, with: [roleData.name] });
        for (const permission of rolePermissions) {
            form.toggle({ translate: `permission.${permission}` }, roleData.permissions.includes(permission));
        };
        form.submitButton({ translate: `mc.button.save` });
        form.show(player).then(rs => {
            if (rs.canceled) {
                selectRoleEditType(player, roleData);
                return;
            };
            const values = rs.formValues;
            let newRolePermissions = [];
            for (let i = 0; i < values.length; i++) {
                if (values[i]) {
                    newRolePermissions.push(rolePermissions[i]);
                };
            };
            roleData.permissions = newRolePermissions;
            StringifyAndSavePropertyData(`role_${roleData.id}`, roleData);
            selectRoleEditType(player, roleData);
            return;
        });
    };
};

/**
 * 完成
 * 国を作るフォームを表示
 * @param {Player} player 
 */
export function MakeCountryForm(player) {
    const form = new ModalFormData();
    form.title({ translate: `form.makecountry.title` });
    form.textField({ translate: `form.makecountry.name.label` }, { translate: `form.makecountry.name.input` });
    form.toggle({ translate: `form.makecountry.invite` }, true);
    form.toggle({ translate: `form.makecountry.peace` }, config.defaultPeace);
    form.submitButton({ translate: `form.makecountry.submit` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            if (rs.cancelationReason === FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    MakeCountryForm(player);
                    return;
                }, 10);
                return;
            };
            player.sendMessage({ translate: `form.cancel.message` });
            return;
        };
        if (rs.formValues) {
            MakeCountry(player, rs.formValues[0], rs.formValues[1], rs.formValues[2]);
            return;
        };
    });
};
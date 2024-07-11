import { Player, system, world } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import config from "../config";
import { acceptApplicationRequest, AddAlliance, AddHostilityByPlayer, CreateRoleToCountry, DeleteCountry, DeleteRole, denyAllianceRequest, denyApplicationRequest, MakeCountry, playerChangeOwner, playerCountryInvite, playerCountryJoin, playerCountryKick, RemoveAlliance, sendAllianceRequest, sendApplicationForPeace } from "./land";
import { CheckPermission, GetAndParsePropertyData, isDecimalNumber, StringifyAndSavePropertyData } from "./util";

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
    if (!CheckPermission(player, `kick`)) form.button({ translate: `form.memberselectedshow.button.kick` });
    if (!CheckPermission(player, `admin`)) form.button({ translate: `form.memberselectedshow.button.role` });
    if (!CheckPermission(player, `owner`)) form.button({ translate: `form.memberselectedshow.button.owner` });
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
                const playerData = GetAndParsePropertyData(`player_${player.id}`);
                const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
                if (member.id === countryData.owner) {
                    player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `form.kick.error.owner` }] });
                    return;
                };
                if (player.id != countryData.owner && !CheckPermission(world.getPlayers().find(p => p.id == member.id), `admin`)) {
                    player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `form.kick.error.admin` }] });
                };
                playerKickCheckForm(player, member, countryData);
                break;
            };
            case 2: {
                //ロール変更
                playerRoleChangeForm(player, member, countryData);
                break;
            };
            case 3: {
                //オーナー権限の譲渡
                if (player.id === member.id) {
                    player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]§r\n` }, { translate: `form.owner.error.same` }] });
                    return;
                };
                //確認フォーム → 譲渡(countryData.owner変更,ownerロールを外して新オーナーに追加)
                playerOwnerChangeCheckForm(player, member, countryData);
                break;
            };
        };
    });
};

/**
 * 所有権譲渡チェック
 * @param {Player} player 
 * @param {Player} member 
 */
export function playerOwnerChangeCheckForm(player, member, countryData) {
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const form = new ActionFormData();
    form.body({ translate: `ownerchange.check.body`, with: [member.name] });
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.ownerchange` });
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
                const newCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
                playerChangeOwner(player, member, newCountryData);
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
                    const roleData = GetAndParsePropertyData(`role_${EnableEditRoleIds[i]}`);
                    roleData.members.push(`${memberData.id}`);
                    StringifyAndSavePropertyData(`role_${EnableEditRoleIds[i]}`, roleData);
                } else {
                    const roleData = GetAndParsePropertyData(`role_${EnableEditRoleIds[i]}`);
                    roleData.members.splice(roleData.members.indexOf(memberData.id), 1);
                    StringifyAndSavePropertyData(`role_${EnableEditRoleIds[i]}`, roleData);
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
                const playerData = GetAndParsePropertyData(`player_${player.id}`);
                if (playerData?.country) {
                    player.sendMessage({ translate: `already.country.join` });
                    return;
                };
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
    let players = world.getPlayers().filter(p => p.id != player.id);
    form.title({ translate: `form.sendmoney.list.title` });
    form.button({ translate: `form.sendmoney.button.serch` });
    if (serch) {
        players = players.filter(p => p.name.includes(keyword));
    };
    for (const p of players) {
        if (p.id === player.id) continue;
        form.button(`${p.name}§r\n${p.id}`);
    };
    form.show(player).then(rs => {
        if (rs.canceled) {
            playerMainMenu(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                //検索form
                serchSendMoneyForm(player, keyword);
                break;
            };
            default: {
                sendMoneyCheckForm(player, players[rs.selection - 1]);
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
        const sendPlayerData2 = GetAndParsePropertyData(`player_${sendPlayer.id}`);
        const value = rs.formValues[0];
        receivePlayerData.money += value;
        sendPlayerData2.money -= value;
        sendPlayer.sendMessage({ translate: `command.sendmoney.result.sender`, with: [receivePlayer.name, `${config.MoneyName} ${value}`] });
        receivePlayer.sendMessage({ translate: `command.sendmoney.result.receiver`, with: [sendPlayer.name, `${config.MoneyName} ${value}`] });
        StringifyAndSavePropertyData(`player_${receivePlayer.id}`, receivePlayerData);
        StringifyAndSavePropertyData(`player_${sendPlayer.id}`, sendPlayerData2);
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
    if (CheckPermission(player, `invite`)) {
        player.sendMessage({ translate: `send.invite.error.permission.message` });
        return;
    };
    const form = new ActionFormData();
    let players = world.getPlayers().filter(p => !GetAndParsePropertyData(`player_${p.id}`)?.country);
    players.filter(p => p.id !== player.id);
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
            return;
        };
        switch (rs.selection) {
            case 0: {
                //検索form
                serchInviteForm(player, keyword);
                break;
            };
            default: {
                sendInviteCheckForm(player, players[rs.selection - 1]);
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
            if (rs.cancelationReason === FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    joinTypeSelectForm(player);
                }, 10);
                return;
            };
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
                allianceRequestCountryForm(player,receivedAllianceRequests[rs.selection - 1]);
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
export function allianceRequestCountryForm(player,countryId) {
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
                applicationRequestCountryForm(player,receivedApplicationRequests[rs.selection - 1]);
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
export function applicationRequestCountryForm(player,countryId) {
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
    for (const countryId of filtered2) {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
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
                addAllianceCountryFromListForm(player, filtered2[rs.selection - 1]);
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
        form.button({ translate: `mc.button.back` });
        form.button({ translate: `mc.button.add` });
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
                    HAllianceListForm(player);
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
    form.button({ translate: `mc.button.back` });
    for (const countryId of filtered2) {
        const countryData = GetAndParsePropertyData(`country_${countryId}`);
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
                addHostilityCountryFromListForm(player, allianceCountryIds[rs.selection - 1]);
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
        if(rs.formValues[0] == beforeValue) {
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
 * @param {object} countryData 
 */
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
    `openContainer`,
    `blockUse`,
    `entityUse`,
    `noTarget`,
    `buyChunk`,
    `sellChunk`,
    `taxAdmin`,
    `allyAdmin`,
    `hostilityAdmin`,
    `warAdmin`,
    `neutralityPermission`,
    `withDrawResourcepoint`,
    `withDrawTreasurybudget`
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
            form.button({ translate: `mc.button.addrole` });
            let roles = [];
            EnableEditRoleIds.forEach(id => {
                roles.push(GetAndParsePropertyData(`role_${id}`));
            });
            roles.forEach(role => {
                form.button(role.name, role.icon);
            });
            form.show(player).then(rs => {
                const newCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
                if (rs.canceled) {
                    settingCountry(player);
                    return;
                };
                switch(rs.selection) {
                    case 0: {
                        if(config.maxRoleAmount < newCountryData.roles.length) {
                            player.sendMessage({translate: `error.limit.maxrole`});
                            return;
                        };
                        CreateRoleToCountry(newCountryData.id,`newRole`);
                        system.runTimeout(() => {
                            settingCountryRoleForm(player);
                            return;
                        },2);
                        break;
                    };
                    default: {
                        selectRoleEditType(player, roles[rs.selection - 1]);
                        break;
                    };
                };
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
    if (!CheckPermission(player, `admin`)) {
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
    if (!CheckPermission(player, `admin`)) {
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
    if (!CheckPermission(player, `admin`)) {
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
    if (!CheckPermission(player, `admin`)) {
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
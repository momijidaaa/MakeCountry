import { Player, system, world } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import config from "../config";
import { DeleteCountry, DeleteRole, MakeCountry } from "./land";
import { GetAndParsePropertyData, HasPermission, StringifyAndSavePropertyData } from "./util";

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
                settingCountryRoleForm(player);
                break;
            };
            case 2: {
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

        form.show(player).then(rs => {
            if (rs.canceled) return;
            switch (rs.selection) {
                case 0: {
                    if (HasPermission(player, `editCountryName`)) {
                        editCountryNameForm();
                    } else {
                        player.sendMessage({ translate: `no.permission` });
                    };
                    break;
                };
                case 1: {
                    if (HasPermission(player, `editCountryLore`)) {
                        editCountryNameForm();
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
        world.sendMessage({rawtext: [{text: `§a[MakeCountry]§r\n`},{translate: `changed.countryname`},{text: `\n§r${beforeName} →§r ${value}`}]});
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        settingCountryInfoForm(player, countryData);
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
        player.sendMessage({rawtext: [{text: `§a[MakeCountry]§r\n`},{translate: `changed.countrylore`},{text: `\n§r${beforeLore} →§r ${value}`}]});
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        settingCountryInfoForm(player, countryData);
        return;
    });
};

const rolePermissions = [
    `editCountryName`,
    `editCountryLore`,
    `place`,
    `break`,
    `setHome`,
    `blockUse`,
    `entityUse`,
    `noTarget`,
    `buyChunk`,
    `sellChunk`,
    `peaceChange`,
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
        const form = new ActionFormData();
        form.title({ translate: `form.setting.button.role` });
        const playerData = GetAndParsePropertyData(`player_${player.id}`)
        const roleIds = GetAndParsePropertyData(`country_${playerData.country}`).roles;
        let roles = [];
        roleIds.forEach(id => {
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
        });
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
        };
    });
};
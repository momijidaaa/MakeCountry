import { Player, system } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import config from "../config";
import { DeleteRole, MakeCountry } from "./land";
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

    form.show(player).then(rs => {
        if (rs.canceled) return;
        switch (rs.selection) {
            case 0: {
                break;
            };
            case 1: {
                break;
            };
        };
    });
};

/**
 * 完成
 * 国の情報表示
 * @param {Player} player 
 */
export function settingCountryInfo(player) {
    const form = new ActionFormData();
    form.title({ translate: `form.setting.info.title` });
    form.body({ translate: `form.setting.info.body` });
    form.button({ translate: `form.setting.info.button.name` });

    form.show(player).then(rs => {
        if (rs.canceled) return;
        switch (rs.selection) {
            case 0: {
                HasPermission()
                break;
            };
        };
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

export function settingCountryRoleForm(player) {
    try {
        const form = new ActionFormData();
        form.title({translate: `form.setting.button.role`});
        const playerData = GetAndParsePropertyData(player)
        const roleIds = GetAndParsePropertyData(`country_${playerData.country}`).roles;
        let roles = [];
        roleIds.forEach(id => {
            roles.push(GetAndParsePropertyData(`role_${id}`));
        });
        roles.forEach(role => {
            form.button(role.name,role.icon);
        });
        form.show(player).then(rs => {
            if(rs.canceled) {
                settingCountry(player);
                return;
            };
            selectRoleEditType(player,roles[rs.selection]);
        });
    } catch (error) {
        console.warn(error);
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
        form.textField({translate: `form.role.namechange.label`},{translate: `form.role.namechange.input`},roleData.name);
        form.submitButton({translate: `mc.button.change`});
        form.show(player).then(rs => {
            if(rs.canceled) {
                selectRoleEditType(player,roleData.id);
                return;
            };
            roleData.name = rs.formValues[0] ?? `None`;
            StringifyAndSavePropertyData(`role_${roleData.id}`,roleData);
            return;
        });
    };
};

/**
 * 完成(?)
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
        //form.button({translate: `form.role.edit.select.button.members`});
        form.button({ translate: `form.role.edit.select.button.permission` });
        form.button({ translate: `form.role.edit.select.button.delete` });
        form.show(player).then(rs => {
            if (rs.canceled) return;
            switch (rs.selection) {
                case 0: {
                    //名前の変更
                    break;
                };
                case 1: {
                    //権限の編集
                    setRolePermissionForm(player, roleData);
                    break;
                };
                case 2: {
                    //ロールの削除
                    DeleteRole(player, roleData.id, playerData.country);
                    break;
                }
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
            if (rs.canceled) return;
            const values = rs.formValues;
            let newRolePermissions = [];
            for (let i = 0; i < values.length; i++) {
                if (values[i]) {
                    newRolePermissions.push(rolePermissions[i]);
                };
            };
            roleData.permissions = newRolePermissions;
            StringifyAndSavePropertyData(`role_${roleData.id}`, roleData);
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
            };
            player.sendMessage({ translate: `form.cancel.message` });
            return;
        };
        if (rs.formValues) {
            MakeCountry(player, rs.formValues[0], rs.formValues[1], rs.formValues[2]);
        };
    });
};
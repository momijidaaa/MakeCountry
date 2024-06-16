import { Player, system } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import config from "../config";
import { MakeCountry } from "./land";
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

    form.show(player).then(rs => {
        if (rs.canceled) return;
        switch (rs.selection) {
            case 0: {
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

/**
 * 完成
 * ロールの権限編集
 * @param {Player} player 
 * @param {string} roleId 
 */
export function setRolePermissionForm(player, roleId) {
    if (HasPermission(player, `admin`)) {
        const roleData = GetAndParsePropertyData(`role_${roleId}`);
        const form = new ModalFormData();
        form.title({translate: `role.permission.edit`,with: [roleData.name]});
        for (const permission of rolePermissions) {
            form.toggle({ translate: `permission.${permission}` }, roleData.permissions.includes(permission));
        };
        form.submitButton({translate: `mc.button.save`});
        form.show(player).then(rs => {
            if(rs.canceled) return;
            const values = rs.formValues;
            let newRolePermissions = [];
            for(let i = 0;i < values.length;i++) {
                if(values[i]) {
                    newRolePermissions.push(rolePermissions[i]);
                };
            };
            roleData.permissions = newRolePermissions;
            StringifyAndSavePropertyData(`role_${roleId}`,roleData);
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
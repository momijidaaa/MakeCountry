import { world, system, Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import * as DyProp from "./DyProp";
import { hasPermission } from "./role";

//設定項目の連想配列
const settings = [
    {
        id: `moneyScoreName`,
        display: `金と同期するスコア名`, 
        type: `string`,
        default: `mc_money`
    },
    {
        id: `defaultMoney`,
        display: `初期の所持金`, 
        type: `number`,
        default: 0
    },
    {
        id: `needMoneyForMakeCountry`,
        display: `建国にかかる費用`, 
        type: `number`,
        default: 10000
    }
];

const countryMenuButtons = [
    {
        display: `金と同期するスコア名`, 
        nextExecute: `hasPermission()`,
        icon: `apple`
    },
];


/**
 * 国のメニューフォーム
 * @param {Player} player
 * @returns {void} 
 */
export function CountryMenuForm(player) {
    const form = new ActionFormData()
    .title(`Country Menu`)
    .body(`何をしますか？`);
    for(let i = 0;i < settings.length;i++) {
        form.button(settings[i].display);
    };
    form.show(player).then(rs => {
        if(rs.canceled) return;
        modalFormGenerator(player,settings[rs.selection]);
    });
};

/**
 * ワールド設定フォーム
 * @param {Player} player
 * @returns {void} 
 */
export function WorldSettingForm(player) {
    if(!player.hasTag(`mc_op`)) return;
    const form = new ActionFormData()
    .title(`Setting Form`)
    .body(`設定項目を選択`);
    for(let i = 0;i < settings.length;i++) {
        form.button(settings[i].display);
    };
    form.show(player).then(rs => {
        if(rs.canceled) return;
        modalFormGenerator(player,settings[rs.selection]);
    });
};

/**
 * 
 * @param {Player} player 
 * @param {{id: string, display: string, type: `slider`|`string`|`number`|`toggle`,max?: number,min?: number,interval?: number,default: number|string|boolean }} obj 
 * @param {undefined|string} [permission] 
 */
export function modalFormGenerator(player,obj,permission = undefined) {
    if(permission) {
        if(!hasPermission(world.getDynamicProperty(`player_${player.id}`),permission)) {
            player.sendMessage(`§cあなたにはその権限がありません`)
            return;
        }; 
    };
    /**
     * @type {string|undefined}
     */
    let rawDefault = world.getDynamicProperty(obj.id);
    const form = new ModalFormData()
    .title(obj.display);
    switch(obj.type) {
        case "string": {
            form.textField(`${obj.display}を入力`,`入力してください`,rawDefault || obj.default);
            break;
        };
        case "number": {
            if(!rawDefault) form.textField(`${obj.display}を入力`,`数字を入力してください`,`${obj.default}`);
            if(rawDefault) form.textField(`${obj.display}を入力`,`数字を入力してください`,rawDefault);
            break;
        };
        case "slider": {
            if(!rawDefault) form.slider(obj.display,obj.min,obj.max,obj.interval,obj.default);
            if(rawDefault) form.slider(obj.display,obj.min,obj.max,obj.interval,Number(rawDefault));
            break;
        };
        case "toggle": {
            if(!rawDefault) {
                form.toggle(obj.display,obj.default);
                break;
            };
            if(rawDefault === "true") form.toggle(obj.display,true);
            break;
        };
    };
    form.show(player).then(rs => {
        if(rs.canceled) return;
        if(obj.type === "number" && isFinite(rs.formValues[0])) {
            player.sendMessage(`§c数値を入力してください`)
            return;
        };
        world.setDynamicProperty(obj.id,`${rs.formValues[0]}`);
    });
};

/**
 * 
 * @param {Player} player 
 * @param {[{display: string,nextExecute: string,icon?: string}]} buttons 
 * @param {undefined|string} [permission] 
 * @param {string} [bodyText] 
 */
export function actionFormGenerator(player,buttons,permission = undefined,bodyText = "") {
    if(permission) {
        if(!hasPermission(world.getDynamicProperty(`player_${player.id}`),permission)) {
            player.sendMessage(`§cあなたにはその権限がありません`)
            return;
        }; 
    };
    const form = new ActionFormData()
    .title(obj.display)
    .body(bodyText);
    for(let i = 0;i < buttons.length;i++) {
        form.button(buttons[i].display,buttons[i].icon);
    };
    form.show(player).then(rs => {
        if(typeof rs.selection === "undefined") return;
        eval(buttons[rs.selection].nextExecute);
    });
};
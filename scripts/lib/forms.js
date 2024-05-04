import { world, system, Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import * as DyProp from "./DyProp";

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
        type: `slider`,
        max: 10000,
        min: 0,
        interval: 1,
        default: 0
    }
];

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
 */
export function modalFormGenerator(player,obj) {
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
            if(!rawDefault) form.textField(`${obj.display}を入力`,`数字を入力してください`,obj.default);
            if(rawDefault) form.textField(`${obj.display}を入力`,`数字を入力してください`,Number(rawDefault));
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
        world.setDynamicProperty(obj.id,`${rs.formValues[0]}`);
    });
};
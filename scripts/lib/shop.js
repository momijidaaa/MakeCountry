import { ItemStack, Player, system, world } from "@minecraft/server";
import { ChestFormData } from "./chest-ui";
import { GetAndParsePropertyData, isDecimalNumber, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import config from "../config";
import { itemIdToPath } from "../texture_config";
import shop_config from "../shop_config";


/**
 * 
 * @param {Player} player 
 */
export function ShopCommonsMenu(player, page = 0, keyword = ``, type = 0) {
    const form = new ChestFormData("large").setTitle(`Admin Shop`);
    /**
     * @type {Array<{id: string,price: number}>}
     */
    const allCommons = shop_config;
    if (allCommons.length < page * 36 + 1) {
        ShopCommonsMenu(player, page - 1);
        return;
    };
    if (keyword != ``) {
        switch (type) {
            //アイテムのIDで絞り込み
            case 0: {
                allCommons.filter(com => com.item.typeId.includes(keyword));
                break;
            };
        };
    };
    const commonsAll = allCommons;
    const commons = allCommons.slice(0 + (45 * page), 45 + (45 * page));
    for (let i = 0; i < commons.length; i++) {
        const common = commons[i];
        form.setButton(i + 9, { name: common.id, iconPath: itemIdToPath[common.id] ?? common.id, lore: [`${config.MoneyName}${common.price}`] });
    };
    form.setButton(0, { name: "§l§4Close", iconPath: "minecraft:barrier", lore: ["Push here"] });
    if ((page + 1) * 45 < commonsAll.length) form.setButton(5, { name: ">>", iconPath: "textures/ui/arrow_right", lore: ["Next Page"] });
    if (0 < page) form.setButton(3, { name: "<<", iconPath: "textures/ui/arrow_left", lore: ["Previous Page"] });

    form.show(player).then(rs => {
        if (rs.canceled) {
            return;
        };
        switch (rs.selection) {
            case 0: {
                //閉じる
                break;
            };
            case 5: {
                //進む
                ShopCommonsMenu(player, page + 1);
                break;
            };
            case 3: {
                //戻る
                ShopCommonsMenu(player, page - 1);
                break;
            };
            default: {
                system.run(() => {
                    ShopSelectCommonForm(player, commons[rs.selection - 9]);
                    return;
                });
                break;
            };
        };
    });
};

/**
 * 
 * @param {Player} player 
 * @param {{id: string,price: number}} common 
 */
export function ShopSelectCommonForm(player, common) {
    const form = new ModalFormData();
    form.title({ translate: `mc.button.buy` });
    form.toggle({ translate: `stack.buy` });
    form.slider({ translate: `buy.amount` }, 1, 64, 1);
    form.submitButton({ translate: `mc.button.buy` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            ShopCommonsMenu(player);
            return;
        };
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        let price = common.price * rs.formValues[1];
        if (rs.formValues[0]) {
            price = price * 64
        };
        if (playerData.money < price) {
            player.sendMessage({ translate: `error.notenough.money` });
            return;
        };
        const container = player.getComponent(`inventory`).container;
        if (Math.ceil((price / common.price) / 64) < container.emptySlotsCount) {
            player.sendMessage({ translate: `no.available.slots` });
            return;
        };
        for (let i = (price / common.price); 0 < i; i -= 64) { 
            if(i < 64) {
                container.addItem(new ItemStack(common.id,i));
                break;
            };
            container.addItem(new ItemStack(common.id,64));
        };
        playerData.money -= price;
        player.sendMessage({translate: `finish.bought`});
        StringifyAndSavePropertyData(`player_${player.id}`,playerData);
        return;
    });
};
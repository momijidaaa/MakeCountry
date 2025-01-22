import { ItemStack, Player, system, world } from "@minecraft/server";
import { ChestFormData } from "./chest-ui";
import { GetAndParsePropertyData, isDecimalNumber, langChangeItemName, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import config from "../config";
import { itemIdToPath } from "../texture_config";

world.afterEvents.worldInitialize.subscribe(() => {
    if (!DyProp.getDynamicProperty(`player_market_commons`)) DyProp.setDynamicProperty(`player_market_commons`, `[]`);
});

/**
 * 
 * @param {Player} player 
 */
export function PlayerMarketMainMenu(player) {
    const form = new ActionFormData();
    form.title(`Player Market`);
    form.button({ translate: `view.products` });
    form.button({ translate: `sell.products` });
    form.button({ translate: `withdrawal.goods` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            if (rs.cancelationReason == FormCancelationReason.UserBusy) {
                PlayerMarketMainMenu(player);
            };
            //閉じる
            return;
        };
        switch (rs.selection) {
            case 0: {
                //商品一覧を見る
                PlayerMarketCommonsMenu(player);
                break;
            };
            case 1: {
                //出品する
                PlayerMarketExhibitMainMenu(player);
                break;
            };
            case 2: {
                //出品を取り下げる
                PlayerMarketWithdrawalGoodsMainMenu(player);
                break;
            };
        };
    });
};

/**
 * 出品したアイテム一覧
 * @param {Player} player 
 */
export function PlayerMarketWithdrawalGoodsMainMenu(player) {
    const form = new ActionFormData();
    form.title(`Player Market`)
    form.button({ translate: `mc.button.close` });
    /**
     * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
     */
    const allCommons = GetAndParsePropertyData(`player_market_commons`).filter(com => com.playerId == player.id);
    for (let i = 0; i < allCommons.length; i++) {
        const item = allCommons[i];
        form.button(`${item.item.typeId} x${item.item.amount}\n${item.price}`);
    };
    form.show(player).then(rs => {
        if (rs.canceled) {
            PlayerMarketMainMenu(player);
        };
        switch (rs.selection) {
            case 0: {
                //閉じる
                break;
            };
            default: {
                /**
                 * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
                 */
                const newAllCommons = GetAndParsePropertyData(`player_market_commons`)
                const result = newAllCommons.find(com => com.id == allCommons[rs.selection - 1].id);
                if (!newAllCommons) {
                    PlayerMarketWithdrawalGoodsMainMenu(player);
                    break;
                };
                PlayerMarketWithdrawalGoodsSelectMenu(player, result);
                break;
            };
        };
    });
};

/**
 * 出品アイテムの取り下げ
 * @param {Player} player 
 * @param {{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}} common
 */
export function PlayerMarketWithdrawalGoodsSelectMenu(player, common) {
    const form = new ActionFormData();
    form.title(`Player Market`);
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.withdrawal.goods` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            //閉じる
            return;
        };
        switch (rs.selection) {
            case 0: {
                PlayerMarketWithdrawalGoodsMainMenu(player);
                break;
            };
            case 1: {
                //商品のチェック
                /**
                 * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
                 */
                const newAllCommons = GetAndParsePropertyData(`player_market_commons`);
                if (!newAllCommons.find(com => com.id == common.id)) {
                    player.sendMessage({ translate: `playermarket.error.already.buy` })
                    return;
                };
                StringifyAndSavePropertyData(`player_market_commons`, newAllCommons.filter(com => com.id != common.id));
                player.sendMessage({ translate: `finish.goods.withdrawal.message` })
                const item = new ItemStack(common.item.typeId, common.item.amount);
                item.nameTag = common.item?.name;
                const container = player.getComponent(`inventory`).container;
                if (container.emptySlotsCount < 1) {
                    player.dimension.spawnItem(item, player.location);
                    break;
                };
                container.addItem(item);
                break;
            };
        };
    });
};

/**
 * 出品アイテムの選択
 * @param {Player} player 
 */
export function PlayerMarketExhibitMainMenu(player) {
    /**
 * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
 */
    const allCommons = GetAndParsePropertyData(`player_market_commons`).filter(com => com.playerId == player.id);

    if (config.maxMarketAmount <= allCommons.filter(common => common.playerId == player.id).length) {
        player.sendMessage({ translate: `error.maxmarketamount`, with: [`${config.maxMarketAmount}`] });
        return;
    };
    let items = [];
    const container = player.getComponent(`inventory`).container;
    const form = new ActionFormData();
    form.button({ translate: `mc.button.back` });
    for (let i = 0; i < container.size; i++) {
        const item = container.getItem(i);
        if (!item) continue;
        if (item.getComponent(`enchantable`) || item.getComponent(`durability`) || item.typeId.includes(`shulker_box`) || item.typeId.includes(`potion`)) continue;
        items.push({ slot: i, itemStack: item });
        form.button(`${item.typeId}\n${item.amount}`);
    };
    form.show(player).then(rs => {
        if (rs.canceled) {
            PlayerMarketMainMenu(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                PlayerMarketMainMenu(player);
                return;
            };
            default: {
                const playerData = GetAndParsePropertyData(`player_${player.id}`);
                if (playerData.money < config.playerMarketCommission) {
                    player.sendMessage({ translate: `error.notenough.money` });
                    return;
                };
                playerData.money = playerData.money - config.playerMarketCommission;
                StringifyAndSavePropertyData(`player_${player.id}`, playerData);
                const newContainer = player.getComponent(`inventory`).container;
                const item = newContainer.getItem(items[rs.selection - 1].slot);
                if (item == items[rs.selection - 1].itemStack) {
                    PlayerMarketExhibitMainMenu(player);
                    return;
                };
                PlayerMarketExhibitSelectItemMenu(player, items[rs.selection - 1]);
                return;
            };
        };
    });
};

/**
 * 出品
 * @param {{ slot: number, itemStack: ItemStack }} itemData 
 * @param {Player} player 
 */
export function PlayerMarketExhibitSelectItemMenu(player, itemData) {
    const form = new ModalFormData();
    form.title(`Player Market`);
    form.slider(``, 1, itemData.itemStack.amount, 1);
    form.textField({ translate: `input.price` }, { translate: `price.label` });
    form.toggle({ translate: `form.button.notify` });
    form.show(player).then(rs => {
        const newContainer = player.getComponent(`inventory`).container;
        const item = newContainer.getItem(itemData.slot);
        if (item == itemData.itemStack) {
            PlayerMarketExhibitMainMenu(player);
            return;
        };
        const priceValue = Number(rs.formValues[1])
        if (!isDecimalNumber(priceValue) || rs.formValues[1] === ``) {
            player.sendMessage({ translate: `input.error.notnumber` });
            return;
        };
        if (priceValue < 1) {
            player.sendMessage({ translate: `command.error.canuse.number.more`, with: [`1`] });
            return;
        };

        if (rs.formValues[2]) {
            world.sendMessage({ rawtext: [{ text: `§a[PlayerMarket]\n` }, { translate: `exhibited.message`, with: { rawtext: [{ translate: `${langChangeItemName(itemData.itemStack.typeId)}` }] } }] });
        };
        let id = world.getDynamicProperty(`playermarketId`) ?? "0";
        world.setDynamicProperty(`playermarketId`, `${Number(id) + 1}`);
        /**
         * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
         */
        const itemAmount = rs.formValues[0];
        const allCommons = GetAndParsePropertyData(`player_market_commons`);
        const data = {
            id: Number(id) + 1,
            playerName: player.name,
            playerId: player.id,
            price: priceValue,
            item: {
                name: itemData.itemStack?.nameTag,
                typeId: itemData.itemStack.typeId,
                amount: itemAmount
            }
        };
        const editItem = itemData.itemStack;
        if (editItem.amount - itemAmount == 0) {
            newContainer.setItem(itemData.slot);
        } else {
            editItem.amount -= itemAmount;
            newContainer.setItem(itemData.slot, editItem);
        };
        allCommons.unshift(data);
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        playerData.marketAmount += 1;
        player.sendMessage({ rawtext: [{ text: `§a[PlayerMarket]\n` }, { translate: `success.exhibited.message`, with: { rawtext: [{ translate: `${langChangeItemName(itemData.itemStack.typeId)}` }] } }] });
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        StringifyAndSavePropertyData(`player_market_commons`, allCommons);
        return;
    });
};

/**
 * 
 * @param {Player} player 
 */
export function PlayerMarketCommonsMenu(player, page = 0, keyword = ``, type = 0) {
    const form = new ChestFormData("large").setTitle(`Player Market`);
    /**
     * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
     */
    const allCommons = GetAndParsePropertyData(`player_market_commons`);
    if (allCommons.length < page * 36 + 1) {
        PlayerMarketCommonsMenu(player, page - 1);
        return;
    };
    if (keyword != ``) {
        switch (type) {
            //アイテムのIDで絞り込み
            case 0: {
                allCommons.filter(com => com.item.typeId.includes(keyword));
                break;
            };
            //アイテムの名前で絞り込み
            case 1: {
                allCommons.filter(com => com.item?.name?.includes(keyword));
                break;
            };
            //出品者の名前で絞り込み
            case 2: {
                allCommons.filter(com => com.playerName.includes(keyword));
                break;
            };
        };
    };
    const commonsAll = allCommons;
    const commons = allCommons.slice(0 + (45 * page), 45 + (45 * page));
    for (let i = 0; i < commons.length; i++) {
        const common = commons[i];
        form.setButton(i + 9, { name: common.item.name || common.item.typeId, iconPath: itemIdToPath[common.item.typeId] ?? common.item.typeId, lore: [`${config.MoneyName}${common.price}`, `${common.playerName}`], stackAmount: common.item.amount, editedName: common.item.name ? true : false })
    };
    form.setButton(0, { name: "§l§4Close", iconPath: "minecraft:barrier", lore: ["Push here"], editedName: true });
    if ((page + 1) * 45 < commonsAll.length) form.setButton(5, { name: ">>", iconPath: "textures/ui/arrow_right", lore: ["Next Page"] });
    if (0 < page) form.setButton(3, { name: "<<", iconPath: "textures/ui/arrow_left", lore: ["Previous Page"], editedName: true });

    form.show(player).then(rs => {
        if (rs.canceled) {
            PlayerMarketMainMenu(player);
            return;
        };
        switch (rs.selection) {
            case 0: {
                //閉じる
                break;
            };
            case 5: {
                //進む
                PlayerMarketCommonsMenu(player, page + 1);
                break;
            };
            case 3: {
                //戻る
                PlayerMarketCommonsMenu(player, page - 1);
                break;
            };
            default: {
                //商品のチェック
                /**
                 * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
                 */
                const newAllCommons = GetAndParsePropertyData(`player_market_commons`);
                if (!newAllCommons.find(com => com.id == commons[rs.selection - 9].id)) {
                    PlayerMarketCommonsMenu(player, page);
                    break;
                };
                system.run(() => {
                    PlayerMarketSelectCommonForm(player, commons[rs.selection - 9]);
                    return;
                });
                break;
            };
        };
    });
};

/**
 * @param {Player} player 
 * @param {{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}} common
 */
export function PlayerMarketSelectCommonForm(player, common) {
    if (player.id == common.playerId) {
        player.sendMessage({ translate: `playermarket.error.sameplayer` });
        return;
    };
    const form = new ActionFormData();
    form.title(`Player Market`);
    form.button({ translate: `mc.button.back` });
    form.button({ translate: `mc.button.buy` });
    form.show(player).then(rs => {
        if (rs.canceled) {
            //閉じる
            return;
        };
        switch (rs.selection) {
            case 0: {
                PlayerMarketCommonsMenu(player);
                break;
            };
            case 1: {
                //商品のチェック
                /**
                 * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
                 */
                const newAllCommons = GetAndParsePropertyData(`player_market_commons`);
                if (!newAllCommons.find(com => com.id == common.id)) {
                    player.sendMessage({ translate: `playermarket.error.already.buy` })
                    return;
                };
                const playerData = GetAndParsePropertyData(`player_${player.id}`);
                if (playerData.money < common.price) {
                    player.sendMessage({ translate: `error.notenough.money` });
                    return;
                };
                const exhibitorData = GetAndParsePropertyData(`player_${common.playerId}`);
                exhibitorData.money += common.price;
                exhibitorData.marketAmount -= 1;
                playerData.money -= common.price;
                StringifyAndSavePropertyData(`player_market_commons`, newAllCommons.filter(com => com.id != common.id));
                StringifyAndSavePropertyData(`player_${player.id}`, playerData);
                StringifyAndSavePropertyData(`player_${common.playerId}`, exhibitorData);
                player.sendMessage({ translate: `finish.bought` });
                const item = new ItemStack(common.item.typeId, common.item.amount);
                item.nameTag = common.item?.name;
                const container = player.getComponent(`inventory`).container;
                if (container.emptySlotsCount < 1) {
                    player.dimension.spawnItem(item, player.location);
                    break;
                };
                container.addItem(item);
                break;
            };
        };
    });
};
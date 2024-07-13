import { ItemStack, Player, world } from "@minecraft/server";
import { ChestFormData } from "./chest-ui";
import { GetAndParsePropertyData, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import { ActionFormData } from "@minecraft/server-ui";
import config from "../config";

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
            //閉じる
            return;
        };
        switch (rs.selection) {
            case 0: {
                //商品一覧を見る
                PlayerMarketCommonsMenu(player)
                break;
            };
            case 1: {
                //出品する
                PlayerMarketExhibitMainMenu(player)
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
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    if (config.maxMarketAmount <= playerData.marketAmount) {
        player.sendMessage({ translate: `error.maxmarketamount`, with: [`${config.maxMarketAmount}`] });
    };
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
    const commons = allCommons.slice(0 + (36 * page), 35 + (36 * page));
    for (let i = 0; i < commons.length; i++) {
        const common = commons[i];
        form.setButton(i + 9, { name: common.item.name || common.item.typeId, iconPath: common.item.typeId, lore: [`$${common.price}`, `${common.playerName}`], stackAmount: common.item.amount })
    };
    form.setButton(0, { name: "§l§4Close", iconPath: "minecraft:barrier", lore: ["Push here"] });
    if (page + 1 * 36 < allCommons.length) form.setButton(41, { name: ">>", iconPath: "minecraft:barrier", lore: ["Next Page"] });
    if (0 < page) form.setButton(39, { name: "<<", iconPath: "minecraft:barrier", lore: ["Previous Page"] });

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
            case 41: {
                //進む
                PlayerMarketCommonsMenu(player, page + 1);
                break;
            };
            case 39: {
                //戻る
                PlayerMarketCommonsMenu(player, page - 1);
                break;
            };
            default: {
                //商品のチェック
                /**
                 * @type {Array<{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}>}
                 */
                const newAllCommons = GetAndParsePropertyData(`player_market_commons`).slice(0 + (36 * page), 35 + (36 * page));
                if (!newAllCommons.find(com => com.id == commons[rs.selection - 9].id)) {
                    PlayerMarketCommonsMenu(player, page);
                    return;
                };
                PlayerMarketSelectCommonForm(player, commons[rs.selection - 9]);
                return;
            };
        };
    });
};

/**
 * @param {Player} player 
 * @param {{id: number,playerName: string,playerId: string,price: number, item: {name: undefined|string,typeId: string,amount: number}}} common
 */
export function PlayerMarketSelectCommonForm(player, common) {
    const form = new ActionFormData();
    form.title(`${common.id}`);
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
                player.sendMessage({ translate: `finish.bought` })
                const item = new ItemStack(common.item.typeId, common.item.amount);
                item.nameTag = common.item.name;
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
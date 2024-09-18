import { system } from "@minecraft/server";
import { sendData } from "./api";
import { GetAndParsePropertyData, StringifyAndSavePropertyData } from "../lib/util";

system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const { id, sourceEntity, message } = ev;

    switch (id) {
        case `mcapi:moneyadd`: {
            const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
            if (playerData === undefined) return;
            const newMoney = parseInt(message);
            if (isNaN(newMoney)) return;
            if ((playerData.money + newMoney) < 0) return;

            playerData.money += newMoney;
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mcapi:moneyremove`: {
            const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
            if (playerData === undefined) return;
            const newMoney = parseInt(message);
            if (isNaN(newMoney)) return;
            if ((playerData.money - newMoney) < 0) return;

            playerData.money -= newMoney;
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mcapi:moneyset`: {
            const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
            if (playerData === undefined) return;
            const newMoney = parseInt(message);
            if (isNaN(newMoney)) return;
            if (newMoney < 0) return;

            playerData.money = newMoney;
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mcapi:moneyget`: {
            const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
            if (playerData === undefined) return;
            playerData.money;
            sendData(`mcapi:moneygetresult`, `result`, playerData.money, message);
            break;
        };
    };
});
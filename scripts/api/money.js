import { system } from "@minecraft/server";
import * as DyProp from "../lib/DyProp";
import { sendData } from "./api";
import { playerCountryJoin, playerCountryLeave } from "../lib/land";
import { GetAndParsePropertyData, StringifyAndSavePropertyData } from "../lib/util";

system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const { id, sourceEntity, message } = ev;
    switch (id) {
        case `mcapi:moneyadd`: {
            const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
            playerData.money += Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mcapi:moneyremove`: {
            const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
            playerData.money += Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mcapi:moneyset`: {
            const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
            playerData.money += Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mcapi:moneyget`: {
            const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
            playerData.money;
            sendData(`mcapi:moneygetresult`, `result`, playerData.money, message);
            break;
        };
    };
});
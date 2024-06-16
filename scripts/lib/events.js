import { world } from "@minecraft/server";
import { CheckPermission, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import config from "../config";

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const permission = `break`
    const { player } = ev;
    const cannot = CheckPermission(player,permission);
    ev.cancel = cannot;
    if(!cannot) return;
    player.sendMessage({translate: `cannot.permission.${permission}`});
    return;
});

world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const permission = `place`
    const { player } = ev;
    const cannot = CheckPermission(player,permission);
    ev.cancel = cannot;
    if(!cannot) return;
    player.sendMessage({translate: `cannot.permission.${permission}`});
    return;
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    const permission = `blockUse`
    const { player } = ev;
    const cannot = CheckPermission(player,permission);
    ev.cancel = cannot;
    if(!cannot) return;
    player.sendMessage({translate: `cannot.permission.${permission}`});
    return;
});

world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const permission = `entityUse`
    const { player } = ev;
    const cannot = CheckPermission(player,permission);
    ev.cancel = cannot;
    if(!cannot) return;
    player.sendMessage({translate: `cannot.permission.${permission}`});
    return;
});

world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player , initialSpawn } = ev;
    if(initialSpawn) {
        const dataCheck = DyProp.getDynamicProperty(`player_${player.id}`);
        if(dataCheck) {
            const playerData = JSON.parse(dataCheck);
            playerData.name = player.name;
            StringifyAndSavePropertyData(`player_${player.id}`,playerData);
            return;
        };
        const newPlayerData = {
            name: player.name,
            id: player.id,
            country: undefined,
            money: config.initialMoney,
            roles: [],
            chunks: [],
            days: 0,
            invite: []
        };
        StringifyAndSavePropertyData(`player_${player.id}`,newPlayerData);
    };
});
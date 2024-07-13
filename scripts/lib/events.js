import { world } from "@minecraft/server";
import { CheckPermissionFromLocation, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import config from "../config";

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const permission = `break`
    const { player, block } = ev;
    const { x, z } = block.location;
    const cannot = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission);
    ev.cancel = cannot;
    if (!cannot) return;
    player.sendMessage({ translate: `cannot.permission.${permission}` });
    return;
});

world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const permission = `place`
    const { player, block } = ev;
    const { x, z } = block.location;
    const cannot = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission);
    ev.cancel = cannot;
    if (!cannot) return;
    player.sendMessage({ translate: `cannot.permission.${permission}` });
    return;
});

world.beforeEvents.itemUseOn.subscribe((ev) => {
    const permission = `place`
    const { source: player, block } = ev;
    const { x, z } = block.location;
    const cannot = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission);
    ev.cancel = cannot;
    if (!cannot) return;
    player.sendMessage({ translate: `cannot.permission.${permission}` });
    return;
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    const permission2 = `openContainer`
    const permission = `blockUse`
    const { player, block } = ev;
    const { x, z } = block.location;
    if (block.getComponent(`inventory`)) {
        const cannot2 = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission2);
        ev.cancel = cannot2;
        player.sendMessage({ translate: `cannot.permission.${permission2}` });
        return;
    };
    const cannot = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission);
    ev.cancel = cannot;
    if (!cannot) return;
    player.sendMessage({ translate: `cannot.permission.${permission}` });
    return;
});

world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const permission = `entityUse`
    const { player, target } = ev;
    const { x, z } = target.location;
    const cannot = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission);
    ev.cancel = cannot;
    if (!cannot) return;
    player.sendMessage({ translate: `cannot.permission.${permission}` });
    return;
});

world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player, initialSpawn } = ev;
    if (initialSpawn) {
        const dataCheck = DyProp.getDynamicProperty(`player_${player.id}`);
        if (dataCheck) {
            const playerData = JSON.parse(dataCheck);
            playerData.name = player.name;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
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
            invite: [],
            settings: {
                inviteReceiveMessage: true,
            }
        };
        StringifyAndSavePropertyData(`player_${player.id}`, newPlayerData);
    };
});

try {
    const players = world.getAllPlayers();
    for (const player of players) {
        const dataCheck = DyProp.getDynamicProperty(`player_${player.id}`);
        if (dataCheck) {
            const playerData = JSON.parse(dataCheck);
            playerData.name = player.name;
            if(!playerData?.marketAmount) playerData.marketAmount = 0; 
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        } else {
            let moneyValue = config.initialMoney;
            if(config.getMoneyByScoreboard) {
                const scoreboard = world.scoreboard.getObjective(config.moneyScoreboardName) || world.scoreboard.addObjective(config.moneyScoreboardName);
                const scoreValue = scoreboard.getScore(player);
                if(scoreValue) moneyValue = scoreValue;
            };
            const newPlayerData = {
                name: player.name,
                id: player.id,
                country: undefined,
                money: moneyValue,
                roles: [],
                chunks: [],
                days: 0,
                marketAmount: 0,
                invite: [],
                settings: {
                    inviteReceiveMessage: true,
                }
            };
            StringifyAndSavePropertyData(`player_${player.id}`, newPlayerData);
        };
    };
} catch (error) { };
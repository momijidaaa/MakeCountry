import { system, world } from "@minecraft/server";
import { CheckPermissionFromLocation, GetAndParsePropertyData, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import config from "../config";
import { chestLockForm } from "./form";

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const permission = `break`
    const { player, block, dimension } = ev;
    const { x, y, z } = block.location;
    const chestId = `chest_${x}_${y}_${z}_${dimension.id}`;
    const chestLockData = GetAndParsePropertyData(chestId);
    if (chestLockData && block.typeId.includes(`chest`)) {
        if (chestLockData.player === player.id) {
            system.runTimeout(() => {
                DyProp.setDynamicProperty(chestId);
            });
            return;
        };
        ev.cancel = true;
        player.sendMessage({ translate: `message.thischest.islocked`, with: [`${GetAndParsePropertyData(`player_${chestLockData.player}`).name}`] });
        return;
    };
    if (chestLockData && !block.typeId.includes(`chest`)) {
        system.runTimeout(() => {
            DyProp.setDynamicProperty(chestId);
        });
    };
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
    const permission2 = `openContainer`;
    const permission = `blockUse`;
    const { player, block } = ev;
    const { x, y, z } = block.location;
    if (block.getComponent(`inventory`)) {
        const cannot2 = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission2);
        const chestId = `chest_${x}_${y}_${z}_${player.dimension.id}`;
        const chestLockData = GetAndParsePropertyData(chestId);
        if (chestLockData && block.typeId.includes(`chest`)) {
            if (chestLockData.player == player.id && !player.isSneaking) {
                return;
            };
            if (chestLockData.player == player.id && player.isSneaking) {
                ev.cancel = true;
                system.runTimeout(() => {
                    chestLockForm(player, chestId);
                });
                return;
            };
            ev.cancel = true;
            player.sendMessage({ translate: `message.thischest.islocked`, with: [`${GetAndParsePropertyData(`player_${chestLockData.player}`).name}`] });
            return;
        };
        if (chestLockData && !block.typeId.includes(`chest`)) {
            StringifyAndSavePropertyData(chestId);
        };
        if (player.isSneaking && block.typeId.includes(`chest`)) {
            ev.cancel = true;
            system.runTimeout(() => {
                chestLockForm(player, chestId);
            });
            return;
        };
        ev.cancel = cannot2;
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
            if (!playerData?.marketAmount) playerData.marketAmount = 0;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        } else {
            let moneyValue = config.initialMoney;
            if (config.getMoneyByScoreboard) {
                const scoreboard = world.scoreboard.getObjective(config.moneyScoreboardName) || world.scoreboard.addObjective(config.moneyScoreboardName);
                const scoreValue = scoreboard.getScore(player);
                if (scoreValue) moneyValue = scoreValue;
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
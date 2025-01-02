import { system, world } from "@minecraft/server";
import { CheckPermissionFromLocation, GetAndParsePropertyData, getRandomInteger, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import config from "../config";
import { chestLockForm } from "./form";
import jobs_config from "../jobs_config";
import { version } from "../index"

world.afterEvents.worldInitialize.subscribe((ev) => {
    world.sendMessage({ translate: `world.message.addon`, with: [version] });
});

world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player, initialSpawn } = ev;
    if (!initialSpawn) return;
    player.sendMessage({
        rawtext: [
            { text: `§6------------------------------------------------------------------------------------------\n\n` },
            { translate: `world.message.addon`, with: [version] },
            { text: `\n\n§9Support Discord Server\n§ahttps://discord.gg/8S9YhNaHjD\n\n§cYoutube\n§ahttps://youtube.com/@KaronDAAA\n\n§bTwitter\n§ahttps://twitter.com/KaronDAAA\n\n§6------------------------------------------------------------------------------------------\n` }
        ]
    });
});

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const permission = 'break';
    const { player, block, dimension } = ev;
    const { x, y, z } = block.location;
    const chestId = `chest_${x}_${y}_${z}_${dimension.id}`;
    const chestLockData = GetAndParsePropertyData(chestId);
    const isChest = block.typeId.includes('chest');

    if (chestLockData) {
        if (isChest && chestLockData.player === player.id) {
            system.runTimeout(() => DyProp.setDynamicProperty(chestId));
        } else if (isChest) {
            ev.cancel = true;
            const ownerName = GetAndParsePropertyData(`player_${chestLockData.player}`).name;
            player.sendMessage({ translate: 'message.thischest.islocked', with: [ownerName] });
        } else {
            system.runTimeout(() => DyProp.setDynamicProperty(chestId));
        }
        return;
    }

    const cannot = CheckPermissionFromLocation(player, x, z, dimension.id, permission);
    ev.cancel = cannot;

    if (cannot) {
        player.sendMessage({ translate: `cannot.permission.${permission}` });
    }
});

world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const permission = `place`;
    const { player, block } = ev;
    const { x, z } = block.location;
    const cannot = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission);
    ev.cancel = cannot;
    if (!cannot) return;
    player.sendMessage({ translate: `cannot.permission.${permission}` });
    return;
});

world.beforeEvents.itemUseOn.subscribe((ev) => {
    const permission = `place`;
    const { source: player, block } = ev;
    const { x, z } = block.location;
    const cannot = CheckPermissionFromLocation(player, x, z, player.dimension.id, permission);
    ev.cancel = cannot;
    if (!cannot) return;
    player.sendMessage({ translate: `cannot.permission.${permission}` });
    return;
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    const permission2 = 'openContainer'; // コンテナの開放権限
    const permission = 'blockUse'; // ブロックの使用権限
    const { player, block } = ev;
    const { x, y, z } = block.location;
    const dimensionId = player.dimension.id;
    const chestId = `chest_${x}_${y}_${z}_${dimensionId}`;
    const isChest = block.typeId.includes('chest'); // チェストかどうか
    const playerId = player.id;
    const isSneaking = player.isSneaking; // スニーク状態かどうか
    const container = player.getComponent('inventory')?.container;
    const selectedItem = container?.getItem(player.selectedSlotIndex);

    // インベントリの操作確認
    if (block.getComponent('inventory')) {
        const cannot2 = CheckPermissionFromLocation(player, x, z, dimensionId, permission2);
        if (!cannot2) {
            const chestLockData = GetAndParsePropertyData(chestId);
            if (chestLockData) {
                const isOwner = chestLockData.player === playerId; // 所有者かどうか
                if (isChest) {
                    if (isOwner && !isSneaking) return;
                    if (isOwner && isSneaking && !selectedItem) {
                        ev.cancel = true;
                        system.runTimeout(() => chestLockForm(player, chestId));
                        return;
                    }
                    ev.cancel = true;
                    player.sendMessage({ translate: 'message.thischest.islocked', with: [GetAndParsePropertyData(`player_${chestLockData.player}`).name] });
                    return;
                }
                if (!isChest) {
                    DyProp.setDynamicProperty(chestId);
                }
            } else if (isSneaking && isChest && !selectedItem) {
                ev.cancel = true;
                system.runTimeout(() => chestLockForm(player, chestId));
                return;
            }
        }
        ev.cancel = cannot2;
        return;
    }

    // 一般的なブロック操作の権限確認
    const cannot = CheckPermissionFromLocation(player, x, z, dimensionId, permission);
    ev.cancel = cannot;
    player.sendMessage({ translate: `cannot.permission.${permission}` });
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
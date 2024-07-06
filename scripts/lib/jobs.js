import { Player, world } from "@minecraft/server";
import { GetAndParsePropertyData, getRandomInteger, StringifyAndSavePropertyData } from "./util";
import jobs_config from "../jobs_config";

world.afterEvents.playerBreakBlock.subscribe((ev) => {
    if (!jobs_config.validity) return;
    const { brokenBlockPermutation, player } = ev;
    world.sendMessage(`${brokenBlockPermutation.getTags()} ${brokenBlockPermutation.type.id} ${brokenBlockPermutation.getState(`age`)}`)
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    if (brokenBlockPermutation.hasTag(`log`) && player.hasTag(`mcjobs_woodcutter`)) {
        const random = getRandomInteger(jobs_config.woodCutReward.min, jobs_config.woodCutReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.type.id.endsWith(`_ore`) && player.hasTag(`mcjobs_miner`)) {
        const random = getRandomInteger(jobs_config.oreMiningReward.min, jobs_config.oreMiningReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.hasTag(`stone`) && player.hasTag(`mcjobs_miner`)) {
        const random = getRandomInteger(jobs_config.stoneMiningReward.min, jobs_config.stoneMiningReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.hasTag(`crop`) && player.hasTag(`mcjobs_farmer`) && brokenBlockPermutation.getState(`growth`) === 7 ) {
        const random = getRandomInteger(jobs_config.cropHarvestReward.min, jobs_config.cropHarvestReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:cocoa` && player.hasTag(`mcjobs_farmer`) && brokenBlockPermutation.getState(`age`) === 2 ) {
        const random = getRandomInteger(jobs_config.cocoaHarvestReward.min, jobs_config.cocoaHarvestReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
});

world.afterEvents.entityDie.subscribe((ev) => {
    if (!jobs_config.validity) return;
    try {
        if (!(ev.damageSource.damagingEntity instanceof Player)) { return };
        const player = ev.damageSource.damagingEntity;
        if (!player.hasTag(`mcjobs_hunter`)) return;
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        try {
            const id = ev.deadEntity.typeId.split(`:`)[1];
            const random = getRandomInteger(jobs_config[`${id}KillReward`].min, jobs_config[`${id}KillReward`].max)
            if (jobs_config.showRewardMessage) player.onScreenDisplay.setActionBar(`§6+${random}`)
            playerData.money += random;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        } catch (error) {
            const random = getRandomInteger(configs.oreMiningReward.min, configs.otherMobkillReward.max)
            if (jobs_config.showRewardMessage) player.onScreenDisplay.setActionBar(`§6+${random}`)
            playerData.money += random;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        };
    } catch (error) {
        return;
    };
});
import { Player, system, world } from "@minecraft/server";
import { GetAndParsePropertyData, getRandomInteger, StringifyAndSavePropertyData } from "./util";
import jobs_config from "../jobs_config";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import playerFishingAfterEvent from "./fishingEvent";

world.afterEvents.playerBreakBlock.subscribe((ev) => {
    if (!jobs_config.validity) return;
    const { brokenBlockPermutation, player } = ev;

    //木こり
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    if (brokenBlockPermutation.hasTag(`log`) && player.hasTag(`mcjobs_woodcutter`)) {
        const random = getRandomInteger(jobs_config.woodCutReward.min, jobs_config.woodCutReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };

    //鉱夫
    if (brokenBlockPermutation.type.id.endsWith(`_ore`) && player.hasTag(`mcjobs_miner`)) {
        const random = getRandomInteger(jobs_config.oreMiningReward.min, jobs_config.oreMiningReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:ancient_debris` && player.hasTag(`mcjobs_miner`)) {
        const random = getRandomInteger(jobs_config.oreMiningReward.min, jobs_config.oreMiningReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:deepslate` && player.hasTag(`mcjobs_miner`)) {
        const random = getRandomInteger(jobs_config.stoneMiningReward.min, jobs_config.stoneMiningReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:tuff` && player.hasTag(`mcjobs_miner`)) {
        const random = getRandomInteger(jobs_config.stoneMiningReward.min, jobs_config.stoneMiningReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.hasTag(`stone`) && player.hasTag(`mcjobs_miner`) && brokenBlockPermutation.type.id != `minecraft:cobblestone`) {
        const random = getRandomInteger(jobs_config.stoneMiningReward.min, jobs_config.stoneMiningReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    //農家
    if (brokenBlockPermutation.getTags().includes(`minecraft:crop`) && player.hasTag(`mcjobs_farmer`) && brokenBlockPermutation.getState(`growth`) == 7) {
        const random = getRandomInteger(jobs_config.cropHarvestReward.min, jobs_config.cropHarvestReward.max);
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:cocoa` && player.hasTag(`mcjobs_farmer`) && brokenBlockPermutation.getState(`age`) === 2) {
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
        //狩人
        if (!player.hasTag(`mcjobs_hunter`)) return;
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        try {
            const id = ev.deadEntity.typeId.split(`:`)[1];
            const random = getRandomInteger(jobs_config[`${id}KillReward`].min, jobs_config[`${id}KillReward`].max)
            if (jobs_config.showRewardMessage) player.onScreenDisplay.setActionBar(`§6+${random}`)
            playerData.money += random;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        } catch (error) {
            const random = getRandomInteger(jobs_config.oreMiningReward.min, jobs_config.otherMobkillReward.max)
            if (jobs_config.showRewardMessage) player.onScreenDisplay.setActionBar(`§6+${random}`)
            playerData.money += random;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        };
    } catch (error) {
        return;
    };
});

playerFishingAfterEvent.subscribe((event) => {
    if (!jobs_config.validity) return;
    if (!event.result) return;
    // 漁師
    /**
     * @type {Player}
     */
    const player = event.player;
    if (!player.hasTag(`mcjobs_fisherman`)) return;
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    const random = getRandomInteger(jobs_config.fishingReward.min, jobs_config.fishingReward.max)
    if (jobs_config.showRewardMessage) player.onScreenDisplay.setActionBar(`§6+${random}`)
    playerData.money += random;
});

/**
 * 職業メニュー
 * @param {Player} player 
 */
export function jobsForm(player) {
    const form = new ActionFormData();
    form.title({ translate: `jobs.title` });
    for (const job of jobs_config.jobsList) {
        let isEmploy = player.hasTag(`mcjobs_${job.id}`);
        let employMessage = `not.yet.employed`;
        if (isEmploy) employMessage = `already.found.employment`;
        form.button({ rawtext: [{ text: `§l` }, { translate: job.name }, { text: `\n` }, { translate: employMessage }] });
    };
    form.show(player).then((rs) => {
        if (rs.canceled) {
            if (rs.cancelationReason === FormCancelationReason.UserBusy) {
                jobsForm(player);
                return;
            };
            return;
        };
        const selected = rs.selection;
        let isEmploy = player.hasTag(`mcjobs_${jobs_config.jobsList[selected].id}`);
        if (isEmploy) {
            player.removeTag(`mcjobs_${jobs_config.jobsList[selected].id}`);
            jobsForm(player);
            return;
        };
        let employAmount = player.getTags().filter(t => t.startsWith(`mcjobs_`)).length;
        if (employAmount === jobs_config.maxEmploymentNum) {
            player.sendMessage({ translate: `message.max.employment.num.over`, with: [`${employAmount}`] });
            return;
        };
        player.addTag(`mcjobs_${jobs_config.jobsList[selected].id}`);
        jobsForm(player);
        return;
    });
};
import { EnchantmentType, EnchantmentTypes, Player, system, world } from "@minecraft/server";
import { GetAndParsePropertyData, getRandomInteger, StringifyAndSavePropertyData } from "./util";
import jobs_config from "../jobs_config";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";
import playerFishingAfterEvent from "./fishingEvent";
import { JobLevel } from "./jobslevel";

world.afterEvents.playerBreakBlock.subscribe((ev) => {
    if (!jobs_config.validity) return;
    const { brokenBlockPermutation, player } = ev;

    //木こり
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    if (brokenBlockPermutation.hasTag(`log`) && player.hasTag(`mcjobs_woodcutter`)) {
        const jobs = new JobLevel(player, "woodcutter");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.woodCutReward.min, jobs_config.woodCutReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };

    //土掘り士
    if (brokenBlockPermutation.type.id === `minecraft:dirt` && player.hasTag(`mcjobs_dirtdigger`)) {
        const jobs = new JobLevel(player, "dirtdigger");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.dirtdiggerReward.min, jobs_config.dirtdiggerReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:grass` && player.hasTag(`mcjobs_dirtdigger`)) {
        const jobs = new JobLevel(player, "dirtdigger");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.dirtdiggerReward.min, jobs_config.dirtdiggerReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:grass_block` && player.hasTag(`mcjobs_dirtdigger`)) {
        const jobs = new JobLevel(player, "dirtdigger");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.dirtdiggerReward.min, jobs_config.dirtdiggerReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };

    //砂掘り士
    if (brokenBlockPermutation.type.id.endsWith(`sand`) && player.hasTag(`mcjobs_sanddigger`)) {
        const jobs = new JobLevel(player, "sanddigger");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.sanddiggerReward.min, jobs_config.sanddiggerReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:gravel` && player.hasTag(`mcjobs_sanddigger`)) {
        const jobs = new JobLevel(player, "sanddigger");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.sanddiggerReward.min, jobs_config.sanddiggerReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };

    //ネザー掘り士
    if (brokenBlockPermutation.type.id === `minecraft:netherrack` && player.hasTag(`mcjobs_netherdigger`)) {
        const jobs = new JobLevel(player, "netherdigger");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.netherdiggerReward.min, jobs_config.netherdiggerReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:basalt` && player.hasTag(`mcjobs_netherdigger`)) {
        const jobs = new JobLevel(player, "netherdigger");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.netherdiggerReward.min, jobs_config.netherdiggerReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:soul_soil` && player.hasTag(`mcjobs_netherdigger`)) {
        const jobs = new JobLevel(player, "netherdigger");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.netherdiggerReward.min, jobs_config.netherdiggerReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };

    //鉱夫
    if (player.hasTag(`mcjobs_miner`) && player.getComponent(`inventory`).container.getItem(player.selectedSlotIndex)?.getComponent(`enchantable`)?.getEnchantment(`silk_touch`)) {
        return;
    };
    if (brokenBlockPermutation.type.id == `minecraft:stone` && player.hasTag(`mcjobs_miner`)) {
        const jobs = new JobLevel(player, "miner");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.normalStoneMiningReward.min, jobs_config.normalStoneMiningReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id.endsWith(`_ore`) && player.hasTag(`mcjobs_miner`)) {
        const jobs = new JobLevel(player, "miner");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.oreMiningReward.min, jobs_config.oreMiningReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:ancient_debris` && player.hasTag(`mcjobs_miner`)) {
        const jobs = new JobLevel(player, "miner");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.oreMiningReward.min, jobs_config.oreMiningReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:deepslate` && player.hasTag(`mcjobs_miner`)) {
        const jobs = new JobLevel(player, "miner");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.stoneMiningReward.min, jobs_config.stoneMiningReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:tuff` && player.hasTag(`mcjobs_miner`)) {
        const jobs = new JobLevel(player, "miner");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.stoneMiningReward.min, jobs_config.stoneMiningReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.hasTag(`stone`) && player.hasTag(`mcjobs_miner`) && brokenBlockPermutation.type.id != `minecraft:cobblestone`) {
        const jobs = new JobLevel(player, "miner");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.stoneMiningReward.min, jobs_config.stoneMiningReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };

    //農家
    if (brokenBlockPermutation.getTags().includes(`minecraft:crop`) && player.hasTag(`mcjobs_farmer`) && brokenBlockPermutation.getState(`growth`) == 7) {
        const jobs = new JobLevel(player, "farmer");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.cropHarvestReward.min, jobs_config.cropHarvestReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `minecraft:cocoa` && player.hasTag(`mcjobs_farmer`) && brokenBlockPermutation.getState(`age`) === 2) {
        const jobs = new JobLevel(player, "farmer");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.cocoaHarvestReward.min, jobs_config.cocoaHarvestReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
        return;
    };
    if (brokenBlockPermutation.type.id === `mc:rice_crop` && player.hasTag(`mcjobs_farmer`) && brokenBlockPermutation.getState(`mc:growth_stage`) === 3) {
        const jobs = new JobLevel(player, "farmer");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.cropHarvestReward.min, jobs_config.cropHarvestReward) * 100 * jobs.getReward(jobsLevel)) / 100;
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        if (jobs_config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`);
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
            const jobs = new JobLevel(player, "hunter");
            const jobsLevel = jobs.getLevel();
            jobs.addXp(jobs_config.jobsXp);
            const random = Math.floor(getRandomInteger(jobs_config[`${id}KillReward`].min, jobs_config[`${id}KillReward`]) * 100 * jobs.getReward(jobsLevel)) / 100
            if (jobs_config.showRewardMessage) player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`)
            playerData.money += random;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        } catch (error) {
            const jobs = new JobLevel(player, "hunter");
            const jobsLevel = jobs.getLevel();
            jobs.addXp(jobs_config.jobsXp);
            const random = Math.floor(getRandomInteger(jobs_config.oreMiningReward.min, jobs_config.otherMobkillReward) * 100 * jobs.getReward(jobsLevel)) / 100
            if (jobs_config.showRewardMessage) player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`)
            playerData.money += random;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
        };
    } catch (error) {
        return;
    };
});

playerFishingAfterEvent.subscribe((event) => {
    system.runTimeout(() => {
        if (!jobs_config.validity) return;
        if (!event.result) return;
        // 漁師
        /**
         * @type {Player}
         */
        const player = event.player;
        if (!player.hasTag(`mcjobs_fisherman`)) return;
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        const jobs = new JobLevel(player, "fisherman");
        const jobsLevel = jobs.getLevel();
        jobs.addXp(jobs_config.jobsXp);
        const random = Math.floor(getRandomInteger(jobs_config.fishingReward.min, jobs_config.fishingReward) * 100 * jobs.getReward(jobsLevel)) / 100
        if (jobs_config.showRewardMessage) player.onScreenDisplay.setActionBar(`§6[Money] +${random} §e[XP] ${jobs.getXp()}/${jobs.getXpRequired(jobsLevel)}`)
        playerData.money += random;
        StringifyAndSavePropertyData(`player_${player.id}`, playerData);
    });
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
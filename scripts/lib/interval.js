import { system, world } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId, StringifyAndSavePropertyData } from "./util";
import { DeleteCountry } from "./land";
import config from "../config";

let taxTimerString = world.getDynamicProperty(`taxTimer`) ?? `${config.taxTimer}`;
world.setDynamicProperty(`taxTimer`, taxTimerString);

const nowCountryId = new Map();

system.runInterval(() => {
    if (!world.getDynamicProperty(`start`)) return;
    for (const p of world.getPlayers()) {
        p.getDynamicProperty(`nowCountryId`);
        const playerLastInCountryId = nowCountryId.get(p.id) ?? 0;
        const nowChunkCountryData = GetAndParsePropertyData(`country_${GetAndParsePropertyData(GetPlayerChunkPropertyId(p))?.countryId}`) ?? { "id": 0, "name": "wilderness.name" };
        const countryChunkDataId = nowChunkCountryData?.id;
        if (countryChunkDataId !== playerLastInCountryId) {
            if (countryChunkDataId == 0) {
                p.onScreenDisplay.setActionBar({ translate: `wilderness.name` });
            } else {
                p.onScreenDisplay.setTitle({ translate: nowChunkCountryData.name });
                p.onScreenDisplay.updateSubtitle(`${nowChunkCountryData.lore ?? ``}`);
            };
        };
        nowCountryId.set(p.id, countryChunkDataId);
    };
}, 30);
system.runInterval(() => {
    if (!world.getDynamicProperty(`start`)) return;
    let taxTimer = Number(taxTimerString) - 1;
    world.setDynamicProperty(`taxTimer`, `${taxTimer}`);
    taxTimerString = `${taxTimer}`;
    if (taxTimer <= 0) {
        world.setDynamicProperty(`taxTimer`, `${config.taxTimer}`);
        taxTimerString = `${config.taxTimer}`;
        world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `tax.time` }] });
        for (const pId of DyProp.DynamicPropertyIds().filter(id => id.startsWith(`player_`))) {
            const playerData = GetAndParsePropertyData(pId);
            playerData.days += 1;
            StringifyAndSavePropertyData(pId, playerData);
            if (!playerData.country) continue;
            const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
            if (countryData.taxInstitutionIsPer) {
                let taxValue = playerData.money * (countryData.taxPer / 100);
                playerData.money -= taxValue;
                countryData.money += taxValue;
                StringifyAndSavePropertyData(pId, playerData);
                StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
            } else {
                if (playerData.money < countryData.taxPer) {
                    if (playerData.money < 0) {
                        continue;
                    } else {
                        let addmoney = playerData.money;
                        playerData.money -= addmoney;
                        countryData.money += addmoney;
                    };
                } else {
                    playerData.money -= countryData.taxPer;
                    countryData.money += countryData.taxPer;

                };
                StringifyAndSavePropertyData(pId, playerData);
                StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
            };
        };
        for (const cId of DyProp.DynamicPropertyIds().filter(id => id.startsWith(`country_`))) {
            const countryData = GetAndParsePropertyData(cId);
            if (0 < countryData.peaceChangeCooltime) {
                countryData.peaceChangeCooltime -= 1;
            };
            if (!countryData?.days) countryData.days = 0;
            countryData.days += 1;
            if (countryData.days < config.NonMaintenanceCostAccrualPeriod) {
                StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
                continue;
            };
            let upkeepCosts = config.MaintenanceFeeNonPeacefulCountries * countryData.territories.length;
            if (countryData.peace) upkeepCosts = config.MaintenanceFeePacifistCountries * countryData.territories.length;
            if (countryData.money < upkeepCosts) {
                countryData.money = 0;
                StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
                DeleteCountry(countryData.id);
                continue;
            };
            countryData.money -= upkeepCosts;
            StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
        };
    };
}, 20 * 60);

const lastMoney = new Map();
system.runInterval(() => {
    if (!config.getMoneyByScoreboard) return;
    const scoreboard = world.scoreboard.getObjective(config.moneyScoreboardName) || world.scoreboard.addObjective(config.moneyScoreboardName);
    const players = world.getPlayers();
    for (const player of players) {
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        if (!playerData) continue;
        let finScoreMoney = lastMoney.get(player.id);
        let thisScoreMoney = undefined;
        try {
            thisScoreMoney = scoreboard.getScore(player);
        } catch (error) {
        }
        if (thisScoreMoney === undefined) {
            player.runCommand(`scoreboard players add @s mc_money ${playerData.money}`);
            thisScoreMoney = playerData.money;
        };
        if (finScoreMoney === undefined) {
            lastMoney.set(player.id, playerData.money);
            scoreboard.setScore(player, playerData.money);
            continue;
        };
        if (finScoreMoney === playerData.money && thisScoreMoney !== playerData.money) {
            lastMoney.set(player.id, thisScoreMoney);
            scoreboard.setScore(player, thisScoreMoney);
            playerData.money = thisScoreMoney;
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
            continue;
        } else {
            lastMoney.set(player.id, playerData.money);
            scoreboard.setScore(player, playerData.money);
            StringifyAndSavePropertyData(`player_${player.id}`, playerData);
            continue;
        };
    };
});
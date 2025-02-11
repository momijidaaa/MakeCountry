import { system, world } from "@minecraft/server";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId, getTimeBefore, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import config from "../config";
import { DeleteCountry } from "./land";

let taxTimerString;

const nowCountryId = new Map();
const nowChunkPlotName = new Map();

world.afterEvents.worldInitialize.subscribe(() => {
    taxTimerString = world.getDynamicProperty(`taxTimer`) ?? `${config.taxTimer}`;
    world.setDynamicProperty(`taxTimer`, taxTimerString);
    if (!DyProp.getDynamicProperty(`voteData`)) DyProp.setDynamicProperty(`voteData`, `{}`);
    if (!DyProp.getDynamicProperty(`loginData`)) DyProp.setDynamicProperty(`loginData`, `{}`);
});

system.runInterval(() => {
    if (!world.getDynamicProperty(`start`)) return;
    for (const p of world.getPlayers()) {
        const playerLastInCountryId = nowCountryId.get(p.id) ?? 0;
        const chunkId = GetPlayerChunkPropertyId(p);
        if (playerLastInCountryId == chunkId) {
            if (nowChunkPlotName.has(p.id)) {
                p.onScreenDisplay.setActionBar(nowChunkPlotName.get(p.id));
            };
            continue;
        };
        const chunkData = GetAndParsePropertyData(chunkId);
        const nowChunkCountryData = GetAndParsePropertyData(`country_${chunkData?.countryId}`) ?? { "id": 0, "name": "wilderness.name", plot: { name: `` } };
        const countryChunkDataId = nowChunkCountryData?.id;
        if (countryChunkDataId !== playerLastInCountryId) {
            if (countryChunkDataId == 0) {
                p.onScreenDisplay.setActionBar({ translate: `wilderness.name` });
            } else {
                p.onScreenDisplay.setTitle({ translate: nowChunkCountryData.name });
                p.onScreenDisplay.updateSubtitle(`${nowChunkCountryData.lore ?? ``}`);
            };
        };
        if (chunkData?.plot) {
            const plot = chunkData?.plot?.group ? GetAndParsePropertyData(`plotgroup_${chunkData?.plot?.group}`) : chunkData?.plot
            if (countryChunkDataId != 0 && plot?.enable) {
                const plotName = plot?.name ?? ``;
                switch (plot?.type ?? `public`) {
                    case `public`: {
                        p.onScreenDisplay.setActionBar({ rawtext: [{ text: `§6~§b${plotName} §6[` }, { translate: `plot.${plot?.type ?? `public`}` }, { text: `]` }] });
                        nowChunkPlotName.set(p.id, { rawtext: [{ text: `§6~§e${plotName} §r§7- §6[` }, { translate: `plot.${plot?.type ?? `public`}` }, { text: `]` }] });
                        break;
                    };
                    case `private`: {
                        p.onScreenDisplay.setActionBar({ rawtext: [{ text: `§6~§a${plotName}` }] });
                        nowChunkPlotName.set(p.id, { rawtext: [{ text: `§6~§e${plotName} §r§7- §6[` }, { translate: `plot.${plot?.type ?? `public`}` }, { text: `]` }] });
                        break;
                    };
                    case `embassy`: {
                        p.onScreenDisplay.setActionBar({ rawtext: [{ text: `§6~§e${plotName} §r§7- §6[` }, { translate: `plot.${plot?.type ?? `public`}` }, { text: `]` }] });
                        nowChunkPlotName.set(p.id, { rawtext: [{ text: `§6~§e${plotName} §r§7- §6[` }, { translate: `plot.${plot?.type ?? `public`}` }, { text: `]` }] });
                        break;
                    };
                };
                //if(nowChunkPlotName.get(p.id) != plotName && plotName != ``) {
                //};
            } else {
                nowChunkPlotName.delete(p.id);
            };
        } else {
            nowChunkPlotName.delete(p.id);
        };
        nowCountryId.set(p.id, countryChunkDataId);
    };
}, 30);

system.runInterval(() => {
    if (!config.taxValidity) return;
    if (!world.getDynamicProperty(`start`)) return;
    if (config.taxTypeIsTimeSet) {
        const zikan = new Date();
        const hour = zikan.getHours();
        const min = zikan.getMinutes();
        const msgTime = getTimeBefore(config.taxTime, config.taxMessageBeforeTime);
        if (hour == msgTime.hour && min == msgTime.min) {
            world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n§r税回収&維持費徴収まで残り10分です\n建国から3日が経過した国は維持費が徴収されます\n平和主義は50$/1チャンク\n非平和主義国は5$/1チャンク\n維持費は国庫の国家予算から引かれるため予め入金しておいてください` }] });
        };
        if (hour == config.taxTime.hour && min == config.taxTime.min) {
            tax();
        };
    } else {
        let taxTimer = Number(taxTimerString) - 1;
        world.setDynamicProperty(`taxTimer`, `${taxTimer}`);
        taxTimerString = `${taxTimer}`;
        if (taxTimer == config.taxMessageBeforeTime) {
            world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n§r` }, { translate: `tax.before.message1`, with: [`${config.taxMessageBeforeTime}`] }, { text: `\n` }, { translate: `tax.before.message2`, with: [`${config.NonMaintenanceCostAccrualPeriod}`] }, { text: `\n` }, { translate: `tax.before.message3`, with: [`${config.MaintenanceFeePacifistCountries}`] }, { text: `\n` }, { translate: `tax.before.message4`, with: [`${config.MaintenanceFeeNonPeacefulCountries}`] }, { text: `\n` }, { translate: `tax.before.message5` }] });
            return;
        };
        if (taxTimer <= 0) {
            world.setDynamicProperty(`taxTimer`, `${config.taxTimer}`);
            taxTimerString = `${config.taxTimer}`;
            tax();
        };
    };
}, 20 * 60);

export function tax() {
    world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `tax.time` }] });
    for (const pId of DyProp.DynamicPropertyIds().filter(id => id.startsWith(`player_`))) {
        const playerData = GetAndParsePropertyData(pId);
        playerData.days += 1;
        StringifyAndSavePropertyData(pId, playerData);
        if (!playerData.country) continue;
        const countryData = GetAndParsePropertyData(`country_${playerData.country}`);
        if (countryData.taxInstitutionIsPer) {
            if (playerData.money < 0) {
                continue;
            }
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
    let deleteCount = 0;
    for (const cId of DyProp.DynamicPropertyIds().filter(id => id.startsWith(`country_`))) {
        const countryData = GetAndParsePropertyData(cId);
        if (0 < countryData?.peaceChangeCooltime) {
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
        if (typeof countryData?.money == "number") {
            if (countryData.money < upkeepCosts) {
                countryData.money = 0;
                StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
                system.runTimeout(() => {
                    DeleteCountry(countryData.id);
                }, deleteCount);
                deleteCount++;
                continue;
            };
            countryData.money -= upkeepCosts;
        } else {
            countryData.money = 0;
        };
        StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
    };
};

system.runInterval(() => {
    const zikan = new Date();
    if (zikan.getHours() == 0 && zikan.getMinutes() == 0) {
        DyProp.setDynamicProperty(`voteData`, `{}`);
        DyProp.setDynamicProperty(`loginData`, `{}`);
    };
}, 20 * 60);
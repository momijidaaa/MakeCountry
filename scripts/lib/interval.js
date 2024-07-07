import { system, world } from "@minecraft/server";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import config from "../config";
import { DeleteCountry } from "./land";

let taxTimerString = world.getDynamicProperty(`taxTimer`) ?? `${config.taxTimer}`;
world.setDynamicProperty(`taxTimer`, taxTimerString);

system.runInterval(() => {
    if (!world.getDynamicProperty(`start`)) return;
    for (const p of world.getPlayers()) {
        let playerLastInCountryIdString = p.getDynamicProperty(`nowCountryId`) ?? "0";
        const playerLastInCountryId = Number(playerLastInCountryIdString);
        const nowChunkCountryData = GetAndParsePropertyData(`country_${GetAndParsePropertyData(GetPlayerChunkPropertyId(p))?.countryId}`) ?? { "id": 0, "name": "wilderness.name" };
        if (nowChunkCountryData.id !== playerLastInCountryId) {
            if (nowChunkCountryData.id == 0) {
                p.onScreenDisplay.setActionBar({ translate: `wilderness.name` });
            } else {
                p.onScreenDisplay.setTitle({ translate: nowChunkCountryData.name });
                p.onScreenDisplay.updateSubtitle(`${nowChunkCountryData.lore ?? ``}`);
            };
        };
        p.setDynamicProperty(`nowCountryId`, nowChunkCountryData.id);
    };
}, 20);

system.runInterval(() => {
    if (!world.getDynamicProperty(`start`)) return;
    let taxTimer = Number(taxTimerString) - 1;
    world.setDynamicProperty(`taxTimer`,`${taxTimer}`);
    taxTimerString = `${taxTimer}`;
    if (taxTimer === 0) {
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
                playerData.money -= countryData.taxPer;
                countryData.money += countryData.taxPer;
                StringifyAndSavePropertyData(pId, playerData);
                StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
            };
        };
        for (const cId of DyProp.DynamicPropertyIds().filter(id => id.startsWith(`country_`))) {
            const countryData = GetAndParsePropertyData(cId);
            if (0 < countryData.peaceChangeCooltime) {
                countryData.peaceChangeCooltime -= 1;
            };
            countryData.days += 1;
            StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
            if (countryData.days < config.NonMaintenanceCostAccrualPeriod) {
                StringifyAndSavePropertyData(`country_${countryData.id}`, countryData);
                continue;
            };
            let upkeepCosts = config.MaintenanceFeeNonPeacefulCountries * countryData.territories;
            if (countryData.peace) upkeepCosts = config.MaintenanceFeePacifistCountries * countryData.territories;
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
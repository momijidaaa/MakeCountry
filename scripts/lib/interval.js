import { system, world } from "@minecraft/server";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";
import config from "../config";

let taxTimerString = world.getDynamicProperty(`taxTimer`) ?? `${config.taxTimer*60}`

system.runInterval(()=>{
    if(!world.getDynamicProperty(`start`)) return;
    for(const p of world.getPlayers()) {
        let playerLastInCountryIdString = p.getDynamicProperty(`nowCountryId`) ?? "0";
        const playerLastInCountryId = Number(playerLastInCountryIdString);
        const nowChunkData = GetAndParsePropertyData(`country_${GetAndParsePropertyData(GetPlayerChunkPropertyId(p))?.countryId}`) ?? {"id": 0,"name": "wilderness.name"};
        if(nowChunkData.id !== playerLastInCountryId) {
            p.onScreenDisplay.setTitle({translate: nowChunkData.name});
            p.onScreenDisplay.updateSubtitle(`${nowChunkData.subName ?? ``}`);
        };
        p.setDynamicProperty(`nowCountryId`,nowChunkData.id);
    };
},20);

system.runInterval(()=>{
    let taxTimer = Number(taxTimerString) - 1;
    if(taxTimer === 0) {
        world.sendMessage({translate: `tax.time`})
        for(const pId of DyProp.DynamicPropertyIds().filter(id => id.startsWith(`player_`))) {
            const playerData = GetAndParsePropertyData(pId);
            const countryData = GetAndParsePropertyData(playerData.country)
            if(countryData.taxInstitutionIsPer) {
                let taxValue = playerData.money * (countryData.taxPer / 100);
                playerData.money -= taxValue;
                countryData.money += taxValue;
                StringifyAndSavePropertyData(pId,playerData);
                StringifyAndSavePropertyData(`country_${countryData.id}`,countryData);
                return;
            } else {
                playerData.money -= countryData.taxPer;
                countryData.money += countryData.taxPer;
                StringifyAndSavePropertyData(pId,playerData);
                StringifyAndSavePropertyData(`country_${countryData.id}`,countryData);
                return;
            };
        };
    };
},20);
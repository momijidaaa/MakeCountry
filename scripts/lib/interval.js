import { system, world } from "@minecraft/server";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId } from "./util";
import * as DyProp from "./DyProp"

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
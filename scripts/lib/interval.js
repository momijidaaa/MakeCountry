import { system, world } from "@minecraft/server";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId } from "./util";
import * as DyProp from "./DyProp"

system.runInterval(()=>{
    if(!world.getDynamicProperty(`start`)) return;
    for(const p of world.getPlayers()) {
        let playerLastInCountryIdString = p.getDynamicProperty(`nowCountryId`) ?? "0";
        const playerLastInCountryId = Number(playerLastInCountryIdString);
        const nowChunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(p)) ?? {"id": 0,"name": "wilderness.name"};
        DyProp.setDynamicProperty(`nowCountryId`,nowChunkData.id);
    };
});
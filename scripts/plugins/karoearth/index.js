import "./anticheat";
import "./chat";
import "./war";
import "./server_net";
import "./transfer";
import "./ban";
import { world, system } from "@minecraft/server";
import * as DyProp from "../../lib/DyProp";

const whiteListEntity = [
    "minecraft:painting",
    "minecraft:armor_stand",
    "minecraft:item",
    "minecraft:npc",
    "minecraft:thrawn_trident",
];
world.afterEvents.entityLoad.subscribe((ev) => {
    const { entity } = ev;
    if(entity.typeId == 'mc:rsk') {
        entity.remove();
        return;
    };
    if(entity.hasTag("dungeonmob")) return;
    if(!entity.typeId.includes('minecraft:')) return;
    if(whiteListEntity.includes(entity.typeId)) return;
    entity.remove();
});

world.afterEvents.worldLoad.subscribe(() => {
    if (!DyProp.getDynamicProperty(`voteData`)) DyProp.setDynamicProperty(`voteData`, `{}`);
    if (!DyProp.getDynamicProperty(`loginData`)) DyProp.setDynamicProperty(`loginData`, `{}`);
    system.runInterval(() => {
        const zikan = new Date();
        if (zikan.getHours() == 0 && zikan.getMinutes() == 0) {
            DyProp.setDynamicProperty(`voteData`, `{}`);
            DyProp.setDynamicProperty(`loginData`, `{}`);
        };
    }, 20 * 60);
});
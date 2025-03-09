import "./anticheat";
import "./chat";
import "./war";
import "./server_net";
import "./transfer";
import "./ban";
import { world } from "@minecraft/server";

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
    if(!entity.typeId.includes('minecraft:')) return;
    if(whiteListEntity.includes(entity.typeId)) return;
    entity.remove();
});
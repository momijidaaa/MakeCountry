import { ItemComponent, world } from "@minecraft/server";

world.beforeEvents.worldInitialize.subscribe((ev) => {
    ev.blockTypeRegistry.registerCustomComponent(``,{
        onEntityFallOn: e => {
            e.fallDistance = 0;
        }
    });
});
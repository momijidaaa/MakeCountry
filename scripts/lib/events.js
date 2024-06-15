import { world } from "@minecraft/server";
import { CheckPermission } from "./util";

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const permission = `build`
    const { player } = ev;
    ev.cancel = CheckPermission(player,permission);
});

world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const permission = `place`
    const { player } = ev;
    ev.cancel = CheckPermission(player,permission);
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    const permission = `blockUse`
    const { player } = ev;
    ev.cancel = CheckPermission(player,permission);
});

world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const permission = `entityUse`
    const { player } = ev;
    ev.cancel = CheckPermission(player,permission);
});
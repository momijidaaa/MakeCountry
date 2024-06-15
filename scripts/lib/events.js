import { world } from "@minecraft/server";
import { CheckPermission } from "./util";

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const permission = `break`
    const { player } = ev;
    const cannot = CheckPermission(player,permission);
    ev.cancel = cannot;
    player.sendMessage({translate: `cannot.permission.break`});
    return;
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
import { world } from "@minecraft/server";
import { CheckPermission } from "./util";

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    const permission = `break`
    const { player } = ev;
    const cannot = CheckPermission(player,permission);
    ev.cancel = cannot;
    player.sendMessage({translate: `cannot.permission.${permission}`});
    return;
});

world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    const permission = `place`
    const { player } = ev;
    ev.cancel = CheckPermission(player,permission);
    player.sendMessage({translate: `cannot.permission.${permission}`});
    return;
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
    const permission = `blockUse`
    const { player } = ev;
    ev.cancel = CheckPermission(player,permission);
    player.sendMessage({translate: `cannot.permission.${permission}`});
    return;
});

world.beforeEvents.playerInteractWithEntity.subscribe((ev) => {
    const permission = `entityUse`
    const { player } = ev;
    ev.cancel = CheckPermission(player,permission);
    player.sendMessage({translate: `cannot.permission.${permission}`});
    return;
});
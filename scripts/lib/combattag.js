import { Player, system, world } from "@minecraft/server";
import config from "../config";

const combatSeconds = new Map();

world.afterEvents.entityHurt.subscribe(ev => {
    if (!config.combatTagValidity) return;
    const { hurtEntity, damageSource } = ev;
    if (!(hurtEntity instanceof Player)) return;
    if (!(damageSource.damagingEntity instanceof Player)) return;
    combatSeconds.set(hurtEntity.id, config.combatTagSeconds);
    hurtEntity.addTag(`mc_combat`);
    return;
});

system.runInterval(() => {
    if (!config.combatTagValidity) return;
    const players = world.getPlayers({ tags: [`mc_combat`] });
    for (const player of players) {
        const value = combatSeconds.get(player.id);
        if (!value) {
            player.removeTag(`mc_combat`);
            continue;
        };
        if (value <= 0) {
            combatSeconds.delete(player.id);
            player.removeTag(`mc_combat`);
            continue;
        };
        if (0 < value) {
            combatSeconds.set(player.id, value - 1);
            continue;
        };
    };
}, 20);
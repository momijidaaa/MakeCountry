import { Player , world } from "@minecraft/server";

/**
 * 
 * @param {Player} player 
 * @param {string} countryName 
 */
export function MakeCountry(player , countryName) {
    if(world.getDynamicProperty(`player_${player.id}`));
};
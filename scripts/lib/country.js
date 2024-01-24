import { Player, world } from "@minecraft/server";
import { ConvertChunk } from "./util/util";
import { configs } from "../config";

/**
 * 
 * @param {Player} player 
 * @param {string} countryName 
 */
export function MakeCountry(player, countryName) {
    /**
    * @type {{"name": string,"money": number ,"country": {name: string ,"role": string}}}
    */
    const status = world.getDynamicProperty(`player_${player.id}`);

    if (status.country.name !== 0) {
        player.sendMessage(`§cあなたは既に国に所属しています`);
        return;
    };
    /**
     * @type {{"country": string,"special": boolean}|`noCountry`}
     */
    const chunkStatus = world.getDynamicProperty(`chunk_${ConvertChunk(player.location.x, player.location.z)}`) ?? `noCountry`;
    if(chunkStatus !== `noCountry`) {
        if(chunkStatus.country.length !== 0) {
            player.sendMessage(`§cこのチャンクは国があるため建国できません`);
            return;
        } else {
            player.sendMessage(`§cこのチャンクには建国できません`);
            return;
        };
    };
    if(status.money < configs.makeCountryCost) {
        player.sendMessage(`§c建国には${configs.makeCountryCost}${configs}必要です(${configs.makeCountryCost - status.money}${configs.CurrencyUnit})`);
    };
};
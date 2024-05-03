import { world } from "@minecraft/server";
import * as DyProp from "./lib/DyProp";

//プレイヤーが来た時
world.afterEvents.playerSpawn.subscribe((ev) => {
    const { initialSpawn, player } = ev;
    if (initialSpawn) {
        if (!DyProp.get(`player_${player.id}`)) {
            let playersData = "";

            let nextPlayerNum = DyProp.get(`nextPlayerNum`);

            const rawPlayersData = DyProp.get(`players`);

            playersData = rawPlayersData ?? "{}";

            if (!rawPlayersData) DyProp.set(`players`, "{}");
            if (!nextPlayerNum) DyProp.set(`nextPlayerNum`, "1");
            playersData = JSON.parse(playersData);
            nextPlayerNum = Number(nextPlayerNum)

            world.setDynamicProperty(`player_${player.id}`, `${nextPlayerNum}`);
        };
        /**
         * @type {{"name": string,"money": number ,"country": {name: string ,"role": string}}}
         */
        const status = JSON.parse(world.getDynamicProperty(`player_${player.id}`));
        status.name = player.name;
        world.setDynamicProperty(`player_${player.id}`, JSON.stringify(status));
    };
});
import { world } from "@minecraft/server";
import * as DyProp from "./lib/DyProp";

//プレイヤーが来た時
world.afterEvents.playerSpawn.subscribe((ev)=>{
    const { initialSpawn , player } = ev;
    if(initialSpawn) {
        if(!world.getDynamicProperty(`player_${player.id}`)) {
            world.setDynamicProperty(`player_${player.id}`,`{"name": "${player.name}","money": 0 ,"country": {name: "" ,"role": ""}}`);
        };
        /**
         * @type {{"name": string,"money": number ,"country": {name: string ,"role": string}}}
         */
        const status = JSON.parse(world.getDynamicProperty(`player_${player.id}`));
        status.name = player.name;
        world.setDynamicProperty(`player_${player.id}`,JSON.stringify(status));
    };
});
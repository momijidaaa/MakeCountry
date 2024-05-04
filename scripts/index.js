import { world } from "@minecraft/server";
import * as DyProp from "./lib/DyProp";

import "./lib/land";
import "./lib/role";

//プレイヤーが来た時
world.afterEvents.playerSpawn.subscribe((ev) => {
    const { initialSpawn, player } = ev;
    if (initialSpawn) {
        if (!DyProp.get(`player_${player.id}`)) {
            /**
             * @type {{ [key: string]: { name: string, roles: [string], money: number, country: string|undefined }}}
             */
            let playersData = "";

            let nextPlayerNum = DyProp.get(`nextPlayerNum`);

            const rawPlayersData = DyProp.get(`players`);

            playersData = rawPlayersData ?? "{}";

            let defaultMoneyString = world.getDynamicProperty(`defaultMoney`) ?? `0`;
            const defaultMoney = Number(defaultMoneyString);
            const moneyScoreboardObject = world.scoreboard.getObjective(world.getDynamicProperty(`moneyScoreName`) ?? `mc_money`) ?? world.scoreboard.addObjective(world.getDynamicProperty(`moneyScoreName`) ?? `mc_money`); 
            player.runCommand(`scoreboard players set @s ${world.getDynamicProperty(`moneyScoreName`) ?? `mc_money`} ${defaultMoney}`);
            if (!rawPlayersData) DyProp.set(`players`, "{}");
            if (!nextPlayerNum) DyProp.set(`nextPlayerNum`, "1");
            playersData = JSON.parse(playersData);
            playersData[nextPlayerNum] = { 
                name: player.name,
                roles: [],
                money: defaultMoney,
                country: undefined
            };
            nextPlayerNum = Number(nextPlayerNum);
            world.setDynamicProperty(`player_${player.id}`, `${nextPlayerNum}`);
            DyProp.set(`nextPlayerNum`, `${nextPlayerNum + 1}`);
        };
    };
});
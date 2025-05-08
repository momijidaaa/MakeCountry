import { system, world } from "@minecraft/server";
import { playerHandler } from "../../api/api";
import { sendEvent } from "./server_net";
import { GetAndParsePropertyData } from "../../lib/util";
import config from "../../config";
import { formshow } from "./transfer";

playerHandler.beforeEvents.command.subscribe((ev) => {
    const { player, commandName, args } = ev;
    if (player.hasTag("mc_notp")) {
        ev.cancel = true;
        return;
    };
    const excludes = ['tp', 'tpmenu', 'lobby', 'vote', 'login', 'server'];
    if (excludes.includes(commandName)) {
        ev.cancel = true;
        system.runTimeout(() => {
            switch (commandName) {
                case 'server': {
                    formshow(player);
                    break;
                };
            };
        });
    };
});

playerHandler.beforeEvents.chat.subscribe((ev) => {
    const { player, message } = ev;
    if (player.getDynamicProperty(`isMute`) && !player.hasTag(`moderator`)) ev.cancel = true;
    if (player.hasTag(`moderator`) && message.startsWith('!')) ev.cancel = true;
});

playerHandler.afterEvents.chat.subscribe((ev) => {
    const { player, message, type } = ev;
    system.run(async () => {
        if (type != "general") return;
        const playerData = GetAndParsePropertyData(`player_${player.id}`);
        const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);

        let landId = playerData?.country;
        let land = `chat.player.no.join.any.country`;
        let penNameBefore = player.getDynamicProperty(`pennameBefore`) ?? config.initialPennameBefore;
        let penNameAfter = player.getDynamicProperty(`pennameAfter`) ?? config.initialPennameAfter;
        let penname = `§r|${penNameBefore}§r${penNameAfter}`;
        if (landId) land = playerCountryData?.name;
        if (land === `chat.player.no.join.any.country`) land = `無所属`;
        sendEvent({
            type: "chat",
            data: {
                server: "karoearth",
                minecraftId: player.id,
                senderName: `[${penname.replaceAll(`§r`, ``).substring(1)}] ${player.name}(${land})`,
                text: message
            }
        });
    });
});
import { world } from "@minecraft/server";

import "./lib/commands";

import "./lib/events";

import "./lib/interval";

import "./lib/jobs";

import "./lib/scripteventCommand";

import "./lib/combattag";

import "./lib/test";

import "./lib/item";

import "./custom_component";

import "./lib/war";

import "./lib/chest_shop";

import "./lib/ranking";

import { sendToDiscord } from "./lib/server_net";

import "./lib/scriptcommand";

//import "./lib/piston";

const version = "ver.1.21.50.β.1.1.0";


world.afterEvents.entitySpawn.subscribe((ev) => {
    if (ev.entity.typeId == "minecraft:item") {
        const item = ev.entity.getComponent(`item`)?.itemStack;
        if(!item) return;
        if (item.typeId == "minecraft:diamond_block" || item.typeId == "minecraft:netherite_block") {
            if (item.amount > 0) {
                let names = [];
                const nearPlayers = ev.entity.dimension.getPlayers({ maxDistance: 100, location: ev.entity.location });
                for(const pn of nearPlayers) {
                    names.push(`${pn.name}(${pn.id})[${JSON.stringify(pn.location)}]`);
                };
                world.getPlayers({ tags: [`mc_admin`, `moderator`] }).forEach(p => {
                    p.sendMessage(`${JSON.stringify(ev.entity.location)} で ${item.typeId} が ${item.amount} 出現\n半径100m以内のプレイヤー${names.join(`\n`)}`);
                });
                sendToDiscord({
                    channelId: `1324622173582655558`,
                    content: {
                        embeds: [
                            {
                                color: 0x7cfc00,
                                description: `${JSON.stringify(ev.entity.location)} で ${item.typeId} が ${item.amount} 出現\n半径100m以内のプレイヤー${names.join(`\n`)}`
                            }
                        ]
                    }
                })
            };
        };
    };
});

world.afterEvents.worldInitialize.subscribe((ev) => {
    world.sendMessage({ translate: `world.message.addon`, with: [version] });
});

world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player, initialSpawn } = ev;
    if (!initialSpawn) return;
    player.sendMessage({
        rawtext: [
            { text: `§6------------------------------------------------------------------------------------------\n\n` },
            { translate: `world.message.addon`, with: [version] },
            { text: `\n\n§9Support Discord Server\n§ahttps://discord.gg/8S9YhNaHjD\n\n§cYoutube\n§ahttps://youtube.com/@KaronDAAA\n\n§bTwitter\n§ahttps://twitter.com/KaronDAAA\n\n§6------------------------------------------------------------------------------------------\n` }
        ]
    });
});
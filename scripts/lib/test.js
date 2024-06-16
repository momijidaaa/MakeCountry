import { Player, ScriptEventSource, system, world } from "@minecraft/server";
import { GetAndParsePropertyData, StringifyAndSavePropertyData } from "./util";
import * as DyProp from "./DyProp";

system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.sourceType !== ScriptEventSource.Entity || !(ev.sourceEntity instanceof Player)) return;
    const { sourceEntity, message } = ev;
    const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
    switch (ev.id) {
        case `karo:add`: {
            playerData.money += Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `karo:remove`: {
            playerData.money -= Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `karo:set`: {
            playerData.money = Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `karo:reset`: {
            world.clearDynamicProperties();
            break;
        };
        case `karo:list`: {
            const dyp = []
            world.getDynamicPropertyIds().forEach(id => {
                `§6${id}§r\n${world.getDynamicProperty(id)}\n`
            })
            world.sendMessage(`${dyp.join(`\n`)}`);
            break;
        };
    };
});

/*
world.afterEvents.worldInitialize.subscribe(() => {
    const dyp = world.getDynamicPropertyIds()
    world.sendMessage(`${dyp}`)
    dyp.forEach(d => {
        world.sendMessage(`${d}\n${world.getDynamicProperty(d)}`)
    })
    world.sendMessage(`${DyProp.DynamicPropertyIds().filter(c => c.startsWith(`country_`))}`)
})
*/
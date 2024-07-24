import { Player, ScriptEventSource, system, world } from "@minecraft/server";
import { GetAndParsePropertyData, StringifyAndSavePropertyData } from "./util";
import { changeOwnerScriptEvent, DeleteCountry, playerCountryJoin } from "./land";
import * as DyProp from "./DyProp";
import { ActionFormData, FormCancelationReason, uiManager } from "@minecraft/server-ui";
import { itemIdToPath } from "../texture_config";

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
                dyp.push(`§6${id}§r\n${world.getDynamicProperty(id)}\n`)
            })
            world.sendMessage(`${dyp.join(`\n`)}`);
            break;
        };
        case `karo:taxtimer`: {
            world.setDynamicProperty(`taxTimer`, message);
            break;
        };
        case `karo:newowner`: {
            changeOwnerScriptEvent(sourceEntity);
            break;
        };
        case `karo:deletecountry`: {
            DeleteCountry(Number(message));
            break;
        };
        case `karo:countrydata`: {
            sourceEntity.sendMessage(`${DyProp.getDynamicProperty(`country_${message}`)}`);
            break;
        };
        case `karo:addcountrydata`: {
            const [messageSplit1, ...messageSplit2] = message.split(` `, 2);
            const countryData = GetAndParsePropertyData(`country_${messageSplit1}`);
            Object.assign(countryData, JSON.parse(messageSplit2.join(``)));
            StringifyAndSavePropertyData(`country_${messageSplit1}`, countryData);
            break;
        };
        case `karo:roledata`: {
            sourceEntity.sendMessage(`${DyProp.getDynamicProperty(`role_${message}`)}`);
            break;
        };
        case `karo:addroledata`: {
            const [messageSplit1, ...messageSplit2] = message.split(` `, 2);
            const roleData = GetAndParsePropertyData(`role_${messageSplit1}`);
            Object.assign(roleData, JSON.parse(messageSplit2.join(``)));
            StringifyAndSavePropertyData(`role_${messageSplit1}`, roleData);
            break;
        };
        case `karo:createroledata`: {
            const [messageSplit1, ...messageSplit2] = message.split(` `, 2);
            const roleData = {
                name: `new Role`,
                color: `§a`,
                icon: `textures/blocks/stone`,
                id: Number(messageSplit1),
                members: [],
                permissions: []
            };
            StringifyAndSavePropertyData(`role_${messageSplit1}`, roleData);
            break;
        };
        case `karo:countryjoin`: {
            playerCountryJoin(sourceEntity, Number(message));
            break;
        };
        case `karo:item`: {
            const container = sourceEntity.getComponent(`inventory`).container;
            sourceEntity.sendMessage(`${container.getItem(sourceEntity.selectedSlotIndex)?.typeId}`);
            break;
        };
        case `karo:itemtest`: {
            itemTestForm(sourceEntity);
            break;
        };
        case `karo:mobtest`: {
            const [messageSplit1, ...messageSplit2] = message.split(` `, 2);
            sourceEntity.sendMessage(`半径${messageSplit1}m以内にいる${messageSplit2}は${sourceEntity.dimension.getEntities({ location: sourceEntity.location, maxDistance: Number(messageSplit1), type: messageSplit2 }).length}`);
            break;
        };
        /*case `karo:form`: {
            for(const player of world.getAllPlayers()) {
                uiManager.closeAllForms(player);
            };
            break;
        };*/
    };
});

/**
 * 
 * @param {Player} player 
 */
function itemTestForm(player) {
    const form = new ActionFormData();
    const items = Object.keys(itemIdToPath);
    for (let i = 0; i < items.length; i++) {
        form.button(items[i], itemIdToPath[items[i]]);
    };
    form.show(player).then((rs) => {
        if (rs.canceled) {
            if (rs.cancelationReason == FormCancelationReason.UserBusy) {
                itemTestForm(player);
            };
            return;
        };
    });
};

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
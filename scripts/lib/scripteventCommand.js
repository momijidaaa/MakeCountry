import { Player, ScriptEventSource, system, world } from "@minecraft/server";
import { GetAndParsePropertyData, StringifyAndSavePropertyData } from "./util";
import { uiManager } from "@minecraft/server-ui";
import { tax } from "./interval";

system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.sourceType !== ScriptEventSource.Entity || !(ev.sourceEntity instanceof Player)) return;
    const { sourceEntity, message } = ev;
    const playerData = GetAndParsePropertyData(`player_${sourceEntity.id}`);
    switch (ev.id) {
        case `mc:add`: {
            playerData.money += Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mc:remove`: {
            playerData.money -= Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mc:set`: {
            playerData.money = Number(message);
            StringifyAndSavePropertyData(`player_${sourceEntity.id}`, playerData);
            break;
        };
        case `mc:close_form`: {
            uiManager.closeAllForms(sourceEntity);
            break;
        };
        case `mc:setup`: {
            sourceEntity.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `system.setup.complete` }] });
            sourceEntity.addTag("mc_admin");
            world.setDynamicProperty(`start`, `true`);
            break;
        };
        case `mc:tax_time`: {
            tax();
            break;
        };
    };
});
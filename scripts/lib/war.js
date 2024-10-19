import { Container, EntityEquippableComponent, Player, system, world } from "@minecraft/server";
import { GetAndParsePropertyData, GetChunkPropertyId, GetPlayerChunkPropertyId, isWithinTimeRange, StringifyAndSavePropertyData } from "./util";
import config from "../config";

const warCountry = new Map();

const wars = new Map();
/**
 * 
 * @param {Player} player 
 */
export function Invade(player) {
    let key = 0;
    for (let i = 1; i < 16; i++) {
        if (wars.has(`${i}`)) continue;
        key = i;
        break;
    };
    if (key == 0) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.maxinvade` }] });
        return;
    };
    if (config.isSettingCanInvadeDuration) {
        let start = config.canInvadeDuration.startTime;
        let end = config.canInvadeDuration.endTime;
        if (!isWithinTimeRange(start, end)) {
            player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.notimerange` , with: [`${start.hour}:${start.min}～${end.hour}:${end.min}`]}] });
            return;
        };
    };
    const chunk = GetAndParsePropertyData(GetPlayerChunkPropertyId(player));
    if (!chunk || !chunk?.countryId) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.wilderness` }] });
        return;
    };
    const playerData = GetAndParsePropertyData(`player_${player.id}`);
    if (chunk?.countryId == playerData?.country) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.mycountry` }] });
        return;
    };
    const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
    if (playerCountryData?.peace) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.peace` }] });
        return;
    };
    if (playerCountryData?.days <= config.invadeProtectionDuration) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.protectionduration` }] });
        return;
    };
    if (warCountry.has(`${playerCountryData.id}`)) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.iswarnow` }] });
        return;
    };
    if (playerCountryData.alliance.includes(chunk.countryId)) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.alliance` }] });
        return;
    };
    const targetCountryData = GetAndParsePropertyData(`country_${chunk.countryId}`);
    if (targetCountryData?.peace) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.target.peace` }] });
        return;
    };
    const date = new Date(Date.now() + ((config.timeDifference * 60) * 60 * 1000)).getTime();
    const cooltime = playerCountryData?.invadeCooltime ?? date - 1000;

    if (cooltime - date > 0) {
        player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.cooltime`, with: [`${Math.ceil((cooltime - date) / 100) / 10}`] }] });
        return;
    };
    if (config.isAttackCorner) {
        const thisChunk = chunk.id;
        const [c, cx, cz, d] = thisChunk.split(`_`);
        const numCx = Number(cx);
        const numCz = Number(cz);
        let adjacentTerritoriesLength = 0;
        for (let i = -1; i <= 1; i += 2) {
            const adjacentChunk = `${c}_${numCx}_${numCz + i}_${d}`;
            const adjacentChunkData = GetAndParsePropertyData(`${adjacentChunk}`);
            if (adjacentChunkData) {
                if (adjacentChunkData?.countryId) {
                    adjacentTerritoriesLength++;
                };
            };
            const adjacentChunk2 = `${c}_${numCx + i}_${numCz}_${d}`;
            const adjacentChunkData2 = GetAndParsePropertyData(`${adjacentChunk2}`);
            if (adjacentChunkData2) {
                if (adjacentChunkData2?.countryId) {
                    adjacentTerritoriesLength++;
                };
            };
        };
        if (adjacentTerritoriesLength >= 3) {
            player.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.error.attackcorner` }] });
            return;
        };
    };

    playerCountryData.invadeCooltime = date + (config.invadeCooltime * 1000);
    playerCountryData.peaceChangeCooltime = config.invadePeaceChangeCooltime;

    const coreEntity = player.dimension.spawnEntity(`mc:core`, player.getHeadLocation());
    warCountry.set(`${playerCountryData.id}`, { country: targetCountryData.id, core: coreEntity.id, time: date + 1000 * config.invadeTimelimit, key: key });
    coreEntity.nameTag = `${targetCountryData.name}§r Core`;
    const { x, y, z } = coreEntity.location;
    const msg = `${Math.floor(x)}, ${Math.floor(y)}, ${Math.floor(z)} [${coreEntity.dimension.id.replace(`minecraft:`, ``)}]`;
    player.addTag(`war${key}`);
    coreEntity.addTag(`war${key}`);
    wars.set(`${key}`, true);
    world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n§f` }, { translate: `invade.success`, with: [`${player.name}§r(${playerCountryData.name}§r)`, `${msg}§r(${targetCountryData.name})§r`] }] });
    StringifyAndSavePropertyData(`country_${playerCountryData.id}`, playerCountryData);
};

world.afterEvents.entityLoad.subscribe((ev) => {
    const entity = ev.entity;
    if (entity?.typeId !== `mc:core`) return;
    let isWar = false;
    warCountry.forEach((value, key, map) => {
        if (entity.id == value.core) {
            isWar = true;
        };
    });
    if (!isWar) {
        entity.remove();
    };
});

world.afterEvents.playerSpawn.subscribe((ev) => {
    const { initialSpawn, player } = ev;
    if (initialSpawn) {
        const tags = player.getTags().filter(a => a.startsWith(`war`));
        for (let i = 0; i < tags.length; i++) {
            player.removeTag(tags[i]);
        };
    };
});

world.afterEvents.worldInitialize.subscribe(() => {
    const players = world.getPlayers();
    for (const player of players) {
        const tags = player.getTags().filter(a => a.startsWith(`war`));
        for (let i = 0; i < tags.length; i++) {
            player.removeTag(tags[i]);
        };
    };
    const overworldEntities = world.getDimension(`minecraft:overworld`).getEntities({ type: `mc:core` });
    for (const entity of overworldEntities) {
        entity.remove();
    };
    const netherEntities = world.getDimension(`minecraft:nether`).getEntities({ type: `mc:core` });
    for (const entity of netherEntities) {
        entity.remove();
    };
    const the_endEntities = world.getDimension(`minecraft:the_end`).getEntities({ type: `mc:core` });
    for (const entity of the_endEntities) {
        entity.remove();
    };
});

world.afterEvents.entityDie.subscribe((ev) => {
    const { deadEntity } = ev;
    if (!deadEntity.isValid()) return;
    if (deadEntity?.typeId !== `mc:core`) return;
    let isWar = false;
    let key = ``;
    warCountry.forEach((value, mapKey, map) => {
        if (deadEntity.id == value.core) {
            isWar = true;
            key = mapKey;
        };
    });
    if (!isWar) {
        return;
    };
    /**
     * @type {{ country: number, core: string }}
     */
    const data = warCountry.get(key);
    const playerCountryData = GetAndParsePropertyData(`country_${key}`);
    const invadeCountryData = GetAndParsePropertyData(`country_${data.country}`);
    const chunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(deadEntity));
    chunkData.countryId = playerCountryData.id;
    if (invadeCountryData.territories.includes(chunkData.id)) {
        invadeCountryData.territories.splice(playerCountryData.territories.indexOf(chunkData.id), 1);
    };
    playerCountryData.territories.push(chunkData.id);
    StringifyAndSavePropertyData(chunkData.id, chunkData);
    StringifyAndSavePropertyData(`country_${playerCountryData.id}`, playerCountryData);
    StringifyAndSavePropertyData(`country_${invadeCountryData.id}`, invadeCountryData);
    if (ev.damageSource?.damagingEntity) {
        ev.damageSource.damagingEntity.removeTag(ev.damageSource.damagingEntity.getTags().find(tag => tag.startsWith(`war`)));
    };
    wars.delete(data.key);
    warCountry.delete(key);
    world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.won`, with: [`§r${playerCountryData.name}§r`, `${invadeCountryData.name}§r`] }] });
});

world.afterEvents.entityDie.subscribe((ev) => {
    const { deadEntity } = ev;
    if (!deadEntity.isValid()) return;
    if (deadEntity?.typeId !== `minecraft:player`) return;
    const tags = deadEntity.getTags().find(a => a.startsWith(`war`));
    if (!tags) return;
    const key = tags.split(`war`)[1];
    const playerData = GetAndParsePropertyData(`player_${deadEntity.id}`);
    if (!warCountry.has(`${playerData.country}`)) return;
    /**
     * @type {{ country: number, core: string }}
     */
    const warData = warCountry.get(`${playerData.country}`);
    const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
    const warCountryData = GetAndParsePropertyData(`country_${warData.country}`);
    const core = world.getEntity(warData.core);
    if (core) {
        core.remove();
    };
    deadEntity.removeTag(`war${key}`);
    wars.delete(key);
    warCountry.delete(`${playerData.country}`);
    world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.guard`, with: [`§r${warCountryData.name}§r`, `${playerCountryData.name}§r`] }] });
});

world.beforeEvents.playerLeave.subscribe((ev) => {
    const { player: deadEntity } = ev;
    if (!deadEntity.isValid()) return;
    if (deadEntity?.typeId !== `minecraft:player`) return;
    const tags = deadEntity.getTags().find(a => a.startsWith(`war`));
    if (!tags) return;
    const id = deadEntity.id;
    system.run(() => {
        const key = tags.split(`war`)[1];
        const playerData = GetAndParsePropertyData(`player_${id}`);
        if (!warCountry.has(`${playerData.country}`)) return;
        /**
         * @type {{ country: number, core: string }}
         */
        const warData = warCountry.get(`${playerData.country}`);
        const playerCountryData = GetAndParsePropertyData(`country_${playerData.country}`);
        const warCountryData = GetAndParsePropertyData(`country_${warData.country}`);
        const core = world.getEntity(warData.core);
        if (core) {
            core.remove();
        };
        wars.delete(key);
        warCountry.delete(`${playerData.country}`);
        world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.guard`, with: [`§r${warCountryData.name}§r`, `${playerCountryData.name}§r`] }] });
    });
});

world.afterEvents.entityDie.subscribe((ev) => {
    if (!ev.deadEntity.isValid()) return;
    if (ev.deadEntity.typeId != `minecraft:player`) return;
    const playerData = GetAndParsePropertyData(`player_${ev.deadEntity.id}`);
    if (!playerData?.country) return;
    const values = [];
    for (const key of warCountry.keys()) {
        const data = warCountry.get(key);
        values.push(data.country);
        if (data.country == playerData.country) break;
    };
    if (!values.includes(playerData.country) && !warCountry.has(`${playerData.country}`)) return;
    /** 
    * @type { Container } 
    */
    let playerContainer = ev.deadEntity.getComponent(`inventory`).container;
    for (let i = 0; i < 36; i++) {
        if (typeof playerContainer.getItem(i) === 'undefined') continue;
        world.getDimension(ev.deadEntity.dimension.id).spawnItem(playerContainer.getItem(i), ev.deadEntity.location);
    };
    /** 
    * @type { EntityEquippableComponent } 
    */
    let playerEquipment = ev.deadEntity.getComponent(`minecraft:equippable`);
    const slotNames = ["Chest", "Head", "Feet", "Legs", "Offhand"];
    for (let i = 0; i < 5; i++) {
        if (typeof playerEquipment.getEquipment(slotNames[i]) === 'undefined') continue;
        world.getDimension(ev.deadEntity.dimension.id).spawnItem(playerEquipment.getEquipment(slotNames[i]), ev.deadEntity.location);
    };
    ev.deadEntity.runCommandAsync(`clear @s`);
});

system.runInterval(() => {
    const date = new Date(Date.now() + ((config.timeDifference * 60) * 60 * 1000)).getTime();
    for (const key of warCountry.keys()) {
        const data = warCountry.get(key);
        if (data.time < date) {
            warCountry.delete(key);
            wars.delete(`${data.key}`);
            const playerCountryData = GetAndParsePropertyData(`country_${key}`);
            const warCountryData = GetAndParsePropertyData(`country_${data.country}`);
            const core = world.getEntity(data.core);
            if (core) {
                core.remove();
            };
            world.sendMessage({ rawtext: [{ text: `§a[MakeCountry]\n` }, { translate: `invade.guard`, with: [`§r${warCountryData.name}§r`, `${playerCountryData.name}§r`] }] });
        };
    };
}, 20);

system.runInterval(() => {
    for (const player of world.getPlayers()) {
        const tags = player.getTags().filter(tag => tag.startsWith(`war`));
        if (tags.length == 0) continue;
        const container = player.getComponent(`inventory`).container;
        const selectItem = container.getItem(player.selectedSlotIndex);
        if (selectItem) {
            const selectItemStackTypeId = selectItem.typeId;
            if (selectItemStackTypeId != `minecraft:mace`) continue;
            player.addEffect(`weakness`, 10, { amplifier: 250, showParticles: false });
        };
    };
});
import { world, system, Player } from "@minecraft/server";
import { CommandManager } from "./commands";
import { EventEmitter } from "./events";
import { Logger } from "./log";
import { Formatter } from "./format";
import { Vec3 } from "../../lib/utils/vec3";
import { MainDB } from "../../lib/database";
import { msToTime } from "../../lib/utils/formatter";
import config from "../../config";

export class WorldBuilder {
    constructor() {
        this.events = new EventEmitter();
        this.logger = new Logger();
        this.formatter = new Formatter();
        this.commands = new CommandManager();

        this.active = false;
        this.cache = {
            tpsShard: []
        }

        this.#load();
    }

    async reload() {
        const [player] = this.getPlayers();
        return player.runCommandAsync("function reload");
    }

    get scoerboard() {
        return world.scoreboard;
    }

    getPlayers(options) {
        return world.getPlayers(options);
    }

    getDimension(dimensionId) {
        return world.getDimension(dimensionId);
    }

    getDynamicProperty(identifier) {
        return world.getDynamicProperty(identifier);
    }

    sendMessage(message) {
        if (typeof message === "object")
            world.sendMessage(message);
        else world.sendMessage(String(message));
    }

    getDynamicPropertyIds() {
        return world.getDynamicPropertyIds();
    }

    getDynamicPropertyTotalByteCount() {
        return world.getDynamicPropertyTotalByteCount();
    }

    setDynamicProperty(identifier, value) {
        world.setDynamicProperty(identifier, value);
    }

    #load() {
        try {

            // a

            // b
            world.afterEvents.blockExplode.subscribe((ev) => { if (this.active) this.events.emit("blockExplode", ev); });
            world.afterEvents.buttonPush.subscribe((ev) => { if (this.active) this.events.emit("buttonPush", ev); });

            // c
            world.afterEvents.chatSend.subscribe((ev) => { if (this.active) this.events.emit("afterChatSend", ev); });
            world.beforeEvents.chatSend.subscribe((ev) => {
                if (!this.active) return;
                const { sender } = ev;
                if (ev.message.startsWith("!")) {
                    ev.cancel = true;
                    const [commandName, ...args] = ev.message.trim().slice(config.commands.prefix.length).trim().split(/ +/);
                    if (!commandName) return;
                    this.events.emit("sendCustomCommand", { sender: sender, commandName: commandName, message: args.length === 0 ? undefined : args.join(" ") });
                } else {
                    const playerTimeout = MainDB.get("timeout");
                    if (playerTimeout.has(sender.distId)) {
                        ev.cancel = true;
                        const { time } = playerTimeout.get(sender.distId);
                        sender.sendMessage(`§cあなたはミュートされています。${time ? "" : `\n解除まで ${msToTime(time - Date.now())}`}`);
                    }
                    else this.events.emit("beforeChatSend", ev);
                }
            });

            // d
            world.afterEvents.dataDrivenEntityTrigger.subscribe((ev) => { if (this.active) this.events.emit("afterDataDrivenEntityTriggerEvent", ev); });
            world.beforeEvents.dataDrivenEntityTriggerEvent.subscribe((ev) => { if (this.active) this.events.emit("beforeDataDrivenEntityTriggerEvent", ev); });

            //e
            world.afterEvents.effectAdd.subscribe((ev) => { if (this.active) this.events.emit("effectAdd", ev); });
            world.afterEvents.entityDie.subscribe((ev) => { if (this.active) this.events.emit("entityDie", ev); });
            world.afterEvents.entityHealthChanged.subscribe((ev) => { if (this.active) this.events.emit("entityHealthChanged", ev); });
            world.afterEvents.entityHitBlock.subscribe((ev) => { if (this.active) this.events.emit("entityHitBlock", ev); });
            world.afterEvents.entityHitEntity.subscribe((ev) => { if (this.active) this.events.emit("entityHitEntity", ev); });
            world.afterEvents.entityHurt.subscribe((ev) => { if (this.active) this.events.emit("entityHurt", ev); });
            world.afterEvents.entityLoad.subscribe((ev) => { if (this.active) this.events.emit("entityLoad", ev); });
            world.afterEvents.entityRemove.subscribe((ev) => { if (this.active) this.events.emit("afterEntityRemove", ev); });
            world.beforeEvents.entityRemove.subscribe((ev) => { if (this.active) this.events.emit("beforeEntityRemove", ev); });
            world.afterEvents.entitySpawn.subscribe((ev) => {
                if (!this.active) return;
                const { entity } = ev;

                if (entity.typeId === "minecraft:item") for (let player of this.getPlayers()) {
                    const maxDistance = Math.max(player.fallDistance * 0.25, 1.62);
                    for (let item of player.dimension.getEntities({ location: player.getHeadLocation(), maxDistance: Math.min(maxDistance, 4) })) {
                        if (item.id === entity.id) {
                            const distance = Vec3.distance(Vec3.from(player.getHeadLocation()), Vec3.from(ev.entity.location));
                            player.wavArmTime = Date.now();
                        }
                    }
                }

                this.events.emit("entitySpawn", ev);
            });
            world.afterEvents.explosion.subscribe((ev) => { if (this.active) this.events.emit("afterExplosion", ev); });
            world.beforeEvents.explosion.subscribe((ev) => { if (this.active) this.events.emit("beforeExplosion", ev); });

            //f

            //g

            //h

            //i
            world.afterEvents.itemCompleteUse.subscribe((ev) => { if (this.active) this.events.emit("itemCompleteUse", ev); });
            world.afterEvents.itemDefinitionEvent.subscribe((ev) => { if (this.active) this.events.emit("afterItemDefinitionEvent", ev); });
            world.beforeEvents.itemDefinitionEvent.subscribe((ev) => { if (this.active) this.events.emit("beforeItemDefinitionEvent", ev); });
            world.afterEvents.itemReleaseUse.subscribe((ev) => { if (this.active) this.events.emit("itemReleaseUse", ev); });
            world.afterEvents.itemStartUse.subscribe((ev) => { if (this.active) this.events.emit("itemStartUse", ev); });
            world.afterEvents.itemStartUseOn.subscribe((ev) => { if (this.active) this.events.emit("itemStartUseOn", ev); });
            world.afterEvents.itemStopUse.subscribe((ev) => { if (this.active) this.events.emit("itemStopUse", ev); });
            world.afterEvents.itemStopUseOn.subscribe((ev) => { if (this.active) this.events.emit("itemStopUseOn", ev); });
            world.afterEvents.itemUse.subscribe((ev) => {
                if (!this.active) return;
                const { source: player } = ev;
                if (player instanceof Player) player.wavArmTime = Date.now();
                this.events.emit("afterItemUse", ev);
            });
            world.beforeEvents.itemUse.subscribe((ev) => { if (this.active) this.events.emit("beforeItemUse", ev); });
            world.afterEvents.itemUseOn.subscribe((ev) => {
                if (!this.active) return;
                const { source: player } = ev;
                if (player instanceof Player) player.wavArmTime = Date.now();
                this.events.emit("afterItemUseOn", ev);
            });
            world.beforeEvents.itemUseOn.subscribe((ev) => { if (this.active) this.events.emit("beforeItemUseOn", ev); });

            //j

            //k

            //l
            world.afterEvents.leverAction.subscribe((ev) => { if (this.active) this.events.emit("leverAction", ev); });

            //m
            world.afterEvents.messageReceive.subscribe((ev) => { if (this.active) this.events.emit("messageReceive", ev); });

            //n

            //o

            //p
            world.afterEvents.pistonActivate.subscribe((ev) => { if (this.active) this.events.emit("pistonActivate", ev); });
            world.afterEvents.playerBreakBlock.subscribe((ev) => {
                if (!this.active) return;
                const { player } = ev;
                player.wavArmTime = Date.now();
                this.events.emit("afterPlayerBreakBlock", ev);
            });
            world.beforeEvents.playerBreakBlock.subscribe((ev) => { if (this.active) this.events.emit("beforePlayerBreakBlock", ev); });
            world.afterEvents.playerDimensionChange.subscribe((ev) => { if (this.active) this.events.emit("afterPlayerDimensionChage", ev); });
            world.afterEvents.playerInteractWithBlock.subscribe((ev) => { if (this.active) this.events.emit("afterPlayerInteractWithBlock", ev); });
            world.beforeEvents.playerInteractWithBlock.subscribe((ev) => { if (this.active) this.events.emit("beforePlayerInteractWithBlock", ev); });
            world.afterEvents.playerInteractWithEntity.subscribe((ev) => { if (this.active) this.events.emit("afterPlayerInteractWithEntity", ev); });
            world.beforeEvents.playerInteractWithEntity.subscribe((ev) => { if (this.active) this.events.emit("beforePlayerInteractWithEntity", ev); });
            world.afterEvents.playerJoin.subscribe((ev) => { if (this.active) this.events.emit("playerJoin", ev); });
            world.afterEvents.playerLeave.subscribe((ev) => { if (this.active) this.events.emit("afterPlayerLeave", ev); });
            world.beforeEvents.playerLeave.subscribe((ev) => { if (this.active) this.events.emit("beforePlayerLeave", ev); });
            world.afterEvents.playerPlaceBlock.subscribe((ev) => {
                if (!this.active) return;
                const { player } = ev;
                player.wavArmTime = Date.now();
                this.events.emit("afterPlayerPlaceBlock", ev);
            });
            world.beforeEvents.playerPlaceBlock.subscribe((ev) => { if (this.active) this.events.emit("beforePlayerPlaceBlock", ev); });
            world.afterEvents.playerSpawn.subscribe((ev) => { if (this.active) this.events.emit("playerSpawn", ev); });
            world.afterEvents.pressurePlatePop.subscribe((ev) => { if (this.active) this.events.emit("pressurePlatePop", ev); });
            world.afterEvents.pressurePlatePush.subscribe((ev) => { if (this.active) this.events.emit("pressurePlatePush", ev); });
            world.afterEvents.projectileHitBlock.subscribe((ev) => { if (this.active) this.events.emit("projectileHitBlock", ev); });
            world.afterEvents.projectileHitEntity.subscribe((ev) => { if (this.active) this.events.emit("projectileHitEntity", ev); });

            //q

            //r

            //s
            system.afterEvents.scriptEventReceive.subscribe((ev) => {
                if (!this.active) return;
                const { id, sourceEntity: entity } = ev;
                if (id === "action:attack" && entity instanceof Player && Date.now() - (entity.wavArmTime ?? -Infinity) > 210) this.events.emit("playerAttack", { player: entity });
                else this.events.emit("scriptEventReceive", ev);
            });

            //t
            world.afterEvents.targetBlockHit.subscribe((ev) => { if (this.active) this.events.emit("targetBlockHit", ev); });
            let tickData = { currentTick: 0, deltaTime: 0.05, tps: 20 }, lastTickDate = Date.now(), avgDeltaTime = [];
            system.runInterval(() => {
                if (!this.active) return;
                if (tickData.currentTick > 2) {
                    tickData.deltaTime = (Date.now() - lastTickDate) / 1000;
                    avgDeltaTime.push(tickData.deltaTime);
                    if (avgDeltaTime.length > 20) avgDeltaTime.shift();
                    tickData.tps = Math.round((1 / (avgDeltaTime.reduce((v, t) => { return v + t; }, 0) / avgDeltaTime.length)) * 100) / 100;
                    this.cache.tpsShard.push(tickData.tps);
                    if (this.cache.tpsShard.length > 50) this.cache.tpsShard.shift();
                }
                lastTickDate = Date.now();

                this.events.emit("tick", tickData);

                tickData.currentTick++;

            }, 1);
            world.afterEvents.tripWireTrip.subscribe((ev) => { if (this.active) this.events.emit("tripWireTrip", ev); });

            //u

            //v

            //w
            world.afterEvents.weatherChange.subscribe((ev) => { if (this.active) this.events.emit("weatherChange", ev); });
            world.afterEvents.worldInitialize.subscribe((ev) => { if (this.active) this.events.emit("worldInitialize", ev); });
            system.beforeEvents.watchdogTerminate.subscribe((ev) => { if (this.active) this.events.emit("watchdogTerminate", ev); });

            //x

            //y

            //z


            //special
            system.runTimeout(() => {
                this.events.emit("ready", {});
                system.runTimeout(() => this.active = true, 1);
            }, 1);

            this.formatter.set("guildChat", ([id, message]) => {
                const account = this.accounts.get(id);
                const name = account.name;
                const guild = account.guild;
                const tag = guild.owner.id === id ? "§bowner§r" : "§amember§r";
                return `[${tag}] ${name}§r >> ${message}§r`;
            });

            this.formatter.set("sendChat", ([id, message]) => {
                const account = this.accounts.get(id);
                return `§2| §6${account.name} §g>>§r ${message}`;
            })
        } catch (e) {
            this.logger.error(e, e.stack);
        }
    };
}

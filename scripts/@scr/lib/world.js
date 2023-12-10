import { world, system, Player } from "@minecraft/server";
import { EventEmitter } from "./events";
import { Logger } from "./log";
import { Formatter } from "./format";
import { CommandManager } from "./commands";
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
            world.afterEvents.blockExplode.subscribe((ev) => { if (this.active) this.events.emit("afterBlockExplode", ev); });
            world.afterEvents.buttonPush.subscribe((ev) => { if (this.active) this.events.emit("afterButtonPush", ev); });

            // c
            world.afterEvents.chatSend.subscribe((ev) => { if (this.active) this.events.emit("afterChatSend", ev); });
            world.beforeEvents.chatSend.subscribe((ev) => {
                if (!this.active) return;
                const { sender } = ev;
                if (ev.message.startsWith("!")) {
                    ev.cancel = true;
                    const [commandName, ...args] = ev.message.trim().slice(config.commands.prefix.length).trim().split(/ +/);
                    if (!commandName) return;
                    this.events.emit("afterSendCustomCommand", { sender: sender, commandName: commandName, message: args.length === 0 ? undefined : args.join(" ") });
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
            world.afterEvents.dataDrivenEntityTriggerEvent.subscribe((ev) => { if (this.active) this.events.emit("afterDataDrivenEntityTriggerEvent", ev); });
            world.beforeEvents.dataDrivenEntityTriggerEvent.subscribe((ev) => { if (this.active) this.events.emit("beforeDataDrivenEntityTriggerEvent", ev); });

            //e
            world.afterEvents.effectAdd.subscribe((ev) => { if (this.active) this.events.emit("afterEffectAdd", ev); });
            world.afterEvents.entityDie.subscribe((ev) => { if (this.active) this.events.emit("afterEntityDie", ev); });
            world.afterEvents.entityHealthChanged.subscribe((ev) => { if (this.active) this.events.emit("afterEntityHealthChanged", ev); });
            world.afterEvents.entityHitBlock.subscribe((ev) => { if (this.active) this.events.emit("afterEntityHitBlock", ev); });
            world.afterEvents.entityHitEntity.subscribe((ev) => { if (this.active) this.events.emit("afterEntityHitEntity", ev); });
            world.afterEvents.entityHurt.subscribe((ev) => { if (this.active) this.events.emit("afterEntityHurt", ev); });
            world.afterEvents.entityLoad.subscribe((ev) => { if (this.active) this.events.emit("afterEntityLoad", ev); });
            world.afterEvents.entityRemove.subscribe((ev) => { if (this.active) this.events.emit("afterEntityRemove", ev); });
            world.beforeEvents.entityRemove.subscribe((ev) => { if (this.active) this.events.emit("beforeEntityRemove", ev); });
            world.afterEvents.entitySpawn.subscribe((ev) => {
                if (!this.active) return;
                const { entity } = ev;

                if (entity.typeId === "minecraft:item") for (let player of this.getPlayers()) {
                    const maxDistance = Math.max(player.fallDistance * 0.25, 1.62);
                    for (let item of player.dimension.getEntities({ location: player.getHeadLocation(), maxDistance: Math.min(maxDistance, 4) })) {
                        if (item.id === entity.id) {
                            player.wavArmTime = Date.now();
                        }
                    }
                }

                this.events.emit("afterEntitySpawn", ev);
            });
            world.afterEvents.explosion.subscribe((ev) => { if (this.active) this.events.emit("afterExplosion", ev); });
            world.beforeEvents.explosion.subscribe((ev) => { if (this.active) this.events.emit("beforeExplosion", ev); });

            //f

            //g

            //h

            //i
            world.afterEvents.itemCompleteUse.subscribe((ev) => { if (this.active) this.events.emit("afterItemCompleteUse", ev); });
            world.afterEvents.itemDefinitionEvent.subscribe((ev) => { if (this.active) this.events.emit("afterItemDefinitionEvent", ev); });
            world.beforeEvents.itemDefinitionEvent.subscribe((ev) => { if (this.active) this.events.emit("beforeItemDefinitionEvent", ev); });
            world.afterEvents.itemReleaseUse.subscribe((ev) => { if (this.active) this.events.emit("afterItemReleaseUse", ev); });
            world.afterEvents.itemStartUse.subscribe((ev) => { if (this.active) this.events.emit("afterItemStartUse", ev); });
            world.afterEvents.itemStartUseOn.subscribe((ev) => { if (this.active) this.events.emit("afterItemStartUseOn", ev); });
            world.afterEvents.itemStopUse.subscribe((ev) => { if (this.active) this.events.emit("afterItemStopUse", ev); });
            world.afterEvents.itemStopUseOn.subscribe((ev) => { if (this.active) this.events.emit("afterItemStopUseOn", ev); });
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
            world.afterEvents.leverAction.subscribe((ev) => { if (this.active) this.events.emit("afterLeverAction", ev); });

            //m
            world.afterEvents.messageReceive.subscribe((ev) => { if (this.active) this.events.emit("afterMessageReceive", ev); });

            //n

            //o

            //p
            world.afterEvents.pistonActivate.subscribe((ev) => { if (this.active) this.events.emit("afterPistonActivate", ev); });
            world.beforeEvents.pistonActivate.subscribe((ev) => { if (this.active) this.events.emit("beforePistonActivate", ev); });
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
            world.afterEvents.playerJoin.subscribe((ev) => { if (this.active) this.events.emit("afterPlayerJoin", ev); });
            world.afterEvents.playerLeave.subscribe((ev) => { if (this.active) this.events.emit("afterPlayerLeave", ev); });
            world.beforeEvents.playerLeave.subscribe((ev) => { if (this.active) this.events.emit("beforePlayerLeave", ev); });
            world.afterEvents.playerPlaceBlock.subscribe((ev) => {
                if (!this.active) return;
                const { player } = ev;
                player.wavArmTime = Date.now();
                this.events.emit("afterPlayerPlaceBlock", ev);
            });
            world.beforeEvents.playerPlaceBlock.subscribe((ev) => { if (this.active) this.events.emit("beforePlayerPlaceBlock", ev); });
            world.afterEvents.playerSpawn.subscribe((ev) => { if (this.active) this.events.emit("afterPlayerSpawn", ev); });
            world.afterEvents.pressurePlatePop.subscribe((ev) => { if (this.active) this.events.emit("afterPressurePlatePop", ev); });
            world.afterEvents.pressurePlatePush.subscribe((ev) => { if (this.active) this.events.emit("afterPressurePlatePush", ev); });
            world.afterEvents.projectileHitBlock.subscribe((ev) => { if (this.active) this.events.emit("afterProjectileHitBlock", ev); });
            world.afterEvents.projectileHitEntity.subscribe((ev) => { if (this.active) this.events.emit("afterProjectileHitEntity", ev); });

            //q

            //r

            //s
            system.afterEvents.scriptEventReceive.subscribe((ev) => {
                if (!this.active) return;
                const { id, sourceEntity: entity } = ev;
                if (id === "action:attack" && entity instanceof Player && Date.now() - (entity.wavArmTime ?? -Infinity) > 210) this.events.emit("afterPlayerAttack", { player: entity });
                else this.events.emit("afterScriptEventReceive", ev);
            });

            //t
            world.afterEvents.targetBlockHit.subscribe((ev) => { if (this.active) this.events.emit("afterTargetBlockHit", ev); });
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
            world.afterEvents.tripWireTrip.subscribe((ev) => { if (this.active) this.events.emit("afterTripWireTrip", ev); });

            //u

            //v

            //w
            world.afterEvents.weatherChange.subscribe((ev) => { if (this.active) this.events.emit("afterWeatherChange", ev); });
            world.afterEvents.worldInitialize.subscribe((ev) => { if (this.active) this.events.emit("afterWorldInitialize", ev); });
            system.beforeEvents.watchdogTerminate.subscribe((ev) => { if (this.active) this.events.emit("afterWatchdogTerminate", ev); });

            //x

            //y

            //z


            //special
            system.runTimeout(() => {
                this.events.emit("ready", {});
                system.runTimeout(() => this.active = true, 1);
            }, 1);
        } catch (e) {
            this.logger.error(e, e.stack);
        }
    };
}

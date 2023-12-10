import { Player, system, world } from "../../../@scr/world";
import { MainDB } from "../../database";
import { parseTime, timeToMs } from "../formatter";
import { notify } from "../utils";
import { Vec3 } from "../vec3";

/**
 * @beta
 * @author yuki2825624
 */
export class PlayerHandler {
    /** @param {Player} player  */
    constructor(player) {
        this.player = player;
    }

    /** @param {{ reason: string, time: string }} option  */
    timeout(option = {}) {
        try {
            const { reason = "No reason given", time = NaN } = option;
            const { player } = this;
            const playerTimeout = MainDB.get("timeout");
            const timeoutTime = timeToMs(time);
            const value = {
                reason: reason,
                time: timeoutTime > 0 ? timeoutTime + Date.now() : null
            }
            playerTimeout.set(player.distId, value);
            const forTime = Number.isNaN(time) ? "" : ` for ${parseTime(time)}`;
            notify(`${player.name} has been timeouted${forTime}.`);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    untimeout() {
        try {
            const { player } = this;
            const playerTimeout = MainDB.get("timeout");
            playerTimeout.delete(player.distId);
            notify(`${player.name} has been untimeouted.`);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    /** @param {{ reason: string, time: string }} option */
    freeze(option = {}) {
        try {
            const { reason = "No reason given", time = NaN } = option;
            const { player } = this;
            const playerFreeze = MainDB.get("freeze");
            const freezeTime = timeToMs(time);
            const value = {
                reason: reason,
                time: freezeTime > 0 ? freezeTime + Date.now() : null,
                dimensionId: player.dimension.id,
                location: Vec3.from(player.location).fixed(2).toString(),
                rotation: Vec3.from(player.getRotation()).fixed(2).toString(),
                slot: player.selectedSlot
            }
            playerFreeze.set(player.distId, value)
            notify(`${player.name} has been freezed.`);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    unfreeze() {
        try {
            const { player } = this;
            const playerFreeze = MainDB.get("freeze");
            playerFreeze.delete(player.distId);
            player.runCommandAsync("inputpermission set @s movement enabled");
            player.runCommandAsync("inputpermission set @s camera enabled");
            notify(`${player.name} has been unfreezed.`);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    /** @param {{ reason: string }} option */
    disconnect(option = {}) {
        try {
            const { reason = "No reason given" } = option;
            const { player } = this;
            const playerDisconnect = MainDB.get("disconnect");
            playerDisconnect.set(player.distId, { reason });
            player.triggerEvent("disconnect");
            notify(`${player.name} has been disconnected.`);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    /** @param {{ message: string, reason?: string }} option  */
    kick(option = {}) {
        try {
            const { message = "No message given", reason = "No Reason given" } = option;
            const { player } = this;
            const playerKick = MainDB.get("kick");
            playerKick.set(player.distId, { reason });
            player.runCommandAsync(`kick "${player.name}" \n${message}\nReason: ${reason}`);
            notify(`${player.name} has been kicked.`);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    /** @param {{ message: string, reason: string, time: string }} option  */
    ban(option = {}) {
        try {
            const { message = "No message given", reason = "No Reason given", time = NaN } = option;
            const { player } = this;
            const playerBan = MainDB.get("ban");
            const banTime = timeToMs(time);
            const value = {
                reason: reason,
                time: banTime > 0 ? banTime + Date.now() : null
            }
            playerBan.set(player.distId, value);
            player.runCommandAsync(`kick "${player.name}" \n${message}\nReason: ${reason}\nTime: ${parseTime(time) ?? "will not unban"}`);
            const forTime = Number.isNaN(time) ? "" : ` for ${parseTime(time)}`;
            notify(`${player.name} has been banned${forTime}.`);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    unban() {
        try {
            const { player } = this;
            const playerBan = MainDB.get("ban");
            playerBan.delete(player.distId);
            notify(`${player.name} has been unbanned.`);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    static load () {
        try { 
            const playerFreeze = MainDB.get("freeze");
            world.events.on("tick", (ev) => {
                const { currentTick } = ev;
                const object = JSON.stringify([ ...playerFreeze ]);
                world.logger.log(object);
                for (let player of world.getPlayers()) {
                    world.logger.debug(playerFreeze.get(player.distId));
                    if (playerFreeze.has(player.distId)) {
                        world.logger.debug(`${player.name} has been freezed.`);
                        const { dimensionId, location, rotation, slot } = playerFreeze.get(player.distId);
                        player.teleport(Vec3.from(location), { rotation: Vec3.from(rotation), dimension: world.getDimension(dimensionId) });
                        player.selectedSlot = slot;
                        if (currentTick % 2 === 0) {
                            player.runCommandAsync("inputpermission set @s movement disabled");
                            player.runCommandAsync("inputpermission set @s camera disabled");
                        }
                    }
                }
            })
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }
}

PlayerHandler.load();
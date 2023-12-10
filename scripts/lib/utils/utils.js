import { world } from "../../@scr/world";
export * from "./cdate/index"

/**
 * @beta
 * @author yuki2825624
 */
export const random = Object.freeze({
    random() {
        return Math.random();
    },
    randint(min, max) {
        return Math.floor(Math.random() * (max + 1 - min) + min);
    },
    /**
     * @template {any} T
     * @param {T[]} array
     * @returns {T}
     */
    choice(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
});

/**
 * @beta
 * @author yuki2825624
 * @param {string} message 
 */
export const notify = (message) => {
    try {
        for (let player of world.getPlayers({ tags: ["notify"] })) {
            player.sendMessage(`§a[Notify]§r ${message}`);
        }
    } catch (e) {
        world.logger.error(e, e.stack);
    }
}

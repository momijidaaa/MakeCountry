import { world } from "../../@scr/world";

/**
 * @beta
 * @author yuki2825624
 * @param {string} id 
 * @param {string} prefix 
 * @returns {string}
 * @input stone
 * @output minecraft:stone
 */
export const parseId = (id = "", prefix = "minecraft:") => {
    return id.startsWith(prefix) ? id : prefix + id;
}

/**
 * @beta
 * @author yuki2825624
 * @param {number} int
 * @returns {string}
 * @input 1024
 * @output 1KB
 */
export const bytes = (byte) => {
    try {
        if (byte <= 0) return "0 byte";
        if (byte === 1) return "1 byte";
        const units = ["bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB", "RB", "QB"];
        let index = 0;
        while (byte >= 1024 && index < units.length - 1) {
            byte /= 1024;
            index++;
        }
        const unit = units[index];
        return `${unit === "bytes" ? byte : byte.toFixed(2)} ${unit}`;
    } catch (e) {
        world.logger.error(e, e.stack);
    }
}

/**
 * @beta
 * @author yuki2825624
 * @param {number} int
 * @returns {string}
 * @input 10s
 * @output 10000
 */
export function timeToMs(input) {
    try {
        if (typeof input !== "string") return null;
        if (!Number.isNaN(Number(input))) return Number(input);
        const time = Number(String(input).slice(0, -1));
        if (Number.isNaN(time)) return null;
        const units = { s: 1000, m: 1000 * 60, h: 1000 * 60 * 60, d: 1000 * 60 * 60 * 24, y: 1000 * 60 * 60 * 24 * 356 }; // 追加: 年単位のミリ秒値
        const unit = String(input).slice(-1);
        return units[unit] ? time * units[unit] : null;
    } catch (e) {
        world.logger.error(e, e.stack);
    }
}

/**
 * @beta
 * @author yuki2825624
 * @param {number} int 
 * @returns {string}
 * @input 10000
 * @output 10s
 */
export function msToTime(int) {
    try {
        if (typeof int !== "number" || Number.isNaN(int)) return null;
        if (int <= 0) return "0s";
        const seconds = Math.floor((int / 1000) % 60);
        const minutes = Math.floor((int / (1000 * 60)) % 60);
        const hours = Math.floor((int / (1000 * 60 * 60)) % 24);
        const days = Math.floor(int / (1000 * 60 * 60 * 24));
        const years = Math.floor(int / (1000 * 60 * 60 * 24 * 365));

        const times = [];
        if (years > 0) times.push(`${years}y`);
        if (days > 0) times.push(`${days}d`);
        if (hours > 0) times.push(`${hours}h`);
        if (minutes > 0) times.push(`${minutes}m`);
        if (seconds > 0) times.push(`${seconds}s`);

        return times.join(" ");
    } catch (e) {
        world.logger.error(e, e.stack);
    }
}

/**
 * @beta
 * @author yuki2825624
 * @param {string} input 
 * @returns {string}
 * @input 100s
 * @output 1m 40s
 */
export const parseTime = (input) => msToTime(timeToMs(input));
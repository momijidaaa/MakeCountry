import { world } from "../world";

export class Formatter {
    #formatter;
    constructor() {
        this.#formatter = {};
    }

    /**
     * 
     * @param {string} formatName 
     * @param {(input: string[]) => string} callback 
     */
    set(formatName, callback) {
        this.#formatter[formatName] = callback;
    }

    /**
     * 
     * @param {string} formatName 
     * @param {string[]} input 
     * @returns {string}
     */
    get(formatName, input) {
        if (!Array.isArray(input)) throw TypeError("input is not a Array");
        const callback = this.#formatter[formatName];
        if (typeof callback === "function") {
            return callback(input.map(String));
        } else {
            world.logger.warn(`${formatName} is not a formatter`);
            return input;
        }
    }
}
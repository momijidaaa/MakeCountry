import { world } from "@minecraft/server";
const startId = "DyProp_"

/**
 * 
 * @param {String} id
 * @param {String|undefined} value
 */
export function setDynamicProperty(id, value = undefined) {
    const pattern = `DyProp_${id}_dy`;
    if (typeof value !== 'string') {
        console.warn("Input must be a string");
        return;
    }

    const existingKeys = [];
    for (let i = 0; i < 10000; i++) {
        const test = world.getDynamicProperty(`${pattern}${i}`);
        if (!test) break;
        existingKeys.push(i);
    }

    // Clear existing properties
    if (!value) {
        for (let i = 0; i < existingKeys.length; i++) {
            world.setDynamicProperty(`${pattern}${i}`, undefined);
        };
        return;
    };

    const chunkSize = 20000;

    const newValueLength = Math.ceil(value.length / chunkSize);
    for (let i = 0; i < Math.max(existingKeys.length, newValueLength); i++) {
        if (i <= newValueLength) {
            world.setDynamicProperty(`${pattern}${i}`, value.substring(i * chunkSize, (i + 1) * chunkSize));
            continue;
        };
        world.setDynamicProperty(`${pattern}${i}`, undefined);
    };
};

/**
 *
 * @param {String} id
 * @returns {string|undefined}
 */
export function getDynamicProperty(id) {
    const matches = [];
    const pattern = `DyProp_${id}_dy`;
    for (let i = 0; i < 10000; i++) {
        const test = world.getDynamicProperty(`${pattern}${i}`);
        if (!test) break;
        matches.push(test);
    }
    return matches.length > 0 ? matches.join('') : undefined;
};

/**
 * 
 * @returns {Array<string>}
 */
export function DynamicPropertyIds() {
    const inputArray = world.getDynamicPropertyIds();
    const pattern = /^DyProp_(.+)_dy\d+$/;
    const result = new Set();

    inputArray.forEach(item => {
        const match = item.match(pattern);
        if (match) {
            result.add(match[1]);
        }
    });

    return Array.from(result);
};
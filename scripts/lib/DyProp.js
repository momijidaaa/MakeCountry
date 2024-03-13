import { world } from "@minecraft/server";
const startId = "DyProp_"

/**
 * DyProp save string data to ID
 * @param {String} id DyProp ID
 * @param {String|undefined} value DyProp string data
 */
export async function set(id, value) {
    world.getDynamicPropertyIds().filter(id => id.startsWith(`${startId}${id}_`)).forEach(a => world.setDynamicProperty(a));
    if(!value) return;
    let i = 0;
    while (true) {
        const ObjectId = `${startId}${id}_${i}`;
        const Object = !world.getDynamicProperty(ObjectId) ? [] : JSON.parse(world.getDynamicProperty(ObjectId));

        Object.push(value);
        try {
            world.setDynamicProperty(ObjectId, JSON.stringify(Object));
            break;
        } catch {
            i++;
            continue;
        };
    };
};

/**
 * DyProp get string data for ID
 * @param {String} id Dyprop ID
 * @returns {Array} Array data
 */
export async function get(id) {
    let array = [];
    let i = 0;
    while (true) {
        const ObjectId = `${startId}${id}_${i}`;

        if (world.getDynamicProperty(ObjectId) === undefined) break;

        const Object = world.getDynamicProperty(ObjectId);

        array.push(Object);
        i++;
    };
    if (array.length === 0) return undefined
    return array.join(``);
};

/**
 * DyProp get all ID
 * @returns {Array} Array IDs data
 */
export async function getIds() {
    let ids = JSON.parse(JSON.stringify(world.getDynamicPropertyIds()));
    let array = [];
    let i = 0;

    test: while (true) {
        if (ids.length === 0) break;
        for (const id of ids) {
            if (id.startsWith(startId) && id.endsWith(`_${i}`)) {
                const item = id.replace(startId, "").replace(`_${i}`);
                if (!array.includes(item)) {
                    array.push(item);
                    ids.splice(ids.indexOf(id), 1);
                };
            }
        };

        i++;
    };

    return array;
};
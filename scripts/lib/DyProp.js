import { world } from "@minecraft/server";
const startId = "DyProp_"

/**
 * 
 * @param {String} id
 * @param {String|undefined} value
 */
export function setDynamicProperty(id, value = undefined) {
    world.getDynamicPropertyIds().filter(id => id.startsWith(`${startId}${id}_dy`)).forEach(a => world.setDynamicProperty(a));
    if (!value) return;
    const chunkSize = 20000
    if (typeof value !== 'string') {
        console.warn("Input must be a string");
        return;
    };
    for (let i = 0; i < value.length; i += chunkSize) {
        const ObjectId = `${startId}${id}_dy${i}`;
        world.setDynamicProperty(ObjectId, value.substring(i, i + chunkSize));
    };
};

/**
 *
 * @param {String} id
 * @returns {string|undefined}
 */
export function getDynamicProperty(id) {
    let array = [];
    let i = 0;
    while (true) {
        const ObjectId = `${startId}${id}_dy${i}`;

        if (world.getDynamicProperty(ObjectId) === undefined) break;

        const Object = world.getDynamicProperty(ObjectId);

        array.push(Object);
        i++;
    };
    if (array.length === 0) return undefined
    return array.join(``);
};

/**
 * 
 * @returns {Array<string>}
 */
export function DynamicPropertyIds() {
    const inputArray = world.getDynamicPropertyIds();
    //正規表現パターンを作成
    const pattern = /^DyProp_(.+)_dy\d+$/;
    const result = new Set();

    //フィルタリング＆抽出
    inputArray.forEach(item => {
        const match = item.match(pattern);
        if (match) {
            result.add(match[1]);
        }
    });

    //配列変換
    return Array.from(result);
};
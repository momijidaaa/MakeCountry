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
    let inputArray = world.getDynamicPropertyIds();
    const pattern = new RegExp(`^DyProp_${id}_dy(\\d+)$`);
    const matches = inputArray
        .map(item => {
            const match = item.match(pattern);
            return match ? { original: item, index: parseInt(match[1], 10) } : null;
        })
        .filter(item => item !== null)
        .sort((a, b) => a.index - b.index);
    let longString = ``;
    matches.map(item => item.original).forEach(id => {
        longString = longString + world.getDynamicProperty(id);
    });
    return longString;
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
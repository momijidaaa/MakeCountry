import { world } from "@minecraft/server";
const startId = "DyProp_"

/**
 * 
 * @param {String} id
 * @param {String|undefined} value
 */
export function setDynamicProperty(id, value = undefined) {
    const pattern = `DyProp_${id}_dy`;
    for(let i = 0;i < 10000;i++) {
        const test = world.getDynamicProperty(`${pattern}${i}`);
        if(!test) break;
        if(test) {
            world.setDynamicProperty(`${pattern}${i}`)
        };
    };
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
    const matches = [];
    const pattern = `DyProp_${id}_dy`;
    for(let i = 0;i < 10000;i++) {
        const test = world.getDynamicProperty(`${pattern}${i}`);
        if(!test) break;
        if(test) {
            matches.push(test);
        };
    };
    if(matches.length == 0) return undefined;
    let longString = ``;
    longString = matches.join(``);
    if(longString.length == 0) return undefined;
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
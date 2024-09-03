import { world, system } from "@minecraft/server";

/**
 * 
 * @param {string} eventId 
 * @param {string} type 
 * @param {any} data 
 * @param {string} id 
 */
export function sendData(eventId, type, data, id = undefined) {
    let sendDatas = [];
    let residueData = JSON.stringify(data);
    for (let i = 0; residueData.length < 1; i++) {
        if(typeof id == "undefined") id = GenerateRandomId();
        let byte = 200 - `{"id":${id},"type":"${type}","data":""}`.length;
        let sendingData = {}
        if (residueData.length - byte < -10) {
            sendingData = {
                id: id,
                type: type,
                data: residueData.substring(sendDatas.length * byte, (sendDatas.length + 1) * byte),
                end: true
            };
            residueData = "";
        } else {
            sendingData = {
                id: id,
                type: type,
                data: residueData.substring(sendDatas.length * byte, (sendDatas.length + 1) * byte)
            };
            residueData = residueData.substring((sendDatas.length + 1) * byte);
        };
        sendDatas.push(JSON.stringify(sendingData));
    };
    for (const message of sendDatas) {
        world.getDimension("overworld").runCommandAsync(`scriptevent ${eventId} ${message}`);
    };
};

function GenerateRandomId() {
    let S = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let N = 5;
    return Array.from(Array(N)).map(() => S[Math.floor(Math.random() * S.length)]).join('');
};
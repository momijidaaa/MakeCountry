import { Player, system, world } from "@minecraft/server";
import * as DyProp from "../../lib/DyProp";
import { executeCommand, sendGetPlayerAction } from "./bds_enhancer";
import { ActionFormData, FormCancelationReason, ModalFormData } from "@minecraft/server-ui";
import { http, HttpHeader, HttpRequest, HttpRequestMethod } from "@minecraft/server-net";

let bans = {};
const muteList = [];
const unmuteList = [];

world.afterEvents.worldInitialize.subscribe(async () => {
    const result = await http.get(`http://localhost:20990/getall`);
    const data = JSON.parse(result.body).data;
    bans = { ...bans, ...data };
});

class BanManager {
    constructor(dyprop) {
        this.dyprop = dyprop;
        this.loadData();
    }

    loadData() {
        this.banList = JSON.parse(this.dyprop.getDynamicProperty("banList") ?? "[]") || [];
        this.playerData = JSON.parse(this.dyprop.getDynamicProperty("playerData") ?? "{}") || {};
    }

    saveData() {
        this.dyprop.setDynamicProperty("banList", JSON.stringify(this.banList));
        this.dyprop.setDynamicProperty("playerData", JSON.stringify(this.playerData));
    }

    addData(name, xuid, deviceId) {
        let existingEntry = Object.entries(this.playerData).find(([key, data]) => data.xuid === xuid);

        if (existingEntry) {
            let [oldName, data] = existingEntry;
            if (oldName !== name) {
                delete this.playerData[oldName];
                this.playerData[name] = data;
            }
            console.log(JSON.stringify(deviceId))
            data.deviceId = data.deviceId.filter(Boolean);
            if (!data.deviceId.includes(deviceId)) {
                data.deviceId.push(deviceId);
            }
        } else {
            this.playerData[name] = { xuid, deviceId: [deviceId] };
        }
        this.saveData();
    }

    ban(name, xuid = null, deviceId = null) {
        let deviceIds = deviceId ? [deviceId] : [];
        if (this.playerData[name]) {
            let data = this.playerData[name];
            xuid = xuid || data.xuid;
            deviceIds = [...new Set([...deviceIds, ...data.deviceId])];
        }

        for (let ban of this.banList) {
            if (ban.xuid === xuid || ban.deviceId.some(id => deviceIds.includes(id))) {
                deviceIds = [...new Set([...deviceIds, ...ban.deviceId])];
                ban.deviceId = deviceIds;
            }
        }

        this.banList.push({ name, xuid, deviceId: deviceIds });
        this.saveData();
    }

    unban(name) {
        this.banList = this.banList.filter(ban => ban.name !== name);
        this.saveData();
    }

    isBan(name, xuid = null, deviceId = null) {
        return this.banList.some(ban =>
            ban.name === name ||
            ban.xuid === xuid ||
            (deviceId && ban.deviceId.includes(deviceId))
        );
    }

    banlist() {
        return this.banList;
    }

    getPlayerInfo(name) {
        return this.playerData[name] || null;
    }
}

const banManager = new BanManager(DyProp);

system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const { id, message } = ev;
    if (id != "system:playerinfo") return;
    /**
     * @type {{"deviceId": string , "id": string , "xuid": string, "name": string }}}
     */
    const data = JSON.parse(message);
    const player = world.getPlayers().find(p => p.id == data.id);
    if (!player) return;
    system.runTimeout(async () => {
        const savePlayerData = { xuid: data.xuid, id: data.id, deviceId: [data.deviceId] };
        /**
         * @type {{ "deviceId": [string] , "id": string , "xuid": string }}
         */
        banManager.addData(player.name, savePlayerData.xuid, data.deviceId);

        const isGBan = isGBAN(savePlayerData.xuid, savePlayerData.deviceId, player.name);
        if (isGBan) {
            player.runCommand(`kick "${savePlayerData.xuid}" §c§lあなたはGlobalBANされています\nReason: ${data.deviceId}のデバイスからの接続を拒否しました`);
            world.sendMessage(`§a§l[KaronNetWork GlobalBAN System]\n§r§7${player.name} §r§7はGlobalBANされています`);
            return;
        };

        const isBan = banManager.isBan(player.name, savePlayerData.xuid, data.deviceId);
        if (isBan) {
            player.runCommand(`kick "${savePlayerData.xuid}" §c§lあなたはBANされています\n${data.deviceId}のデバイスからの接続を拒否しました`);
            world.sendMessage(`§a§l[KaronNetWork BAN System]\n§r§7${player.name} §r§7はBANされています`);
            return;
        };

        if (muteList.includes(`${player.name}`)) {
            player.setDynamicProperty(`isMute`, true);
        };
        if (unmuteList.includes(`${player.name}`) && player.getDynamicProperty(`isMute`)) {
            player.setDynamicProperty(`isMute`);
        };
        player.removeTag('checking');
    }, 3);
});

world.afterEvents.itemUse.subscribe((ev) => {
    const { itemStack, source } = ev;
    if (!source.hasTag('moderator')) return;
    if (itemStack.typeId != 'minecraft:stick') return;
    banMainForm(source);
});

/**
 * 
 * @param {Player} player 
 */
function banMainForm(player) {
    const form = new ActionFormData();
    form.title('BAN Manager');
    form.button('BANする');
    form.button('BANリスト');
    form.show(player).then((rs) => {
        if (rs.canceled) {
            if (rs.cancelationReason == FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    banMainForm(player);
                }, 10);
            };
            return;
        };
        switch (rs.selection) {
            case 0: {
                //新規BAN
                addBanForm(player);
                break;
            };
            case 1: {
                //BANリスト
                banListForm(player);
                break;
            };
        };
    });
};

/**
 * 
 * @param {Player} player 
 */
function banListForm(player) {
    const form = new ActionFormData();
    form.title('BAN List');
    const banPlayers = banManager.banlist();
    if (banPlayers.length == 0) {
        form.body('BAN者はいません');
        form.button('閉じる');
    };
    for (const p of banPlayers) {
        form.button(`${p.name}\n${p.xuid}`);
    };

    form.show(player).then((rs) => {
        if (rs.canceled) {
            if (rs.cancelationReason == FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    banListForm(player);
                }, 10);
            };
            return;
        };
        if (banPlayers.length == 0) return;
        banPlayerInfoForm(player, banPlayers[rs.selection].name);
    });
};

/**
 * 
 * @param {Player} player 
 */
function banPlayerInfoForm(player, name) {
    const form = new ActionFormData();
    form.title(name);
    const info = banManager.getPlayerInfo(name);
    form.body(`名前: ${name}\nXUID: ${info?.xuid}\ndeviceID: [\n${info?.deviceId.join(',\n')}\n]`);
    form.button('戻る');
    form.button('BAN解除');

    form.show(player).then((rs) => {
        if (rs.canceled) {
            if (rs.cancelationReason == FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    banPlayerInfoForm(player, name);
                }, 10);
            };
            return;
        };
        switch (rs.selection) {
            case 0: {
                //戻る
                banListForm(player);
                break;
            };
            case 1: {
                //Unban
                banManager.unban(name);
                player.sendMessage(`§a[BAN]\n§a${name} §r§aのBANを解除しました`)
                break;
            };
        };
    });
};

/**
 * 
 * @param {Player} player 
 */
function addBanForm(player) {
    const form = new ModalFormData();
    form.title('プレイヤーをBAN');
    form.textField('プレイヤー名', 'プレイヤー名を入力してください');
    form.show(player).then((rs) => {
        if (rs.canceled) {
            if (rs.cancelationReason == FormCancelationReason.UserBusy) {
                system.runTimeout(() => {
                    addBanForm(player);
                }, 10);
            };
            return;
        };
        if (rs.formValues[0].replaceAll(' ', '').replaceAll('　', '') == '') {
            player.sendMessage('§cプレイヤー名を入力してください');
            return;
        };
        const playerInfo = banManager.getPlayerInfo(rs.formValues[0]);
        if (playerInfo) {
            banManager.ban(rs.formValues[0], playerInfo.xuid, playerInfo.deviceId[0]);
            player.sendMessage(`§a[BAN]\n§rゲーマータグ: ${rs.formValues[0]}\nXUID: ${playerInfo.xuid}\ndeviceIds: [\n${playerInfo.deviceId.join(',\n')}\n]をBANしました`);
            world.getPlayers({ name: rs.formValues[0] })[0]?.runCommand(`kick "${playerInfo.xuid}" §c§lあなたはBANされました`);
            return;
        } else {
            banManager.ban(rs.formValues[0]);
            player.sendMessage(`§a[BAN]\n§r${rs.formValues[0]} をBANしました`);
            return;
        };
    });
};

function isGBAN(xuid, deviceId, name) {
    const record = bans[xuid];
    if (record) {
        return true;
    };
    for (const key in bans) {
        if (bans[key].devices.includes(deviceId)) {
            return true;
        };
    };

    return false;
};

system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const { id, message } = ev;
    if (id != "system:on_spawn") return;
    system.runTimeout(() => {
        sendGetPlayerAction(message.split('|')[0]);
    }, 5);
});

world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player, initialSpawn } = ev;
    if (!initialSpawn) return;
    executeCommand("listd");
    player.addTag('checking');
    system.runTimeout(() => {
        if (player.hasTag('checking')) {
            player.runCommand('kick @s §c§l認証に失敗しました。もう一度接続を試みてください');
        };
    }, 150);
});
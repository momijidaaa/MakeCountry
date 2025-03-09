import { GameMode, Player, system, world } from "@minecraft/server";
import { http, HttpRequest, HttpHeader, HttpRequestMethod } from "@minecraft/server-net";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId, StringifyAndSavePropertyData } from "../../lib/util";
import * as DyProp from "../../lib/DyProp";

const mcChatChannelId = "1142839504412098692";
const mcLogChannelId = "1272571579376603199";

system.afterEvents.scriptEventReceive.subscribe(async (ev) => {
    switch (ev.id) {
        case 'karo:fullrendering': {
            const ids = DyProp.DynamicPropertyIds().filter(id => id.startsWith(`chunk_`))
            for (let i = 0; i < ids.length; i++) {
                system.runTimeout(async () => {
                    const id = ids[i];
                    /**
                     * @type {{plot: {},countryId: undefined|number}}
                     */
                    const chunkData = GetAndParsePropertyData(id);
                    if (chunkData?.countryId && chunkData?.countryId > 0) {
                        let sendChunksData = [];
                        const [c, x2, z2, d] = chunkData.id.split(`_`);
                        const id = chunkData?.countryId || undefined;
                        sendChunksData.push({
                            dimension: "overworld",
                            id: id ?? 0,
                            x_y: `${x2}_${z2}`
                        });
                        const req2 = new HttpRequest("http://localhost:20006/land");
                        req2.body = JSON.stringify(sendChunksData);
                        req2.method = HttpRequestMethod.Post;
                        req2.headers = [
                            new HttpHeader("Content-Type", "application/json")
                        ];
                        await http.request(req2);
                    };
                }, Math.floor(i / 50));
            };
            break;
        };
    };
});
system.runInterval(async () => {
    try {
        const players = world.getPlayers();
        const sendPlayersData = [];
        const sendChunksData = [];
        for (const player of players) {
            const date = new Date();
            let { x, z } = player.location;
            let invisibility = false;
            if (player.getEffect(`invisibility`) || player.getGameMode() == GameMode.spectator) {
                invisibility = true;
            };

            sendPlayersData.push({
                name: player.name,
                point: {
                    invisibility,
                    name: player.name,
                    dimension: player.dimension.id.split(`:`)[1],
                    x: Math.floor(x),
                    y: Math.floor(z),
                    lastUpdated: date.getTime(),
                }
            })
            if (player.dimension.id !== `minecraft:overworld`) continue;
            const chunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(player));
            const [c, x2, z2, d] = GetPlayerChunkPropertyId(player).split(`_`);
            const id = chunkData?.countryId || undefined;
            sendChunksData.push({
                dimension: player.dimension.id.split(`:`)[1],
                id: id ?? 0,
                x_y: `${x2}_${z2}`
            });
        };
        const req = new HttpRequest("http://localhost:20006/update");
        req.body = JSON.stringify(sendPlayersData);
        req.method = HttpRequestMethod.Post;
        req.headers = [
            new HttpHeader("Content-Type", "application/json")
        ];
        await http.request(req);

        const req2 = new HttpRequest("http://localhost:20006/land");
        req2.body = JSON.stringify(sendChunksData);
        req2.method = HttpRequestMethod.Post;
        req2.headers = [
            new HttpHeader("Content-Type", "application/json")
        ];
        await http.request(req2);
    } catch (error) {
        console.error(`エラー:\n${error}`);
    }
}, 150);

world.afterEvents.worldInitialize.subscribe(async () => {
    const countryIds = DyProp.DynamicPropertyIds().filter(id => id.startsWith(`country_`));
    const countriesData = [];
    for (const id of countryIds) {
        const countryData = GetAndParsePropertyData(id);
        const membersId = countryData.members
        let membersName = [];
        membersId.forEach(member => {
            const memberData = GetAndParsePropertyData(`player_${member}`);
            membersName.push(memberData.name);
        });
        const allianceIds = countryData.alliance;
        let allianceCountryName = [];
        allianceIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            if (subCountryData) {
                allianceCountryName.push(subCountryData.name);
            };
        });
        const hostilityIds = countryData.hostility;
        let hostilityCountryName = [];
        hostilityIds.forEach(id => {
            const subCountryData = GetAndParsePropertyData(`country_${id}`);
            if (subCountryData) {
                hostilityCountryName.push(subCountryData.name);
            };
        });
        countriesData.push({
            id: countryData.id,
            name: countryData.name,
            lore: countryData.lore,
            ownername: GetAndParsePropertyData(`role_${countryData.ownerRole}`).name,
            owner: GetAndParsePropertyData(`player_${countryData.owner}`).name,
            membersname: GetAndParsePropertyData(`role_${countryData.peopleRole}`).name,
            members: membersName.filter(n => n != GetAndParsePropertyData(`player_${countryData.owner}`).name).join(` , `),
            banner: countryData.banner,
            color: countryData.colorcode,
            peace: countryData.peace ? 1 : 0,
            invite: countryData.invite ? 1 : 0,
            alliance: allianceCountryName.join(` , `),
            hostility: hostilityCountryName.join(` , `)
        });
    };

    const req = new HttpRequest("http://localhost:20006/country");
    req.body = JSON.stringify(countriesData);
    req.method = HttpRequestMethod.Post;
    req.headers = [
        new HttpHeader("Content-Type", "application/json")
    ];
    await http.request(req);
});

export async function sendEvent(body) {
    const req = new HttpRequest("http://localhost:20005/event/send");

    req.body = JSON.stringify(body);
    req.method = HttpRequestMethod.Post;
    req.headers = [
        new HttpHeader("Content-Type", "application/json")
    ];
    await http.request(req);
}

let logs = []
export async function addLog(data) {
    logs.push(data);
    if (logs.length > 49) {
        let sendLogs = logs;
        logs = [];
        await sendLog(sendLogs);
    };
};

export async function sendLog(body) {
    const req = new HttpRequest("http://localhost:30100/log");

    req.body = JSON.stringify(body);
    req.method = HttpRequestMethod.Post;
    req.headers = [
        new HttpHeader("Content-Type", "application/json")
    ];
    await http.request(req);
}

export async function sendToDiscord(data) {
    sendEvent({
        type: 'send_to_discord',
        data: data
    });
}

// サーバー開始時にメッセージを表示
world.afterEvents.worldInitialize.subscribe(async () => {
    const date = new Date();
    if (date.getMinutes() == 30) return;
    await sendToDiscord({
        channelId: mcChatChannelId,
        content: {
            embeds: [
                {
                    color: 0x7cfc00,
                    description: "Server Started"
                }
            ]
        }
    });
});

world.beforeEvents.playerLeave.subscribe(async (ev) => {
    const { player } = ev;
    const Name = player.name
    const Id = player.id;
    system.runTimeout(async () => {
        await sendEvent({
            type: 'leave',
            data: {
                server: 'karoearth',
                minecraftId: Id,
                playerName: Name,
                amount: world.getPlayers().length
            }
        });
    });
});

/*
system.beforeEvents.shutdown.subscribe(async () => {
    await sendToDiscord({
        channelId: mcChatChannelId,
        content: {
            embeds: [
                {
                    color: 0xff0000,
                    description: "Server Stopped"
                }
            ]
        }
    })
});*/

world.afterEvents.playerSpawn.subscribe(async (ev) => {
    const { player, initialSpawn } = ev;
    if (!initialSpawn) return;
    let firstJoin = false;
    if (!player.hasTag(`firstJoin`)) {
        world.sendMessage(`§a[かろEarth]\n§b${player.name} §r§bさんが初参加です`);
        firstJoin = true;
        player.addTag(`firstJoin`);
    };
    await sendEvent({
        type: 'join',
        data: {
            firstJoin: firstJoin,
            server: 'karoearth',
            minecraftId: player.id,
            playerName: player.name,
            amount: world.getPlayers().length
        }
    });
});

subscribeEvent();
// レスポンスに合わせて処理
async function subscribeEvent() {
    const req = new HttpRequest("http://localhost:20005/event/receive");
    req.timeout = 180;
    req.method = HttpRequestMethod.Get;
    const res = await http.request(req);
    if (res.status == 502) {
    } else if (res.status != 200) {
    } else {
        netEventHandler(res);
    }
    subscribeEvent();
}

function discordChatToMcChat(data) {
    if (data.server != 'karoearth') return;
    world.sendMessage(`§2 [§bDiscord-§r${data.authorName}§2] §r ${data.text}`);
}

function voteNotify(data) {
    const votedata = DyProp.getDynamicProperty(`voteData`);
    if (!votedata) return;
    if (data.userName) {
        let parseVotedata = JSON.parse(votedata);
        if (Object.keys(parseVotedata).includes(`${data.userName}`)) return;
        world.sendMessage(`§l§6 [VOTE]\n §r§l${data.userName} §l§aが §f${data.serverName} §aで投票しました`);
        Object.assign(parseVotedata, { [data.userName]: false });
        StringifyAndSavePropertyData(`voteData`, parseVotedata);
    };
}

function netEventHandler(res) {
    const events = {
        discord_chat: discordChatToMcChat,
        vote: voteNotify
    };
    const eventList = JSON.parse(res.body);

    for (const event of eventList) {
        const type = event.type;
        const data = event.data;
        const handler = events[type];

        if (handler) handler(data);
    }
}

let reqque = null
system.runInterval(async () => {
    const res = await http.get("http://localhost:20905/");
    if (res.body !== reqque) {
        if (reqque == null) {
            reqque = res.body;
            return;
        }
        reqque = res.body;
        const parseData = JSON.parse(res.body);
        switch (parseData.type) {
            case `ban`: {
                const rawDeviceIds = DyProp.getDynamicProperty("deviceIds") || "[]";
                const deviceIds = JSON.parse(rawDeviceIds);
                /**
                 * @type {Player}
                 */
                const targetPlayers = world.getPlayers({ name: parseData.user });
                if (targetPlayers.length == 0) return;
                const target = targetPlayers[0];
                const playerRawDataBefore = target.getDynamicProperty("accountData");
                /**
                 * @type {{ "deviceId": [string] , "id": string , "xuid": string }}
                 */
                const playerParseDataBefore = JSON.parse(playerRawDataBefore);
                for (let deviceId of playerParseDataBefore.deviceId) {
                    if (!deviceIds.includes(deviceId)) {
                        deviceIds.push(deviceId);
                    };
                };
                DyProp.setDynamicProperty("deviceIds", JSON.stringify(deviceIds));

                if (parseData?.reason != "") target.setDynamicProperty(`banReason`, parseData?.reason);
                target.setDynamicProperty(`isBan`, true);
                target.runCommand(`kick "${playerParseDataBefore.xuid}" §c§lあなたはBANされています\nReason: ${parseData?.reason}`);
                world.sendMessage(`§a[KaronNetWork BAN System]§r\n${target.name} §r§7の接続を拒否しました`);
                break;
            };
            case `mute`: {
                const targetPlayers = world.getPlayers({ name: parseData.user });
                if (targetPlayers.length == 0) return;
                const target = targetPlayers[0];
                target.setDynamicProperty(`isMute`, true);
                break;
            };
            case `unmute`: {
                const targetPlayers = world.getPlayers({ name: parseData.user });
                if (targetPlayers.length == 0) return;
                const target = targetPlayers[0];
                target.setDynamicProperty(`isMute`);
                break;
            };
            case `unban`: {
                world.getDimension(`overworld`).runCommand(`scriptevent karo:unban ${parseData.user}`);
                break;
            };
        };
    }
}, 10);

world.afterEvents.entityDie.subscribe(async (ev) => {
    const { deadEntity: player, damageSource } = ev;
    if (!(player instanceof Player)) return;
    let reason = `Cause: ${damageSource.cause} `;
    if (damageSource?.damagingEntity) reason += `\nEntity: ${damageSource?.damagingEntity?.nameTag || damageSource?.damagingEntity?.typeId}`;
    if (damageSource?.damagingProjectile) reason += `\nProjectile: ${damageSource?.damagingProjectile?.nameTag || damageSource?.damagingProjectile?.typeId}`;

    sendToDiscord({
        channelId: mcChatChannelId,
        content: {
            embeds: [
                {
                    color: 0x730099,
                    description: `[Dead] ${player.name}\n${reason}`
                }
            ]
        }
    });
});

// vote,login コマンド
world.beforeEvents.chatSend.subscribe(event => {
    const { sender, message } = event;
    if (message === "?vote") {
        event.cancel = true;
        system.run(() => {
            const data = DyProp.getDynamicProperty(`voteData`);
            if (!data) return;
            const parseData = JSON.parse(data);
            if (!Object.keys(parseData).includes(`${sender.name}`)) {
                sender.sendMessage(`§cあなたは投票していません`);
                return;
            };
            if (parseData[`${sender.name}`] == true) {
                sender.sendMessage(`§cあなたは既に今日の報酬を受け取っています`);
                return;
            }
            if (parseData[`${sender.name}`] == false) {
                //housyuuageru syorisiro
                sender.runCommand(`give @s karo:ticket 3`);
                sender.sendMessage(`§a報酬を受け取りました`);
                parseData[`${sender.name}`] = true;
                StringifyAndSavePropertyData(`voteData`, parseData);
                return;
            };
        })
    };
    if (message === "?login") {
        event.cancel = true;
        system.run(() => {
            const data = DyProp.getDynamicProperty(`loginData`);
            if (!data) return;
            const parseData = JSON.parse(data);
            if (parseData[`${sender.name}`] == true) {
                sender.sendMessage(`§cあなたは既に今日の報酬を受け取っています`);
                return;
            }
            if (!parseData[`${sender.name}`]) {
                //housyuuageru syorisiro
                sender.runCommand(`give @s karo:login_ticket 3`);
                sender.sendMessage(`§a報酬を受け取りました`);
                parseData[`${sender.name}`] = true;
                StringifyAndSavePropertyData(`loginData`, parseData);
                return;
            };
        })
    };
});

system.afterEvents.scriptEventReceive.subscribe((ev) => {
    if (ev.id.startsWith(`mc_cmd`)) {
        const sender = ev.sourceEntity;
        switch (ev.id.replace(`mc_cmd:`, ``)) {
            case `vote`: {
                system.run(() => {
                    const data = DyProp.getDynamicProperty(`voteData`);
                    if (!data) return;
                    const parseData = JSON.parse(data);
                    if (!Object.keys(parseData).includes(`${sender.name}`)) {
                        sender.sendMessage(`§cあなたは投票していません`);
                        return;
                    };
                    if (parseData[`${sender.name}`] == true) {
                        sender.sendMessage(`§cあなたは既に今日の報酬を受け取っています`);
                        return;
                    }
                    if (parseData[`${sender.name}`] == false) {
                        //housyuuageru syorisiro
                        sender.runCommand(`give @s karo:ticket 3`);
                        sender.sendMessage(`§a報酬を受け取りました`);
                        parseData[`${sender.name}`] = true;
                        StringifyAndSavePropertyData(`voteData`, parseData);
                        return;
                    };
                });
                break;
            };
            case `login`: {
                system.run(() => {
                    const data = DyProp.getDynamicProperty(`loginData`);
                    if (!data) return;
                    const parseData = JSON.parse(data);
                    if (parseData[`${sender.name}`] == true) {
                        sender.sendMessage(`§cあなたは既に今日の報酬を受け取っています`);
                        return;
                    }
                    if (!parseData[`${sender.name}`]) {
                        //housyuuageru syorisiro
                        sender.runCommand(`give @s karo:login_ticket 3`);
                        sender.sendMessage(`§a報酬を受け取りました`);
                        parseData[`${sender.name}`] = true;
                        StringifyAndSavePropertyData(`loginData`, parseData);
                        return;
                    };
                });
            };
        };
    }
});

world.afterEvents.entityDie.subscribe(async (ev) => {
    const { deadEntity, damageSource } = ev;
    //if (!killLogCheckEntityIds.includes(`${deadEntity?.typeId}`)) return;
    try {
        const { x, y, z } = deadEntity.location;
        const date = new Date();
        date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
        const str_date = date.toISOString().replace('T', ' ').substring(0, 19);

        await addLog({
            table: `kill_logs`,
            data: {
                deader_type: `${deadEntity?.typeId}`,
                deader_name: `${deadEntity?.nameTag}`,
                cause: `${damageSource?.cause}`,
                damager_type: `${damageSource?.damagingEntity?.typeId}`,
                damager_name: `${damageSource?.damagingEntity?.nameTag}`,
                x: Math.floor(x) ?? null,
                y: Math.floor(y) ?? null,
                z: Math.floor(z) ?? null,
                dimension: `${deadEntity.dimension.id}`,
                timestamp: `${str_date}`,
            },
        });
    } catch (error) { };
});

world.afterEvents.playerPlaceBlock.subscribe(async (ev) => {
    const { player, block } = ev;
    const { x, y, z } = block.location;
    const date = new Date();
    date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
    const str_date = date.toISOString().replace('T', ' ').substring(0, 19);

    await addLog({
        table: `place_logs`,
        data: {
            player_name: `${player.name}`,
            block: `${block?.typeId}`,
            x: x,
            y: y,
            z: z,
            dimension: `${player.dimension.id}`,
            timestamp: `${str_date}`,
        }
    });
});

world.afterEvents.playerBreakBlock.subscribe(async (ev) => {
    const { player, brokenBlockPermutation, block } = ev;
    const { x, y, z } = block.location;
    const date = new Date();
    date.setTime(date.getTime() - date.getTimezoneOffset() * 60 * 1000);
    const str_date = date.toISOString().replace('T', ' ').substring(0, 19);

    await addLog({
        table: `break_logs`,
        data: {
            player_name: `${player.name}`,
            block: `${brokenBlockPermutation?.type.id}`,
            x: x,
            y: y,
            z: z,
            dimension: `${player.dimension.id}`,
            timestamp: `${str_date}`,
        }
    });
});
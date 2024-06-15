import { Player, world } from "@minecraft/server";
import config from "../config";
import * as DyProp from "./DyProp";
import { CheckPermission, CheckPermissionFromLocation, ConvertChunk, GetAndParsePropertyData, GetChunkPropertyId, GetPlayerChunkPropertyId, StringifyAndSavePropertyData } from "./util";
import { GenerateChunkData } from "./land";

class ChatHandler {
    constructor(event) {
        this.event = event;
        /**
         * @type {string}
         */
        this.message = event.message;
        /**
         * @type {Player}
         */
        this.sender = event.sender;
        /**
         * @type {string}
         */
        this.prefix = config.prefix;
        this.playerData = GetAndParsePropertyData(`player_${sender.id}`);
        this.playerCountryData = GetAndParsePropertyData(`country_${sender.country}`);
    }

    isCommand() {
        return this.message.startsWith(this.prefix);
    }

    handleChat() {
        if (!config.showCountryChatLeftName) {
            world.sendMessage(`<${this.sender.name}> ${this.message}`);
            return;
        };
        let landId = this.playerData.country;
        let land = `chat.player.no.join.any.country`;
        if (landId) land = this.playerCountryData.id;
        world.sendMessage([{ text: `<§${this.playerCountryData.color}` }, { translate: land }, { text: ` §r| ${this.sender.name}> ${this.message}` }]);
        this.event.targets = [];
    };

    handleCommand() {
        const command = this.message.split(" ")[0];
        const args = this.message.split(" ").slice(1);
        switch (command) {
            case `${this.prefix}money`:
                this.Money();
                break;
            case `${this.prefix}setup`:
                this.setup();
                break;
            case `${this.prefix}msend`:
                this.sendMoney(args);
                break;
            case `${this.prefix}checkchunk`:
                this.checkChunk();
                break;
            case `${this.prefix}sethome`:
                this.setHome();
                break;
            case `${this.prefix}home`:
                this.teleportHome();
                break;
            case `${this.prefix}checkhome`:
                this.checkHome();
                break;
            case `${this.prefix}adminchunk`:
                this.setAdminChunk();
                break;
            case `${this.prefix}resetchunk`:
                this.resetChunk();
                break;
            case `${this.prefix}buychunk`:
                this.buyChunk();
                break;
            case `${this.prefix}sellchunk`:
                this.sellChunk();
                break;
            case `${this.prefix}help`:
                this.sendHelp();
                break;
            case `${this.prefix}surrender`:
                this.surrender();
                break;
            case `${this.prefix}makecountry`:
                this.makeCountry();
                break;
            case `${this.prefix}settingcountry`:
                this.settingCountry();
                break;
            case `${this.prefix}leavecountry`:
                this.leaveCountry();
                break;
            case `${this.prefix}deposit`:
                this.deposit(args);
                break;
            case `${this.prefix}alliance`:
                this.alliance(args);
                break;
            default:
                this.sender.sendMessage({ translate: `command.unknown.error`, with: command });
        }
    };

    Money() {
        this.sender.sendMessage({ translate: `command.money.result.message`, with: `${config.MoneyName} ${this.playerData.money}` });
    };

    setup() {
        system.runTimeout(() => {
            if (!this.sender.isOp()) {
                this.sender.sendMessage({ translate: `command.permission.error` });
                return;
            }
            this.sender.sendMessage({ translate: `system.setup.complete` });
            this.sender.addTag("mc_admin");
            world.setDynamicProperty(`start`, `true`)
            return;
        }, 1);
    };

    sendMoney(args) {
        if (args.length < 2 || isNaN(args[0]) || !args[1]) {
            this.sender.sendMessage({ translate: `command.sendmoney.error.name`, with: config.prefix });
            return;
        }

        const amount = Number(args[0]);
        const targetName = args[1];
        /**
         * @type {Player}
         */
        const targetPlayer = world.getDimension(this.sender.dimension.id).getEntities({ type: "minecraft:player", name: targetName })[0];

        if (!targetPlayer) {
            this.sender.sendMessage({ translate: `command.error.notarget.this.dimension` });
            return;
        };
        if (amount < 1) {
            this.sender.sendMessage({ translate: `command.error.canuse.number.more`, with: `1` });
            return;
        };
        if (this.playerData.money < amount) {
            this.sender.sendMessage({ translate: `command.error.trysend.moremoney.youhave`, with: `${this.playerData.money}` });
            return;
        };
        const targetData = GetAndParsePropertyData(`player_${targetPlayer.id}`);
        targetData.money += Math.floor(amount);
        this.playerData.money -= Math.floor(amount);
        StringifyAndSavePropertyData(`player_${targetPlayer.id}`, targetData);
        StringifyAndSavePropertyData(`player_${this.sender.id}`, this.playerData);
        this.sender.sendMessage({ translate: `command.sendmoney.result.sender`, with: [targetName, `${config.MoneyName} ${Math.floor(amount)}`] });
        targetPlayer.sendMessage({ translate: `command.sendmoney.result.receiver`, with: [this.sender.name, `${config.MoneyName} ${Math.floor(amount)}`] });
    };

    checkChunk() {
        const chunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(this.sender));
        if (!chunkData || (!chunkData.special && !chunkData.countryId)) {
            this.sender.sendMessage({ translate: `command.checkchunk.result.wilderness`, with: { translate: `wilderness.name` } });
            return;
        } else if (chunkData.special) {
            this.sender.sendMessage({ translate: `command.checkchunk.result.special`, with: { translate: `special.name` } });
            return;
        } else {
            if (chunkData.owner) {
                this.sender.sendMessage({ translate: `command.checkchunk.result.ownerland`, with: `${chunkCountryData.owner}` });
                return;
            };
            const chunkCountryData = GetAndParsePropertyData(`country_${chunkData.countryId}`)
            this.sender.sendMessage({ translate: `command.checkchunk.result.territory`, with: `${chunkCountryData.name}` });
            return;
        };
    };

    setHome() {
        const chunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(this.sender));
        const check = CheckPermission(this.sender, `setHome`);
        if (check) {
            if (chunkData.special) {
                this.sender.sendMessage({ translate: `command.sethome.error.special`, with: { translate: `special.name` } });
                return;
            };
            this.sender.sendMessage({ translate: `command.sethome.error.thischunk` });
            return;
        };
        this.sender.sendMessage({ translate: `command.sethome.result`, with: [`${Math.floor(this.sender.location.x)} ${Math.floor(this.sender.location.y)} ${Math.floor(this.sender.location.z)}(${this.sender.dimension.id})`, config.prefix] });
        this.sender.setDynamicProperty("homePoint", `${Math.floor(this.sender.location.x)} ${Math.floor(this.sender.location.y)} ${Math.floor(this.sender.location.z)} ${this.sender.dimension.id}`);
        return;
    };

    teleportHome() {
        const homePoint = this.sender.getDynamicProperty("homePoint");
        if (!homePoint) {
            this.sender.sendMessage({ translate: `command.error.nosethome` });
            return;
        };
        let [x, y, z, dimension] = homePoint.split(" ");
        [x, y, z] = [x, y, z].map(Number);
        const check = CheckPermissionFromLocation(this.sender, x, z, dimension, `setHome`);
        if (check) {
            this.sender.sendMessage({ translate: `command.home.error.thischunk` });
            return;
        };
        this.sender.teleport({ x, y, z }, { dimension: world.getDimension(dimension.replace(`minecraft:`, ``)) });
        return;
    };

    checkHome() {
        const homePoint = this.sender.getDynamicProperty("homePoint");
        if (!homePoint) {
            this.sender.sendMessage({ translate: `command.error.nosethome` });
        } else {
            let [x, y, z, dimension] = homePoint.split(" ");
            const homePointString = `${x},${y},${z}(${dimension.replace(`minecraft:`, ``)})`
            this.sender.sendMessage({ translate: `command.checkhome.result`, with: [homePointString] });
        };
    };

    setAdminChunk() {
        if (!this.sender.hasTag("mc_admin")) {
            this.sender.sendMessage({ translate: `command.permission.error` });
            return;
        };
        const { x, z } = this.sender.location;
        this.sender.sendMessage({translate: `command.setadminchunk.result`,with: {translate: `special.name`}});
        const chunk = GenerateChunkData(x,z,this.sender.dimension.id,undefined,undefined,10000,true);
        StringifyAndSavePropertyData(chunk.id,chunk);
        return;
    };

    resetChunk() {
        if (!this.sender.hasTag("mc_admin")) {
            this.sender.sendMessage({ translate: `command.permission.error` });
            return;
        };
        DyProp
        this.sender.sendMessage({translate: `command.resetchunk.result`,with: {translate: `wilderness.name`}});
        
    };

    buyChunk() {
        const money = getScore(this.sender, "mc_money");
        if (money < config.chunkPrice) {
            this.sender.sendMessage(`§c土地を買うための所持金が不足しています\n§c土地価格: ${config.chunkPrice}円`);
            return;
        };

        const chunk = convertChunk(this.sender.location.x, this.sender.location.z);
        const score = getScore(chunk, "mc_chunk");

        if (!score || score === 0) {
            setScore(chunk, "mc_chunk", getScore(this.sender, "mc_pcountries"));
            this.sender.sendMessage(`§aこのチャンクを買いました`);
            this.sender.runCommandAsync(`scoreboard players add @s mc_money -${config.chunkPrice}`);
        } else if (score === -1) {
            this.sender.sendMessage(`§c特別区域を買うことはできません`);
        } else if (score === getScore(this.sender, "mc_pcountries")) {
            this.sender.sendMessage(`§cこのチャンクはすでにあなたの国のものです`);
        } else {
            this.sender.sendMessage(`§cこのチャンクは他の国がすでに所有しています`);
        };
    };

    sellChunk() {
        const chunk = convertChunk(this.sender.location.x, this.sender.location.z);
        const score = getScore(chunk, "mc_chunk");

        if (score === getScore(this.sender, "mc_pcountries")) {
            setScore(chunk, "mc_chunk", 0);
            this.sender.sendMessage(`§aこのチャンクを売りました`);
            this.sender.runCommandAsync(`scoreboard players add @s mc_money ${config.chunkSellPrice}`);
        } else if (score === -1) {
            this.sender.sendMessage(`§c特別区域を売ることはできません`);
        } else {
            this.sender.sendMessage(`§cこのチャンクはあなたの国のものではありません`);
        };
    };

    sendHelp() {
        const helpMessage = [
            `§a--------ヘルプコマンド--------`,
            `§b${config.prefix}money §a: 所持金を表示`,
            `§b${config.prefix}setup §a: セットアップ (管理者専用)`,
            `§b${config.prefix}msend <Number> <PlayerName> §a: 他プレイヤーにお金を送る`,
            `§b${config.prefix}checkchunk §a: 現在のチャンクの状態を確認`,
            `§b${config.prefix}sethome §a: 現在位置にHomeをセット`,
            `§b${config.prefix}home §a: Homeにテレポート`,
            `§b${config.prefix}checkhome §a: Homeの位置を確認`,
            `§b${config.prefix}adminchunk §a: チャンクを特別区域に設定 (管理者専用)`,
            `§b${config.prefix}resetchunk §a: チャンクを荒野にリセット (管理者専用)`,
            `§b${config.prefix}buychunk §a: 現在のチャンクを購入`,
            `§b${config.prefix}sellchunk §a: 現在のチャンクを売却`,
            `§b${config.prefix}surrender §a: 国を解散`,
            `§b${config.prefix}makecountry §a: 新しい国を作成`,
            `§b${config.prefix}settingcountry §a: 国の設定を変更`,
            `§b${config.prefix}leavecountry §a: 国から離脱`,
            `§b${config.prefix}deposit <Number> §a: 国の金庫にお金を預ける`,
            `§b${config.prefix}alliance <CountryName> §a: 他国と同盟を結ぶ`
        ];

        this.sender.sendMessage(helpMessage.join("\n"));
    };

    surrender() {
        // 国を解散するロジック
    };

    makeCountry() {
        // 新しい国を作成するロジック
    };

    settingCountry() {
        // 国の設定を変更するロジック
    };

    leaveCountry() {
        // 国から離脱するロジック
    };

    deposit(args) {
        // 国の金庫にお金を預けるロジック
    };

    alliance(args) {
        // 他国と同盟を結ぶロジック
    };
}

world.beforeEvents.chatSend.subscribe(event => {
    const chatHandler = new ChatHandler(event);
    if (chatHandler.isCommand()) {
        chatHandler.handleCommand();
    } else {
        chatHandler.handleChat();
    }
});


/*
import { world } from "@minecraft/server"
import { config } from "../config"

world.beforeEvents.chatSend.subscribe((ev)=>{
    ev.sendToTargets = true;
    if(!ev.message.startsWith(config.prefix)) {
        if(!config.countryLeft) {
            world.sendMessage(`<${ev.sender.name}> ${ev.message}`);
            return
        }
        let land = getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`))
        if(getScore(ev.sender,`mc_pcountries`) === 0) land = config.noCountry
        world.sendMessage(`<§a${land} §r| ${ev.sender.name}> ${ev.message}`)
        if(!config.sendChatToWebSocket) ev.cancel = true
        return
    }
    if(!config.sendCommandToWebSocket) ev.cancel = true
    system.run(()=>{
        let command
        try {
            command = ev.message.split(` `)[0]
        } catch (error) {
            command = ev.message
        }
        switch(command) {
            case `${config.prefix}money`: {
                ev.sender.sendMessage(`§a所持金: ${world.scoreboard.getObjective(`mc_money`).getScore(ev.sender)}`)
                break;
            }
            case `${config.prefix}setup`: {
                if(!ev.sender.isOp()) {
                    ev.sender.sendMessage(`§c必要な権限がありません`)
                    break;
                }
                ev.sender.sendMessage(`[MakeCountry]\n§aセットアップが完了しました`)
                ev.sender.addTag(`mc_admin`)
                ev.sender.runCommandAsync(`function setup`)
                system.runTimeout(()=>{
                    setScore(`特別区域`,`mc_countries`,-1)
                    setScore(`荒野`,`mc_countries`,0)
                },2)
                break;
            }
            case `${config.prefix}msend`: {
                if(!ev.message.endsWith(`${config.prefix}msend`)  && typeof Number(ev.message.split(` `)[1]) === 'number' && ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]) {
                    if(!world.getDimension(ev.sender.dimension.id).getEntities({type: `minecraft:player`,name: `${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]}`})[0]) {
                        ev.sender.sendMessage(`§c同ディメンションに対象プレイヤーが見つかりません`)
                        break;
                    }
                    if(isNaN(ev.message.split(` `)[1])) {
                        ev.sender.sendMessage(`§c数字を入力してください`)
                        break
                    }
                    if(Number(ev.message.split(` `)[1]) < 1) {
                        ev.sender.sendMessage(`§c入力可能な数値は1以上です`)
                        break;
                    }
                    if(getScore(ev.sender,`mc_money`) < Number(ev.message.split(` `)[1])) {
                        ev.sender.sendMessage(`§cあなたの所持金よりも多い額を送金しようとしています(所持金: ${getScore(ev.sender,`mc_money`)})`)
                        break;
                    }
                    ev.sender.runCommandAsync(`scoreboard players add "${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]}" mc_money ${Math.floor(Number(ev.message.split(` `)[1]))}`)
                    ev.sender.runCommandAsync(`scoreboard players add @s mc_money -${Math.floor(Number(ev.message.split(` `)[1]))}`)
                    ev.sender.sendMessage(`${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]} §r§aに ${Math.floor(Number(ev.message.split(` `)[1]))}円 を送りました `)
                    world.getDimension(ev.sender.dimension.id).getEntities({name: `${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]}`})[0].sendMessage(`${ev.sender.name} §r§aから ${Math.floor(Number(ev.message.split(` `)[1]))}円 を受け取りました`)
                    break;
                } else {
                    ev.sender.sendMessage(`§c構文が間違っている可能性があります\n§b${config.prefix}msend <Number> <PlayerName>\n§cプレイヤー名は"プレイヤー名"の形にしてはいけません`)
                    break;
                }
            }
            case `${config.prefix}checkchunk`: {
                if(!getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) || getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === 0) {
                    ev.sender.sendMessage(`§a現在のチャンクは荒野です`)
                    break;
                }
                if(getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === -1) {
                    ev.sender.sendMessage(`§a現在のチャンクは特別区域です`)
                    break
                }
                ev.sender.sendMessage(`§a現在のチャンクは§r ${getNameScore(`mc_countries`,getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`))}§r§a の領土です`)
                break
            }
            case `${config.prefix}sethome`: {
                if(ev.sender.dimension.id !== `minecraft:overworld`) {
                    ev.sender.sendMessage(`§cHomeをセットできるのはオーバーワールドのみです`)
                    break
                }
                if(!getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) || getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === 0) {
                    ev.sender.sendMessage(`§a${Math.floor(ev.sender.location.x)} ${Math.floor(ev.sender.location.y)} ${Math.floor(ev.sender.location.z)} にHomeをセットしました\n§b${config.prefix}home §aでいつでも来れます`)
                    ev.sender.setDynamicProperty(`homePoint`,`${Math.floor(ev.sender.location.x)} ${Math.floor(ev.sender.location.y)} ${Math.floor(ev.sender.location.z)}`)
                    break;
                }
                if(getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === -1) {
                    ev.sender.sendMessage(`§c特別区域にHomeを設定することはできません`)
                    break
                }
                if(getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === getScore(ev.sender,`mc_pcountries`)) {
                    ev.sender.sendMessage(`§a${Math.floor(ev.sender.location.x)} ${Math.floor(ev.sender.location.y)} ${Math.floor(ev.sender.location.z)} にHomeをセットしました\n§b${config.prefix}home §aでいつでも来れます`)
                    ev.sender.setDynamicProperty(`homePoint`,`${Math.floor(ev.sender.location.x)} ${Math.floor(ev.sender.location.y)} ${Math.floor(ev.sender.location.z)}`)
                    break;
                }
                ev.sender.sendMessage(`§c他国の領土にHomeを設定することはできません`)
                break
            }
            case `${config.prefix}home`: {
                if(!ev.sender.getDynamicProperty(`homePoint`)) {
                    ev.sender.sendMessage(`§cHomeがセットされていません\n§b${config.prefix}sethome §cを使ってHomeを設定できます`)
                    break;
                }
                const loc = ev.sender.getDynamicProperty(`homePoint`).split(` `)
                if(getScore(convertChunk(Number(loc[0]),Number(loc[2])),`mc_chunk`) !== getScore(ev.sender,`mc_pcountries`) && getScore(ev.sender,`mc_pcountries`) > 0) {
                    ev.sender.sendMessage(`§c他国の領土にHomeをセットしてしまっているようです`)
                    break;
                }
                if(getScore(convertChunk(Number(loc[0]),Number(loc[2])),`mc_chunk`) === -1) {
                    ev.sender.sendMessage(`§c特別区域にHomeをセットしてしまっているようです`)
                    break;
                }
                ev.sender.teleport({x: Number(loc[0]) , y: Number(loc[1]) , z: Number(loc[2])},{dimension: world.getDimension(`overworld`)})
                break
            }
            case `${config.prefix}checkhome`: {
                if(!ev.sender.getDynamicProperty(`homePoint`)) {
                    ev.sender.sendMessage(`§cHomeがセットされていません\n§b${config.prefix}sethome §cを使ってHomeを設定できます`)
                    break;
                }
                ev.sender.sendMessage(`§a現在のHomeは(${ev.sender.getDynamicProperty(`homePoint`)})にセットされてます`)
                break
            }
            case `${config.prefix}adminchunk`: {
                if(!ev.sender.hasTag(`mc_admin`)) {
                    ev.sender.sendMessage(`§c権限がありません`)
                    break
                }
                ev.sender.sendMessage(`§aこのチャンクを特別区域にしました`)
                setScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`,-1)
                break;
            }
            case `${config.prefix}resetchunk`: {
                if(!ev.sender.hasTag(`mc_admin`)) {
                    ev.sender.sendMessage(`§c権限がありません`)
                    break
                }
                ev.sender.sendMessage(`§aこのチャンクを荒野にリセットしました`)
                world.scoreboard.getObjective(`mc_chunk`).removeParticipant(convertChunk(ev.sender.location.x,ev.sender.location.z))
                break;
            }
            case `${config.prefix}buychunk`: {
                if(getScore(ev.sender,`mc_pcountries`) < 1) {
                    ev.sender.sendMessage(`§c先に建国をしてください\n§b${config.prefix}makecountry`)
                    break
                }
                if(!ev.sender.hasTag(`countryAdmin`) && !ev.sender.hasTag(`countryOwner`)) {
                    ev.sender.sendMessage(`§c権限がありません`)
                }
                if(getScore(ev.sender,`mc_money`) < config.buyChunkCost) {
                    ev.sender.sendMessage(`§c金が足りません(必要金額: ${config.buyChunkCost})`)
                    break
                }
                if(!getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) || getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === 0) {
                    ev.sender.sendMessage(`§aこのチャンクを購入しました`)
                    addScore(ev.sender,`mc_money`,-1 * config.buyChunkCost)
                    setScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`,getScore(ev.sender,`mc_pcountries`))
                    break;
                } 
                if(getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === -1) {
                    ev.sender.sendMessage(`§cこのチャンクは特別区域のため、購入不可能です`)
                    break
                }
                ev.sender.sendMessage(`§cこのチャンクは§r ${getNameScore(`mc_countries`,getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`))}§r§c の領土なので購入不可です`)
                break
            }
            case `${config.prefix}sellchunk`: {
                if(getScore(ev.sender,`mc_pcountries`) < 1) {
                    ev.sender.sendMessage(`§cあなたは国を持っていません`)
                    break
                }
                if(!ev.sender.hasTag(`countryOwner`)) {
                    ev.sender.sendMessage(`§c権限がありません`)
                }
                if(!getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) || getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === 0) {
                    ev.sender.sendMessage(`§cこのチャンクを所有していません`)
                    break;
                } 
                if(getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) === -1) {
                    ev.sender.sendMessage(`§cこのチャンクを所有していません`)
                    break
                }
                if(getScore(convertChunk(ev.sender.location.x,ev.sender.location.z),`mc_chunk`) !== getScore(ev.sender,`mc_pcountries`)) {
                    ev.sender.sendMessage(`§cこのチャンクを所有していません`)
                    break
                }
                addScore(ev.sender,`mc_money`,config.sellChunk)
                world.scoreboard.getObjective(`mc_chunk`).removeParticipant(convertChunk(ev.sender.location.x,ev.sender.location.z))
                ev.sender.sendMessage(`§aこのチャンクを${config.sellChunk}円で売りました`)
                break
            }
            case `${config.prefix}help`: {
                ev.sender.sendMessage(`[MakeCountry] コマンド一覧\n§b${config.prefix}checkchunk §f現在のチャンクの情報を確認します\n§b${config.prefix}money §f所持金を確認します\n§b${config.prefix}msend <Number> <PlayerName> §f指定した相手に指定した金額を送金します\n§b${config.prefix}help §fコマンド一覧を出します\n§b${config.prefix}makecountry §f国を作るアイテムを手に入れます\n§b${config.prefix}settingcountry §f国を管理するアイテムを手に入れます\n§b${config.prefix}buychunk §f現在のチャンクを買います\n§b${config.prefix}sellchunk §f現在のチャンクが自分の領土だった場合売ります\n§b${config.prefix}dofwar req <国名> §f宣戦布告をします\n§b${config.prefix}dofwar delete <国名> §f宣戦布告を破棄します\n§b${config.prefix}alliance req <国名> §f同盟の申請をします\n§b${config.prefix}alliance check §f同盟の確認をします\n§b${config.prefix}alliance delete <国名> §f同盟を破棄します\n§b${config.prefix}peacechange §f平和主義を切り替えます(クールタイム: ${config.untilNextChangePeace}分)\n§b${config.prefix}countrylist §f国の一覧を表示します\n§b${config.prefix}sethome §fいつでもテレポートできるHomeを設定します\n§b${config.prefix}home §fセットしたHomeにテレポートします\n§b${config.prefix}checkhome §f現在のHomeを確認します\n§b${config.prefix}surrender §f現在戦争している全ての国に対して降伏します\n§b${config.prefix}leavecountry §f所属国から抜けます\n§b${config.prefix}deposit <Number> §f所属国の国庫に指定した金額を入金します`)
                if(ev.sender.isOp()) ev.sender.sendMessage(`§b${config.prefix}setup §fアドオンをセットアップします`)
                if(ev.sender.hasTag(`mc_admin`)) ev.sender.sendMessage(`§b${config.prefix}adminchunk §f現在のチャンクを特別区域にする\n§b${config.prefix}resetchunk §f現在のチャンクを荒野にリセットする`)
                break
            }
            case `${config.prefix}surrender`: {
                if(!ev.sender.hasTag(`countryOwner` || getScore(ev.sender,`mc_pcountries`) < 1)) {
                    ev.sender.sendMessage(`§c権限がありません`)
                    break
                }
                if(world.scoreboard.getObjective(`mc_warNow${getScore(ev.sender,`mc_pcountries`)}`).getScores().length === 0) {
                    ev.sender.sendMessage(`§c戦争をしていません`)
                    break
                }
                //降伏の処理
                let winners = ""
                let winnersAmount = 0
                for(const f of world.scoreboard.getObjective(`mc_warNow${getScore(ev.sender,`mc_pcountries`)}`).getScores()) {
                    //問題個所
                    winners = winners + getNameScore(`mc_countries`,Number(f.participant.displayName)) + `§r\n`
                    winnersAmount++
                    world.scoreboard.getObjective(`mc_warNow${f.participant.displayName}`).removeParticipant(`${getScore(ev.sender,`mc_pcountries`)}`)
                    world.scoreboard.getObjective(`mc_warNow${getScore(ev.sender,`mc_pcountries`)}`).removeParticipant(`${f.participant.displayName}`)
                }
                world.sendMessage(`§c[MakeCountry]§r\n${getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`))}§r§aは§r\n${winners}の計${winnersAmount}ヶ国に降伏した`)
                break
            }
            case `${config.prefix}makecountry`: {
                ev.sender.runCommandAsync(`clear @s karo:countrycreate`)
                ev.sender.runCommandAsync(`give @s karo:countrycreate`)
                break
            }
            case `${config.prefix}settingcountry`: {
                ev.sender.runCommandAsync(`clear @s karo:countryadmin`)
                ev.sender.runCommandAsync(`give @s karo:countryadmin`)
                break
            }
            case `${config.prefix}leavecountry`: {
                if(getScore(ev.sender,`mc_pcountries`) < 1) {
                    ev.sender.sendMessage(`§c国に所属していません`)
                    break
                }
                if(ev.sender.hasTag(`countryOwner`)) {
                    ev.sender.sendMessage(`§c国王は抜けられません`)
                    break
                }
                ev.sender.removeTag(`countryAdmin`)
                ev.sender.sendMessage(`§a国から抜けました`)
                addScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_people`,-1)
                setScore(ev.sender,`mc_pcountries`,0)
                break
            }
            case `${config.prefix}deposit`: {
                if(!ev.message.split(` `)[1]) {
                    ev.sender.sendMessage(`§cコマンドの構文が間違っています`)
                    break
                }
                if(isNaN(ev.message.split(` `)[1])) {
                    ev.sender.sendMessage(`§c数字を入力してください`)
                    break
                }
                if(!ev.message.endsWith(`${config.prefix}deposit`) && typeof Number(ev.message.split(` `)[1]) === 'number') {
                    if(getScore(ev.sender,`mc_pcountries`) < 1) {
                        ev.sender.sendMessage(`§c国に所属していません`)
                        break
                    }
                    if(Number(ev.message.split(` `)[1]) < 1) {
                        ev.sender.sendMessage(`§c入力可能な数値は1以上です`)
                        break;
                    }
                    if(getScore(ev.sender,`mc_money`) < Number(ev.message.split(` `)[1])) {
                        ev.sender.sendMessage(`§cあなたの所持金よりも多い額を送金しようとしています(所持金: ${getScore(ev.sender,`mc_money`)})`)
                        break;
                    }
                    addScore(`${getScore(ev.sender,`mc_pcountries`)}`,`countrymoney`,Number(ev.message.split(` `)[1]))
                    addScore(ev.sender,`mc_money`,Number(ev.message.split(` `)[1]))
                    ev.sender.sendMessage(`§a国庫に${Number(ev.message.split(` `)[1])}円入金しました`)
                    break
                }
                ev.sender.sendMessage(`§cコマンドの構文が間違っています`)
                break
            }
            case `${config.prefix}alliance`: {
                if(!ev.sender.hasTag(`countryOwner`) || getScore(ev.sender,`mc_pcountries`) < 1) {
                    ev.sender.sendMessage(`§c権限がありません`)
                    break
                }
                if(!ev.message.split(` `)[1]) {
                    ev.sender.sendMessage(`§cサブコマンドが入力されていません\nサブコマンド一覧\n§b${config.prefix}alliance req <国名> §f同盟の申請をします\n§b${config.prefix}alliance check §f同盟の確認をします\n§b${config.prefix}alliance delete <国名> §f同盟を破棄します`)
                    break
                }
                switch(ev.message.split(` `)[1]) {
                    case `req`: {
                        try {
                            const b = ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]
                        } catch (error) {
                            ev.sender.sendMessage(`§c国名を入力してください`)
                            break
                        }
                        const country = findCountry(ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1])
                        if(!country || country.number < 1) {
                            ev.sender.sendMessage(`§c存在しない国です`)
                            break
                        }
                        if(country.number === getScore(ev.sender,`mc_pcountries`)) {
                            ev.sender.sendMessage(`§c自分の国と同盟を組むことはできません`)
                            break
                        }
                        if(isWarNowCountry(country.name,getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`)))) {
                            ev.sender.sendMessage(`§c戦争中の国とは同盟を組むことはできません`)
                        }
                        setScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_freq${country.number}`,1)
                        setScore(`${country.number}`,`mc_freq${getScore(ev.sender,`mc_pcountries`)}`,1)
                        world.sendMessage(`§c[MakeCountry]\n§r${getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`))} §r§aが ${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]} §r§aに同盟を申請しました`)
                        break;
                    }
                    case `delete`: {
                        try {
                            const b = ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]
                        } catch (error) {
                            ev.sender.sendMessage(`§c国名を入力してください`)
                            break
                        }
                        const country = findCountry(ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1])
                        if(!country || country.number < 1) {
                            ev.sender.sendMessage(`§c存在しない国です`)
                            break
                        }
                        if(!getScore(`${country.number}`,`mc_friend${getScore(ev.sender,`mc_pcountries`)}`)) {
                            ev.sender.sendMessage(`§cこの国と同盟関係ではありません`)
                            break
                        }
                        world.scoreboard.getObjective(`mc_friend${country.number}`).removeParticipant(`${getScore(ev.sender,`mc_pcountries`)}`)
                        world.scoreboard.getObjective(`mc_friend${getScore(ev.sender,`mc_pcountries`)}`).removeParticipant(`${country.number}`)
                        ev.sender.sendMessage(`${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]} §r§cとの同盟を破棄しました`)
                        break;
                    }
                    case `check`: {
                        let friends = ""
                        let friendsAmount = 0
                        for(const f of world.scoreboard.getObjective(`mc_friend${getScore(ev.sender,`mc_pcountries`)}`).getScores().filter(kuni => kuni.score > 0)) {
                            friends = friends + getNameScore(`mc_countries`,Number(f.participant.displayName)) + `§r\n`
                            friendsAmount++
                        }
                        if(friends.length === 0) {
                            ev.sender.sendMessage(`§cまだどこの国とも同盟を組んでいません`)
                            break
                        }
                        ev.sender.sendMessage(`§aあなた国の同盟国は\n§r${friends}の計${friendsAmount}ヶ国です`)
                        break
                    }
                    default: {
                        ev.sender.sendMessage(`§c存在しないサブコマンドです\nサブコマンド一覧\n§b${config.prefix}alliance req <国名> §f同盟の申請をします\n§b${config.prefix}alliance check §f同盟の確認をします\n§b${config.prefix}alliance delete <国名> §f同盟を破棄します`)
                        break
                    }
                }
                break
            }
            case `${config.prefix}countrylist`: {
                ev.sender.sendMessage(`§a[MakeCountry] §r国のリスト`)
                for(const country of world.scoreboard.getObjective(`mc_countries`).getScores().filter(kuni => kuni.score > 0)) {
                    let peace = `§cNo`
                    if(isPeaceCountry(`${country.participant.displayName}`)) {
                        peace = `§aYes`
                    }
                    ev.sender.sendMessage(`${country.participant.displayName} §r平和主義: ${peace}`)
                }
                break;
            }
            case `${config.prefix}kill`: {
                ev.sender.runCommand(`kill @s`)
                break;
            }
            case `${config.prefix}peacechange`: {
                if(!ev.sender.hasTag(`countryOwner` || getScore(ev.sender,`mc_pcountries`) < 1)) {
                    ev.sender.sendMessage(`§c権限がありません`)
                    break
                }
                if(getScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_ptimer`) > 0) {
                    ev.sender.sendMessage(`§cクールタイム中です(終了まで残り${getScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_ptimer`)}分)`)
                    break;
                }
                if(isPeaceCountry(getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`)))) {
                    ev.sender.sendMessage(`§a平和主義を解除しました`)
                    setScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_peace`,0)
                    setScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_ptimer`,config.untilNextChangePeace)
                    break
                }
                ev.sender.sendMessage(`§a平和主義にしました`)
                setScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_peace`,1)
                setScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_ptimer`,config.untilNextChangePeace)
                break
            }
            case `${config.prefix}dofwar`: {
                if(!ev.sender.hasTag(`countryOwner` || getScore(ev.sender,`mc_pcountries`) < 1)) {
                    ev.sender.sendMessage(`§c権限がありません`)
                    break
                }
                if(!ev.message.split(` `)[1]) {
                    ev.sender.sendMessage(`§cサブコマンドが入力されていません\nサブコマンド一覧\n§b${config.prefix}dofwar req <国名> §f宣戦布告をします\n§b${config.prefix}alliance delete <国名> §f宣戦布告を破棄します`)
                    break
                }
                switch(ev.message.split(` `)[1]) {
                    case `req`: {
                        try {
                            const b = ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]
                        } catch (error) {
                            ev.sender.sendMessage(`§c国名を入力してください`)
                            break
                        }
                        const country = findCountry(ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1])
                        if(!country || country.number < 1) {
                            ev.sender.sendMessage(`§c存在しない国です`)
                            break
                        }
                        if(country.number === getScore(ev.sender,`mc_pcountries`)) {
                            ev.sender.sendMessage(`§c自分の国に宣戦布告することはできません`)
                            break
                        }
                        if(isPeaceCountry(getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`)))) {
                            ev.sender.sendMessage(`§c平和主義国は戦争を仕掛けることはできません`)
                            break
                        }
                        if(isWarNowCountry(country.name,getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`)))) {
                            ev.sender.sendMessage(`§c既に戦争中です`)
                            break
                        }
                        if(isPeaceCountry(country.name)) {
                            ev.sender.sendMessage(`§c平和主義国には戦争を仕掛けることはできません`)
                            break
                        }
                        if(isFriendCountry(country.name,findCountry(ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]).name)) {
                            ev.sender.sendMessage(`§c同盟国には戦争を仕掛けることはできません`)
                            break
                        }
                        setScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_dow${country.number}`,1)
                        setScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_limit${country.number}`,config.untilStartWar)
                        ev.sender.sendMessage(`§c[MakeCountry]§r\n${getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`))} §r§aが§r ${country.name} §r§aに宣戦布告した`)
                        break;
                    }
                    case `delete`: {
                        try {
                            const b = ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]
                        } catch (error) {
                            ev.sender.sendMessage(`§c国名を入力してください`)
                            break
                        }
                        const country = findCountry(ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1])
                        if(!country || country.number < 1) {
                            ev.sender.sendMessage(`§c存在しない国です`)
                            break
                        }
                        if(!getScore(`${getScore(ev.sender,`mc_pcountries`)}`,`mc_dow${country.number}`)) {
                            ev.sender.sendMessage(`§cこの国に宣戦布告してません`)
                            break
                        }
                        world.scoreboard.getObjective(`mc_limit${country.number}`).removeParticipant(`${getScore(ev.sender,`mc_pcountries`)}`)
                        world.scoreboard.getObjective(`mc_dow${country.number}`).removeParticipant(`${getScore(ev.sender,`mc_pcountries`)}`)
                        ev.sender.sendMessage(`§a宣戦布告を取り消しました`)
                        break;
                    }
                    default: {
                        ev.sender.sendMessage(`§c存在しないサブコマンドです\nサブコマンド一覧\n§b${config.prefix}dofwar req <国名> §f宣戦布告をします\n§b${config.prefix}alliance delete <国名> §f宣戦布告を破棄します`)
                        break
                    }
                }
                break
            }
            default:{
                if(config.notCommandError) ev.sender.sendMessage(`§c存在しないコマンド: ${command}`)
                break;
            }
        }
    })
})
*/
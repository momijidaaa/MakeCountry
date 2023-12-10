import { Player, system, world } from "../world";
import config from "../../data/config";
import { PlayerHandler } from "../../lib/utils/handler/player";

/**
 * @typedef {import("../../@types/lib/commands").RegisteredWorldCommandData} RegisteredCommandData
 * @typedef {import("../../@types/lib/commands").WorldCommandData} CommandData
 * @typedef {import("../../@types/lib/commands").WorldCommandOption} CommandOption
 */

const prefix = config.commands.prefix;
/**
 * @beta
 * @author yuki2825624
 */
export class CommandManager {
    load() {

        world.events.on("sendCustomCommand", (ev) => {
            const { sender: player, commandName, message } = ev;
            if (commandName) {
                const cmd = this.getAll().find(c => c.name === commandName || c.aliases.includes(commandName)), option = { flags: new Map(), member: undefined };
                if (!cmd || player.permission < cmd?.permission) return player.sendMessage(`コマンド: "${commandName}" は登録されていないか、使用する権限がありません。`);
                if (!message) return system.run(() => { cmd.callback(player, [], option); });
                const [msg, ...flags] = message.split("?");
                const args = msg.trim().split(/ +/).filter(v => v.trim() != "");
                if (flags.length > 0) option.flags = new Map(flags.map(v => v.trim().split(/ +/)).map(([key, ...value]) => [key.toLowerCase(), value?.join(" ").trim() || null]));
                if (option.flags.has("h")) {
                    player.sendMessage(`§a=== Showing help to ${cmd.name} command ===`);
                    player.sendMessage(`§a${prefix}${cmd.name}${cmd.aliases?.length > 0 ? ` [ ${cmd.aliases.join(", ")} ]` : ""} : ${cmd.permission} `);
                    player.sendMessage(`§a${cmd.description}:`);
                    cmd.usages.forEach((usage) => { player.sendMessage(`§a- ${prefix}${usage}`); });
                    return;
                }

                if (cmd.target) {
                    option.member = world.getPlayers().find((player) => {
                        let name = args[0];
                        const match = args.join(" ").match(/".*?"/g);
                        if (args[0].includes('"') && match != null) name = match[0];
                        return player.name.toLowerCase().includes(name.replace(/"|\\|@/g, "").toLowerCase());
                    });
                    if (!option.member) return player.sendMessage("§cプレイヤーが見つかりませんでした。");
                    if (!cmd.target?.high && option.member.permission > player.permission) return player.sendMessage("§c権限が不足しています。");
                    if (!cmd.target?.self && player.id === option.member.id) return player.sendMessage("§c自分自身をターゲットにすることは出来ません。");
                };

                system.run(() => {
                    cmd.callback(player, args, option);
                });
            }
            else {

            }

        })
    }

    getAll() {
        return CommandManager.Commands;
    }

    /**
     * @param {CommandData} data
     * @param {(player: Player, args: string[], option: CommandOption) => void} callback 
     */
    register(data, callback) {
        const cmd = config.commands[data.name];
        if (!cmd) return console.warn(`${data.name} was not registered`);
        const { permission, valid } = cmd;
        if (valid) CommandManager.Commands.push({ ...data, permission, callback });
    }

    /** @type {RegisteredCommandData[]} */
    static Commands = [];
}

const commands = new CommandManager();

commands.register({
    name: "help",
    description: "コマンドのヘルプを表示します",
    usages: [
        "help",
        "help ?h",
        "help [page: int]",
        "help [commandName: string]"
    ],
    aliases: ["h", "?"]
}, (player, args) => {
    const CanUseCommands = commands.getAll().filter(c => c.permission <= player.permission);
    let helpPage = args[0] ? Number(args[0]) : 1;
    if (Math.ceil(CanUseCommands.length / 7) < helpPage) return player.sendMessage(`§cページ: ${helpPage} は無効です。`);
    if (helpPage > 0) {
        let HelpPanel = `§a=== Showing to help ( ${prefix}help [page: int] ) ${helpPage} / ${Math.ceil(CanUseCommands.length / 7)} ===\n`;
        for (let i = helpPage * 7 - 7; i < helpPage * 7; i++)
            HelpPanel += CanUseCommands[i] ? `§a${prefix}${CanUseCommands[i].name} §r- ${CanUseCommands[i].description}\n` : ``;
        player.sendMessage(HelpPanel);
    } else if (args[0]) {
        const cmd = CanUseCommands.find((c) => c.name === args[0] || c.aliases.includes(args[0]));
        if (cmd) {
            player.sendMessage(`§a=== Showing help to ${cmd.name} command ===`);
            player.sendMessage(`§a${prefix}${cmd.name}${cmd.aliases.length > 0 ? ` [ ${cmd.aliases.join(", ")} ]` : ""} : ${cmd.permission} `);
            player.sendMessage(`§a${cmd.description}:`);
            cmd.usages.forEach((usage) => { player.sendMessage(`§a- ${prefix}${usage}`); });
        } else {
            player.sendMessage(`§cコマンド: "${args[0]}"は登録されていないか、実行する権限がありません。`);
        }
    }
})

commands.register({
    name: "ban",
    description: "プレイヤーをBanします",
    usages: [
        "ban ?h",
        "ban <player: name>",
        "ban <player: name> ?m [message: string]",
        "ban <player: name> ?r [reason: string]",
        "ban <player: name> ?t [time: string]",
    ],
    aliases: ["b"],
    target: true
}, (player, args, option) => {
    const { member, flags } = option;
    const handler = new PlayerHandler(member);
    handler.ban({ message: flags.get("m"), reason: flags.get("r"), time: flags.get("t") });
})

commands.register({
    name: "unban",
    description: "プレイヤーのBanを解除します",
    usages: [
        "unban ?h",
        "unban <player: name>"
    ],
    aliases: ["ub"],
    target: true
}, (player, args, option) => {
    const { member, flags } = option;
    const handler = new PlayerHandler(member);
    handler.unban();
})

commands.register({
    name: "kick",
    description: "プレイヤーをキックします",
    usages: [
        "kick ?h",
        "ban <player: name>",
        "ban <player: name> ?m [message: string]",
        "kick <player: name> ?r [reason: string]"
    ],
    aliases: ["k"],
    target: true
}, (player, args, option) => {
    const { member, flags } = option;
    const handler = new PlayerHandler(member);
    handler.kick({ message: flags.get("m"), reason: flags.get("r") });
})

commands.register({
    name: "disconnect",
    description: "プレイヤーを切断します",
    usages: [
        "disconnect ?h",
        "disconnect <player: name>",
        "disconnect <player: name> ?r [reason: string]"
    ],
    aliases: ["dis", "dc"],
    target: { self: true }
}, (player, args, option) => {
    const { member, flags } = option;
    const handler = new PlayerHandler(member);
    handler.disconnect({ reason: flags.get("r") });
})

commands.register({
    name: "freeze",
    description: "プレイヤーを移動不可にします",
    usages: [
        "freeze ?h",
        "freeze <player: name>",
        "freeze <player: name> ?r [reason: string]",
        "freeze <player: name> ?t [time: string]"
    ],
    aliases: ["f"],
    target: { self: true }
}, (player, args, option) => {
    const { member, flags } = option;
    const handler = new PlayerHandler(member);
    handler.freeze({ reason: flags.get("r"), time: flags.get("t") });
})

commands.register({
    name: "unfreeze",
    description: "プレイヤーの移動不可を解除します",
    usages: [
        "unfreeze ?h",
        "unfreeze <player: name>"
    ],
    aliases: ["uf"],
    target: { self: true }
}, (player, args, option) => {
    const { member, flags } = option;
    const handler = new PlayerHandler(member);
    handler.unfreeze();
})

commands.register({
    name: "timeout",
    description: "プレイヤーを発言不可にします",
    usages: [
        "timeout ?h",
        "timeout <player: name>",
        "timeout <player: name> ?r [reason: string]",
        "timeout <player: name> ?t [time: string]"
    ],
    aliases: ["mute", "t"],
    target: { self: true }
}, (player, args, option) => {
    const { member, flags } = option;
    const handler = new PlayerHandler(member);
    handler.timeout({ reason: flags.get("r"), time: flags.get("t") });
})

commands.register({
    name: "untimeout",
    description: "プレイヤーの発言不可を解除します",
    usages: [
        "untimeout ?h",
        "untimeout <player: name>",
    ],
    aliases: ["unmute", "ut"],
    target: { self: true }
}, (player, args, option) => {
    const { member, flags } = option;
    const handler = new PlayerHandler(member);
    handler.untimeout();
})

commands.register({
    name: "notify",
    description: "管理者通知の有無を設定します",
    usages: [
        "notify",
        "notify ?h",
        "notify ?true",
        "notify ?false"
    ]
}, (player, args, option) => {
    const { flags } = option;
    world.logger.debug(player.name)
    if (flags.has("true")) {
        player.addTag("notify");
        player.sendMessage("§a管理者通知を有効にしました。");
    }
    else if (flags.has("false")) {
        player.removeTag("notify");
        player.sendMessage("§c管理者通知を無効にしました。");
    }
    else {
        if (player.hasTag("notify")) {
            player.removeTag("notify")
            player.sendMessage("§c管理者通知を無効にしました。");
        }
        else {
            player.addTag("notify");
            player.sendMessage("§a管理者通知を有効にしました。");
        }
    }
})
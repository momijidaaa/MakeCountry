/*
    新しく入ってきた同志へ👊
    このコードは史上最恐の🍝だ
    しかも最高品質となっている
    現在はプレイヤーが増えるごとに重くなってしまっている(20人超えるととても重い)ため何とか軽くしたい
    そのために諸君には🍝を食べてもらい最適化してほしい
    主に重いのは繰り返しや権限関係の部分だろう(system.runInterval(() => ...) やlib/util.js、lib/events.jsなどである)
    ついでにフォルダとかも新しく作ってもらったりしても構わない
    MakeCountryとearthtpの2種類のビヘイビアがあるがどちらも変えて構わない

    地球の命運は諸君ら🫵に託された
    ふぁいと！！💪
 */

import { system, world } from "@minecraft/server";

import "./lib/commands";

import "./lib/events";

import "./lib/interval";

import "./lib/jobs";

import "./lib/scripteventCommand";

import "./lib/combattag";

import "./lib/test";

import "./lib/item";

import "./lib/custom_component";

import "./lib/war";

import "./lib/penname";

import "./lib/chest_shop";

import "./lib/ranking";

import "./lib/fixdata";

import "./lib/datamove";

import "./api/command";

const version = "ver.KaroEarth"


world.afterEvents.worldLoad.subscribe(() => {
    world.sendMessage({ translate: `world.message.addon`, with: [version] });
});

world.afterEvents.playerSpawn.subscribe((ev) => {
    const { player, initialSpawn } = ev;
    if (!initialSpawn) return;
    player.sendMessage({
        rawtext: [
            { text: `§6------------------------------------------------------------------------------------------\n\n` },
            { translate: `world.message.addon`, with: [version] },
            { text: `\n\n§9Support Discord Server\n§ahttps://discord.gg/8S9YhNaHjD\n\n§cYoutube\n§ahttps://youtube.com/@KaronDAAA\n\n§bTwitter\n§ahttps://twitter.com/KaronDAAA\n\n§6------------------------------------------------------------------------------------------\n` }
        ]
    });
});

import "./plugin_config";

system.beforeEvents.watchdogTerminate.subscribe((ev) => {
    ev.cancel = true;
})
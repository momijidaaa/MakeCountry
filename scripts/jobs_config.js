export default {
    //jobsを有効化するか
    validity: true,
    maxEmploymentNum: 3, //同時に就ける職業の最大数

    showRewardMessage: true, //メッセージをアクションバーに表示するか

    //職業一覧
    jobsList: [
        //狩人
        {
            id: `hunter`, //職業ID(就いてるときに mcjobs_ID のtagが付く)
            name: `hunter`, //formに表示する職業名(翻訳キー(lang)も可能)
        },
        //農家
        {
            id: `farmer`,
            name: `farmer`,
        },
        //鉱夫
        {
            id: `miner`,
            name: `miner`,
        },
        //木こり
        {
            id: `woodcutter`,
            name: `woodcutter`,
        },
        //漁師
        {
            id: `fisherman`,
            name: `fisherman`,
        },
        //土掘り士
        {
            id: `dirtdigger`,
            name: `dirtdigger`,
        },
        //砂掘り士
        {
            id: `sanddigger`,
            name: `sanddigger`,
        },

        //ここに追加可能
    ],

    fishingReward: { min: 20, max: 35 },
    woodCutReward: { min: 2, max: 7 }, //木を切ったときにもらえるお金の変域
    cropHarvestReward: { min: 5, max: 25 }, //作物収穫時にもらえるお金の変域
    cocoaHarvestReward: { min: 5, max: 25 }, //ココア収穫時にもらえるお金の変域

    oreMiningReward: { min: 5, max: 20 }, //鉱石系ブロックを掘ったときにもらえるお金の変域
    stoneMiningReward: { min: 1, max: 10 }, //石系ブロックを掘ったときにもらえるお金の変域

    skeletonKillReward: { min: 10, max: 25 }, //スケルトンを倒したときにもらえるお金の変域
    strayKillReward: { min: 10, max: 25 }, //ストレイを倒したときにもらえるお金の変域
    zombieKillReward: { min: 10, max: 25 }, //ゾンビを倒したときにもらえるお金の変域
    huskKillReward: { min: 10, max: 30 }, //ハスクを倒したときにもらえるお金の変域
    zombieKillReward: { min: 10, max: 25 }, //ゾンビを倒したときにもらえるお金の変域
    slimeKillReward: { min: 10, max: 15 }, //スライムを倒したときにもらえるお金の変域
    spiderKillReward: { min: 10, max: 30 }, //クモを倒したときにもらえるお金の変域
    cave_spiderKillReward: { min: 10, max: 30 }, //洞窟クモを倒したときにもらえるお金の変域
    creeper_spiderKillReward: { min: 15, max: 30 }, //クリーパーを倒したときにもらえるお金の変域
    endermanKillReward: { min: 15, max: 30 }, //エンダーマンを倒したときにもらえるお金の変域
    endermiteKillReward: { min: 15, max: 30 }, //エンダーマイトを倒したときにもらえるお金の変域
    evocation_illagerKillReward: { min: 15, max: 35 }, //エヴォーカーを倒したときにもらえるお金の変域
    guardianKillReward: { min: 15, max: 30 }, //ガーディアンを倒したときにもらえるお金の変域
    pillagerKillReward: { min: 15, max: 30 }, //ピリジャーを倒したときにもらえるお金の変域
    shulkerKillReward: { min: 15, max: 30 }, //シュルカーを倒したときにもらえるお金の変域
    silverfishKillReward: { min: 15, max: 20 }, //シルバーフィッシュを倒したときにもらえるお金の変域
    phantomKillReward: { min: 10, max: 30 }, //ファントムを倒したときにもらえるお金の変域
    ravagerKillReward: { min: 10, max: 40 }, //ラヴェジャーを倒したときにもらえるお金の変域
    vexKillReward: { min: 10, max: 30 }, //ヴェックスを倒したときにもらえるお金の変域
    vindicatorKillReward: { min: 10, max: 30 }, //ヴィンディケーターを倒したときにもらえるお金の変域
    zombie_villagerKillReward: { min: 10, max: 30 }, //村人ゾンビを倒したときにもらえるお金の変域
    witchKillReward: { min: 10, max: 30 }, //ウィッチを倒したときにもらえるお金の変域

    skeleton_horseKillReward: { min: 10, max: 20 }, //スケルトンホースを倒したときにもらえるお金の変域
    zombie_horseKillReward: { min: 10, max: 20 }, //ゾンビホースを倒したときにもらえるお金の変域

    blazeKillReward: { min: 20, max: 30 }, //ブレイズを倒したときにもらえるお金の変域
    ghastKillReward: { min: 20, max: 30 }, //ガストを倒したときにもらえるお金の変域
    hoglinKillReward: { min: 10, max: 35 }, //ホグリンを倒したときにもらえるお金の変域
    zoglinKillReward: { min: 10, max: 30 }, //ゾグリンを倒したときにもらえるお金の変域
    magma_cubeKillReward: { min: 10, max: 25 }, //マグマキューブを倒したときにもらえるお金の変域
    zombie_pigmanKillReward: { min: 20, max: 40 }, //ゾンビピッグマンを倒したときにもらえるお金の変域
    piglinKillReward: { min: 20, max: 40 }, //ピグリンを倒したときにもらえるお金の変域
    piglin_bruteKillReward: { min: 20, max: 50 }, //ピグリンブルートを倒したときにもらえるお金の変域
    striderKillReward: { min: 20, max: 30 }, //ストライダーを倒したときにもらえるお金の変域
    striderKillReward: { min: 20, max: 40 }, //ウィザースケルトンを倒したときにもらえるお金の変域

    allayKillReward: { min: 1, max: 40 }, //アレイを倒したときにもらえるお金の変域
    beeKillReward: { min: 1, max: 20 }, //ハチを倒したときにもらえるお金の変域
    batKillReward: { min: 1, max: 20 }, //コウモリを倒したときにもらえるお金の変域
    axolotlKillReward: { min: 1, max: 30 }, //ウーパールーパーを倒したときにもらえるお金の変域
    camelKillReward: { min: 1, max: 35 }, //ラクダを倒したときにもらえるお金の変域
    catKillReward: { min: 1, max: 35 }, //猫を倒したときにもらえるお金の変域
    ocelotKillReward: { min: 1, max: 30 }, //ヤマネコを倒したときにもらえるお金の変域
    pandaKillReward: { min: 1, max: 30 }, //パンダを倒したときにもらえるお金の変域
    parrotKillReward: { min: 1, max: 20 }, //オウムを倒したときにもらえるお金の変域
    snifferKillReward: { min: 1, max: 40 }, //スニッファーを倒したときにもらえるお金の変域
    wolfKillReward: { min: 1, max: 20 }, //オオカミを倒したときにもらえるお金の変域

    dolphinKillReward: { min: 1, max: 10 }, //イルカを倒したときにもらえるお金の変域
    codKillReward: { min: 1, max: 10 }, //タラを倒したときにもらえるお金の変域
    pufferfishKillReward: { min: 1, max: 10 }, //フグを倒したときにもらえるお金の変域
    salmonKillReward: { min: 1, max: 10 }, //鮭を倒したときにもらえるお金の変域
    tropicalfishKillReward: { min: 1, max: 10 }, //熱帯魚を倒したときにもらえるお金の変域
    turtleKillReward: { min: 1, max: 15 }, //カメを倒したときにもらえるお金の変域

    pigKillReward: { min: 1, max: 20 }, //豚を倒したときにもらえるお金の変域
    chickenKillReward: { min: 1, max: 20 }, //ニワトリを倒したときにもらえるお金の変域
    cowKillReward: { min: 1, max: 20 }, //牛を倒したときにもらえるお金の変域
    sheepKillReward: { min: 1, max: 20 }, //羊を倒したときにもらえるお金の変域
    rabbitKillReward: { min: 1, max: 20 }, //ウサギを倒したときにもらえるお金の変域
    donkeyKillReward: { min: 1, max: 20 }, //ロバを倒したときにもらえるお金の変域
    horseKillReward: { min: 1, max: 20 }, //馬を倒したときにもらえるお金の変域
    llamaKillReward: { min: 1, max: 20 }, //ラマを倒したときにもらえるお金の変域
    muleKillReward: { min: 1, max: 20 }, //ラバを倒したときにもらえるお金の変域
    foxKillReward: { min: 1, max: 20 }, //きつねを倒したときにもらえるお金の変域
    frogKillReward: { min: 1, max: 20 }, //カエルを倒したときにもらえるお金の変域
    tadpoleKillReward: { min: 1, max: 20 }, //オタマジャクシを倒したときにもらえるお金の変域
    squidKillReward: { min: 1, max: 20 }, //イカを倒したときにもらえるお金の変域
    glow_squidKillReward: { min: 1, max: 20 }, //光るイカを倒したときにもらえるお金の変域
    goatKillReward: { min: 1, max: 20 }, //ヤギを倒したときにもらえるお金の変域
    mooshroomKillReward: { min: 1, max: 20 }, //ムーシュルームを倒したときにもらえるお金の変域
    polar_bearKillReward: { min: 1, max: 25 }, //ホッキョクグマを倒したときにもらえるお金の変域

    villagerKillReward: { min: 20, max: 30 }, //村人を倒したときにもらえるお金の変域
    wandering_traderKillReward: { min: 20, max: 30 }, //行商人を倒したときにもらえるお金の変域
    trader_llamaKillReward: { min: 20, max: 30 }, //行商人のラマを倒したときにもらえるお金の変域

    iron_golemKillReward: { min: 20, max: 50 }, //アイアンゴーレムを倒したときにもらえるお金の変域
    snow_golemKillReward: { min: 20, max: 35 }, //スノーゴーレムを倒したときにもらえるお金の変域

    elder_guardianKillReward: { min: 200, max: 600 }, //エルダーガーディアンを倒したときにもらえるお金の変域
    wardenKillReward: { min: 1000, max: 3000 }, //ウォーデンを倒したときにもらえるお金の変域
    witherKillReward: { min: 2000, max: 6000 }, //ウィザーを倒したときにもらえるお金の変域
    ender_dragonKillReward: { min: 3000, max: 7000 }, //エンダードラゴンを倒したときにもらえるお金の変域

    boatKillReward: { min: 0, max: 0 }, //ボートをこわしたときにもらえるお金の変域
    chest_boatKillReward: { min: 0, max: 0 }, //チェスト付きボートをこわしたときにもらえるお金の変域
    chest_minecartKillReward: { min: 0, max: 0 }, //チェスト付きトロッコをこわしたときにもらえるお金の変域
    minecartKillReward: { min: 0, max: 0 }, //トロッコをこわしたときにもらえるお金の変域
    command_block_minecartKillReward: { min: 0, max: 0 }, //コマンドブロック付きトロッコをこわしたときにもらえるお金の変域
    hopper_minecartKillReward: { min: 0, max: 0 }, //ホッパー付きトロッコをこわしたときにもらえるお金の変域
    tnt_minecartKillReward: { min: 0, max: 0 }, //TNT付きトロッコをこわしたときにもらえるお金の変域
    armor_standKillReward: { min: 0, max: 0 }, //防具立てをこわしたときにもらえるお金の変域

    otherMobkillReward: { min: 1, max: 10 }, //その他のエンティティを倒したときにもらえるお金の変域
};
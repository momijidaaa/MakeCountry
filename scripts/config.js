/* 
-+設定について+-
false = いいえ
true = はい

min = 最小値
max = 最大値
*/

export const configs = {

    //チャットの設定
    countryLeft: true, //チャット時に名前の横に国籍を表示するか
    noCountry: `無国籍`, //無国籍の場合の国籍の部分の表示
    sendChatToWebSocket: true, //通常のチャットメッセージをWebSocket及びafterEvents.chatSendで受信できるようにするか
    sendCommandToWebSocket: true, //カスタムコマンド使用時のメッセージをWebSocket及びafterEvents.chatSendで受信できるようにするか
    notCommandError: true, //MakeCountryにないコマンドが入力されたときにチャットにメッセージを出すか

    //所属国以外の国での動作の設定
    noPlaceInCountry: true , //所属国以外の国にブロックを置けないようにするか
    noBreakInCountry: true , //所属国以外の国でブロックを壊せないようにするか
    noUseInCountry: true , //所属国以外の国でアイテムを使えないようにするか
    noMobAttackInCountry: true , //所属国以外のエンティティを倒せないようにするか

    //荒野(国じゃない土地)での動作の設定
    noPlaceInWilderness: false , //荒野(国じゃない土地)にブロックを置けないようにするか
    noBreakInWilderness: false , //荒野(国じゃない土地)でブロックを壊せないようにするか
    noExplodeInWilderness: false , //荒野(国じゃない土地)で爆発物が爆発しないようにするか
    noUseInWilderness: false , //荒野(国じゃない土地)でアイテムを使えないようにするか
    noMobAttackInWilderness: false , //荒野(国じゃない土地)でエンティティに攻撃できないようにするか

    //特別区域(管理者が設定可能)での動作の設定
    noPlaceInSpecialZone: true , //特別区域(管理者が設定可能)にブロックを置けないようにするか
    noBreakInSpecialZone: true , //特別区域(管理者が設定可能)でブロックを壊せないようにするか
    noExplodeInSpecialZone: true , //特別区域(管理者が設定可能)で爆発物が爆発しないようにするか
    noSpawnEntityInSpecialZone: true , //特別区域でモブをスポーンしないようにするか
    noUseInSpecialZone: false , //特別区域でアイテムを使えないようにするか
    noMobAttackInSpecialZone: false , //特別区域でエンティティを倒せないようにするか

    //建国関係の設定
    makeCountryCost: 10000, //建国にかかるお金
    buyChunkCost: 3000, //領土の追加購入にかかるお金(1チャンク)
    sellChunk: 1000, //購入したチャンクを売るともらえる金額(1チャンク)
    firstPeace: true, //建国時に平和主義として設定するかどうか

    //金稼ぎ系
    showRewardMessage: true , //メッセージをアクションバーに表示するか

    woodCutReward: {min: 1,max: 10}, //木を切ったときにもらえるお金の変域
    oreMiningReward: {min: 5,max: 20}, //鉱石系ブロックを掘ったときにもらえるお金の変域
    stoneMiningReward: {min: 1,max: 10}, //石系ブロックを掘ったときにもらえるお金の変域

    skeletonKillReward: {min: 10,max: 20}, //スケルトンを倒したときにもらえるお金の変域
    strayKillReward: {min: 10,max: 20}, //ストレイを倒したときにもらえるお金の変域
    zombieKillReward: {min: 10,max: 20}, //ゾンビを倒したときにもらえるお金の変域
    huskKillReward: {min: 10,max: 20}, //ハスクを倒したときにもらえるお金の変域
    zombieKillReward: {min: 10,max: 20}, //ゾンビを倒したときにもらえるお金の変域
    slimeKillReward: {min: 10,max: 20}, //スライムを倒したときにもらえるお金の変域
    spiderKillReward: {min: 10,max: 20}, //クモを倒したときにもらえるお金の変域
    cave_spiderKillReward: {min: 10,max: 20}, //洞窟クモを倒したときにもらえるお金の変域
    creeper_spiderKillReward: {min: 15,max: 20}, //クリーパーを倒したときにもらえるお金の変域
    endermanKillReward: {min: 15,max: 20}, //エンダーマンを倒したときにもらえるお金の変域
    endermiteKillReward: {min: 15,max: 20}, //エンダーマイトを倒したときにもらえるお金の変域
    evocation_illagerKillReward: {min: 15,max: 20}, //エヴォーカーを倒したときにもらえるお金の変域
    guardianKillReward: {min: 15,max: 20}, //ガーディアンを倒したときにもらえるお金の変域
    pillagerKillReward: {min: 15,max: 20}, //ピリジャーを倒したときにもらえるお金の変域
    shulkerKillReward: {min: 15,max: 20}, //シュルカーを倒したときにもらえるお金の変域
    silverfishKillReward: {min: 15,max: 20}, //シルバーフィッシュを倒したときにもらえるお金の変域
    phantomKillReward: {min: 10,max: 20}, //ファントムを倒したときにもらえるお金の変域
    ravagerKillReward: {min: 10,max: 20}, //ラヴェジャーを倒したときにもらえるお金の変域
    vexKillReward: {min: 10,max: 20}, //ヴェックスを倒したときにもらえるお金の変域
    vindicatorKillReward: {min: 10,max: 20}, //ヴィンディケーターを倒したときにもらえるお金の変域
    zombie_villagerKillReward: {min: 10,max: 20}, //村人ゾンビを倒したときにもらえるお金の変域
    witchKillReward: {min: 10,max: 20}, //ウィッチを倒したときにもらえるお金の変域
    
    skeleton_horseKillReward: {min: 10,max: 20}, //スケルトンホースを倒したときにもらえるお金の変域
    zombie_horseKillReward: {min: 10,max: 20}, //ゾンビホースを倒したときにもらえるお金の変域

    blazeKillReward: {min: 20,max: 30}, //ブレイズを倒したときにもらえるお金の変域
    ghastKillReward: {min: 20,max: 30}, //ガストを倒したときにもらえるお金の変域
    hoglinKillReward: {min: 20,max: 30}, //ホグリンを倒したときにもらえるお金の変域
    zoglinKillReward: {min: 20,max: 30}, //ゾグリンを倒したときにもらえるお金の変域
    magma_cubeKillReward: {min: 20,max: 30}, //マグマキューブを倒したときにもらえるお金の変域
    zombie_pigmanKillReward: {min: 20,max: 30}, //ゾンビピッグマンを倒したときにもらえるお金の変域
    piglinKillReward: {min: 20,max: 30}, //ピグリンを倒したときにもらえるお金の変域
    piglin_bruteKillReward: {min: 20,max: 30}, //ピグリンブルートを倒したときにもらえるお金の変域
    striderKillReward: {min: 20,max: 30}, //ストライダーを倒したときにもらえるお金の変域
    striderKillReward: {min: 20,max: 30}, //ウィザースケルトンを倒したときにもらえるお金の変域

    allayKillReward: {min: 1,max: 10}, //アレイを倒したときにもらえるお金の変域
    beeKillReward: {min: 1,max: 10}, //ハチを倒したときにもらえるお金の変域
    batKillReward: {min: 1,max: 10}, //コウモリを倒したときにもらえるお金の変域
    axolotlKillReward: {min: 1,max: 10}, //ウーパールーパーを倒したときにもらえるお金の変域
    camelKillReward: {min: 1,max: 10}, //ラクダを倒したときにもらえるお金の変域
    catKillReward: {min: 1,max: 10}, //猫を倒したときにもらえるお金の変域
    ocelotKillReward: {min: 1,max: 10}, //ヤマネコを倒したときにもらえるお金の変域
    pandaKillReward: {min: 1,max: 10}, //パンダを倒したときにもらえるお金の変域
    parrotKillReward: {min: 1,max: 10}, //オウムを倒したときにもらえるお金の変域
    snifferKillReward: {min: 1,max: 10}, //スニッファーを倒したときにもらえるお金の変域
    wolfKillReward: {min: 1,max: 10}, //オオカミを倒したときにもらえるお金の変域

    dolphinKillReward: {min: 1,max: 10}, //イルカを倒したときにもらえるお金の変域
    codKillReward: {min: 1,max: 10}, //タラを倒したときにもらえるお金の変域
    pufferfishKillReward: {min: 1,max: 10}, //フグを倒したときにもらえるお金の変域
    salmonKillReward: {min: 1,max: 10}, //鮭を倒したときにもらえるお金の変域
    tropicalfishKillReward: {min: 1,max: 10}, //熱帯魚を倒したときにもらえるお金の変域
    turtleKillReward: {min: 1,max: 10}, //カメを倒したときにもらえるお金の変域

    pigKillReward: {min: 1,max: 10}, //豚を倒したときにもらえるお金の変域
    chickenKillReward: {min: 30,max: 50}, //ニワトリを倒したときにもらえるお金の変域
    cowKillReward: {min: 1,max: 10}, //牛を倒したときにもらえるお金の変域
    sheepKillReward: {min: 1,max: 10}, //羊を倒したときにもらえるお金の変域
    rabbitKillReward: {min: 1,max: 10}, //ウサギを倒したときにもらえるお金の変域
    donkeyKillReward: {min: 1,max: 10}, //ロバを倒したときにもらえるお金の変域
    horseKillReward: {min: 1,max: 10}, //馬を倒したときにもらえるお金の変域
    llamaKillReward: {min: 1,max: 10}, //ラマを倒したときにもらえるお金の変域
    muleKillReward: {min: 1,max: 10}, //ラバを倒したときにもらえるお金の変域
    foxKillReward: {min: 1,max: 10}, //きつねを倒したときにもらえるお金の変域
    frogKillReward: {min: 1,max: 10}, //カエルを倒したときにもらえるお金の変域
    tadpoleKillReward: {min: 1,max: 10}, //オタマジャクシを倒したときにもらえるお金の変域
    squidKillReward: {min: 1,max: 10}, //イカを倒したときにもらえるお金の変域
    glow_squidKillReward: {min: 1,max: 10}, //光るイカを倒したときにもらえるお金の変域
    goatKillReward: {min: 1,max: 10}, //ヤギを倒したときにもらえるお金の変域
    mooshroomKillReward: {min: 1,max: 10}, //ムーシュルームを倒したときにもらえるお金の変域
    polar_bearKillReward: {min: 1,max: 10}, //ホッキョクグマを倒したときにもらえるお金の変域

    villagerKillReward: {min: 20,max: 30}, //村人を倒したときにもらえるお金の変域
    wandering_traderKillReward: {min: 20,max: 30}, //行商人を倒したときにもらえるお金の変域
    trader_llamaKillReward: {min: 20,max: 30}, //行商人のラマを倒したときにもらえるお金の変域

    iron_golemKillReward: {min: 30,max: 50}, //アイアンゴーレムを倒したときにもらえるお金の変域
    snow_golemKillReward: {min: 30,max: 50}, //スノーゴーレムを倒したときにもらえるお金の変域
    
    elder_guardianKillReward: {min: 300,max: 500}, //エルダーガーディアンを倒したときにもらえるお金の変域
    wardenKillReward: {min: 300,max: 500}, //ウォーデンを倒したときにもらえるお金の変域
    witherKillReward: {min: 3000,max: 5000}, //ウィザーを倒したときにもらえるお金の変域
    ender_dragonKillReward: {min: 3000,max: 5000}, //エンダードラゴンを倒したときにもらえるお金の変域

    boatKillReward: {min: 0,max: 0}, //ボートをこわしたときにもらえるお金の変域
    chest_boatKillReward: {min: 0,max: 0}, //チェスト付きボートをこわしたときにもらえるお金の変域
    chest_minecartKillReward: {min: 0,max: 0}, //チェスト付きトロッコをこわしたときにもらえるお金の変域
    minecartKillReward: {min: 0,max: 0}, //トロッコをこわしたときにもらえるお金の変域
    command_block_minecartKillReward: {min: 0,max: 0}, //コマンドブロック付きトロッコをこわしたときにもらえるお金の変域
    hopper_minecartKillReward: {min: 0,max: 0}, //ホッパー付きトロッコをこわしたときにもらえるお金の変域
    tnt_minecartKillReward: {min: 0,max: 0}, //TNT付きトロッコをこわしたときにもらえるお金の変域
    armor_standKillReward: {min: 0,max: 0}, //防具立てをこわしたときにもらえるお金の変域

    otherMobkillReward: {min: 1,max: 10}, //その他のエンティティを倒したときにもらえるお金の変域

    //その他の設定
    coreBreakMessage: true, //戦争中のコア破壊時にメッセージを表示するか
    showCoreDurableValueOnBreak: true, //戦争中のコア破壊時に耐久値をアクションバー表示するか
    coreDurableValue: 50 , //コアの耐久地
    untilNextChangePeace: 180 , //平和主義の状態を切り替えた後、次に変えるときのクールタイム(分) デフォルト値(180分(3時間))
    noExplodeInCountry: false, //各国の領土内で爆発物が爆発しないようにするか
    taxTime: 720, //税金を何分ごとに徴収するか(現実時間) デフォルト値(1440分(24時間))
    taxFreeTime: 3, //建国から何回目の徴収まで免税にするか(デフォルトでは3)
    taxPerOfPeopleCount: 0.10, //国民1人あたりの維持費の増加(維持費+(維持費×国民数×〇))
    taxAmount: 50, //通常の国にかかる維持費(1チャンクあたり)
    taxPeaceAmount: 700, //平和主義の場合に追加でかかる維持費(1チャンクあたり)
    deleteCountryReasonNoMoney: 4, //何回連続で徴収時に赤字になったら国を自動的に消すか
    untilStartWar: 4320, //宣戦布告から戦争開始まで最大何分間の猶予を与えるか(現実時間) デフォルト値(4320分(72時間))

    commands: { // commands.jsとconfig.commandsは統一 (大文字不可)
        valid: true,
        prefix: "!",
        help: {
            valid: true,
            permission: 1
        },
        ban: {
            valid: true,
            permission: 4
        },
        unban: {
            valid: true,
            permission: 4
        },
        kick: {
            valid: true,
            permission: 3
        },
        disconnect: {
            valid: true,
            permission: 3
        },
        freeze: {
            valid: true,
            permission: 3
        },
        unfreeze: {
            valid: true,
            permission: 3
        },
        timeout: {
            valid: true,
            permission: 3
        },
        untimeout: {
            valid: true,
            permission: 3
        },
        notify: {
            valid: true,
            permission: 3
        }
    },
    list: {}
};
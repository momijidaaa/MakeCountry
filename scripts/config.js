export default {
    //コマンドのプレフィックス
    prefix: `?`,
    //プレイヤーの初期の所持金
    initialMoney: 1000,
    //所持金をスコアボードで変更できるようにするか(オンラインのプレイヤーのみ)
    getMoneyByScoreboard: false,
    //所持金と連動するスコアボードのオブジェクト名
    moneyScoreboardName: `mc_money`,
    //平和主義切り替えのクールタイム(徴税タイミングごとに-1)
    peaceChangeCooltime: 3,
    //チャットの際にプレイヤー名の左に所属国を表示するか
    showRoleChatLeftName: true,
    //チャットの際にプレイヤー名の左にロール(着いてる中で一番高いロール)を表示するか
    showCountryChatLeftName: false,
    //デフォルトで平和主義にするか
    defaultPeace: true,
    //国を作るのに必要な金
    MakeCountryCost: 30000,
    //デフォルトのチャンクの値段
    defaultChunkPrice: 10000,
    //国際組織の設立にかかる金
    MakeInternationalOrganizationCost: 100000,
    //共通通貨の単位
    MoneyName: `$`,
    //初期の国庫の金
    initialCountryMoney: 0,
    //初期のリソースポイント
    initialCountryResourcePoint: 0,
    //徴税間隔(分)
    taxTimer: 2 * 60,
    //初期設定で税金をパーセント式にするか(falseの場合,定額制)
    taxInstitutionIsPer: true,
    //初期の税率(税額)
    taxPer: 10,
    //建国時に国庫を非公開にするか
    hideCountryMoney: true,
    //特別区域で許可する権限
    specialAllowPermissions: [`entityUse`, `blockUse`],
    //荒野で許可する権限
    wildernessAllowPermissions: [`entityUse`, `blockUse`, `makeCountry`, `buyChunk`, `place`, `break`, `setHome`, `openContainer`],
    //平和主義国の維持費(1チャンク)
    MaintenanceFeePacifistCountries: 500,
    //非平和主義国の維持費(1チャンク)
    MaintenanceFeeNonPeacefulCountries: 50,
    //建国後何回分の徴税をなしにするか
    NonMaintenanceCostAccrualPeriod: 3,
    //1ヵ国におけるロールの最大数(デフォルトのロールも考慮) (3以上)
    maxRoleAmount: 10,
    //プレイヤーマーケットを有効にするかどうか
    playerMarketValidity: true,
    //プレイヤーマーケットの1人あたりの最大出品数
    maxMarketAmount: 10,

    //コンバットタグを有効にするか
    combatTagValidity: true,
    //コンバットタグが付いてる間、Homeコマンドなどを使えなくするか
    combatTagNoTeleportValidity: true,
    //コンバットタグの持続時間
    combatTagSeconds: 30,
};
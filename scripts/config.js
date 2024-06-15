export default {
    //コマンドのプレフィックス
    prefix: `?`,
    //チャットの際にプレイヤー名の左に所属国を表示するか
    showCountryChatLeftName: true,
    //デフォルトで平和主義にするか
    defaultPeace: true,
    //国を作るのに必要な金
    MakeCountryCost: 10000,
    //国際組織の設立にかかる金
    MakeInternationalOrganizationCost: 100000,
    //共通通貨の単位
    MoneyName: `￥`,
    //初期の国庫の金
    initialCountryMoney: 0,
    //初期のリソースポイント
    initialCountryResourcePoint: 0,
    //徴税間隔(分)
    taxTimer: 6 * 60,
    //初期設定で税金をパーセント式にするか(falseの場合,定額制)
    taxInstitutionIsPer: true,
    //初期の税率(税額)
    taxPer: 10,
    //建国時に国庫を非公開にするか
    hideCountryMoney: true,
    //特別区域で許可する権限
    specialAllowPermissions: [`entityUse`, `blockUse`],
    //荒野で許可する権限
    wildernessAllowPermissions: [`entityUse`, `blockUse`],

};
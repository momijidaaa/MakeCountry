import * as MC from "@minecraft/server"
import { convertChunk, setScore , getNameScore , getScore , addScore, findCountry, isWarNowCountry, getNumberScore, isPeaceCountry, isFriendCountry, getCountoryAdjacentChunkAmount} from "./function"
import config from "./config";


MC.world.afterEvents.worldInitialize.subscribe(({propertyRegistry}) => {
  const property = new MC.DynamicPropertiesDefinition();
  property.defineString(`homePoint`,60)
  /* entityに登録 */ 
  propertyRegistry.registerEntityTypeDynamicProperties(property, MC.EntityTypes.get('minecraft:player'));
});

MC.world.beforeEvents.chatSend.subscribe((ev)=>{
    ev.sendToTargets = true
    if(ev.message.startsWith(`:`)) return
    if(!ev.message.startsWith(config.prefix)) {
        let land = getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`))
        if(getScore(ev.sender,`mc_pcountries`) === 0) {
            land = config.noCountry
            if(ev.sender.hasTag(`mc_cc`)) ev.sender.removeTag(`mc_cc`) 
        }
        if(ev.sender.hasTag(`mc_cc`)) {
            for(const cp of MC.world.getPlayers()) {
                if(getScore(ev.sender,`mc_pcountries`) !== getScore(cp,`mc_pcountries`)) continue
                cp.sendMessage(`§c[${land} §r§cチャット]§r ${ev.sender.name} §r§a: §f${ev.message}`)
                ev.cancel = true
            }
            return
        }
        if(!config.countryLeft) {
            MC.world.sendMessage(`<${ev.sender.name}> ${ev.message}`)
            return
        }
        
        MC.world.sendMessage(`<§a${land} §r| ${ev.sender.name}> ${ev.message}`)
        if(!config.sendChatToWebSocket) ev.cancel = true
        return
    }
    if(!config.sendCommandToWebSocket) ev.cancel = true
    MC.system.run(()=>{
        let command
        try {
            command = ev.message.split(` `)[0]
        } catch (error) {
            command = ev.message
        }
        switch(command) {
            case `${config.prefix}money`: {
                ev.sender.sendMessage(`§a所持金: ${MC.world.scoreboard.getObjective(`mc_money`).getScore(ev.sender)}`)
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
                MC.system.runTimeout(()=>{
                    setScore(`特別区域`,`mc_countries`,-1)
                    setScore(`荒野`,`mc_countries`,0)
                },2)
                break;
            }
            case `${config.prefix}msend`: {
                if(!ev.message.endsWith(`${config.prefix}msend`)  && typeof Number(ev.message.split(` `)[1]) === 'number' && ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]) {
                    if(!MC.world.getDimension(ev.sender.dimension.id).getEntities({type: `minecraft:player`,name: `${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]}`})[0]) {
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
                    MC.world.getDimension(ev.sender.dimension.id).getEntities({name: `${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]}`})[0].sendMessage(`${ev.sender.name} §r§aから ${Math.floor(Number(ev.message.split(` `)[1]))}円 を受け取りました`)
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
                if(getScore(convertChunk(Number(loc[0]),Number(loc[2])),`mc_chunk`) && getScore(convertChunk(Number(loc[0]),Number(loc[2])),`mc_chunk`) !== getScore(ev.sender,`mc_pcountries`) && getScore(ev.sender,`mc_pcountries`) > 0) {
                    ev.sender.sendMessage(`§c他国の領土にHomeをセットしてしまっているようです`)
                    break;
                }
                if(getScore(convertChunk(Number(loc[0]),Number(loc[2])),`mc_chunk`) === -1) {
                    ev.sender.sendMessage(`§c特別区域にHomeをセットしてしまっているようです`)
                    break;
                }
                ev.sender.teleport({x: Number(loc[0]) , y: Number(loc[1]) , z: Number(loc[2])},{dimension: MC.world.getDimension(`overworld`)})
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
                MC.world.scoreboard.getObjective(`mc_chunk`).removeParticipant(convertChunk(ev.sender.location.x,ev.sender.location.z))
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
                if(ev.sender.dimension.id !== `minecraft:overworld`) {
                    ev.sender.sendMessage(`§cこのコマンドはオーバーワールドでしか使えません`)
                }
                if(getScore(ev.sender,`mc_money`) < config.buyChunkCost) {
                    ev.sender.sendMessage(`§c金が足りません(必要金額: ${config.buyChunkCost})`)
                    break
                }
                if(getCountoryAdjacentChunkAmount(convertChunk(ev.sender.location.x,ev.sender.location.z),getScore(ev.sender,`mc_pcountries`)) === 0) {
                    ev.sender.sendMessage(`§c隣接していないチャンクは購入不可です`)
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
            case `${config.prefix}cc`: {
                if(getScore(ev.sender,`mc_pcountries`) < 1) {
                    ev.sender.sendMessage(`§cあなたは国に所属していません`)
                    break
                }
                if(ev.sender.hasTag(`mc_cc`)) {
                    ev.sender.removeTag(`mc_cc`)
                    ev.sender.sendMessage(`§a通常チャットへ切り替えました`)
                    break
                }
                if(!ev.sender.hasTag(`mc_cc`)) {
                    ev.sender.addTag(`mc_cc`)
                    ev.sender.sendMessage(`§a国チャットへ切り替えました`)
                    break
                }
            }
            case `${config.prefix}countrychat`: {
                if(getScore(ev.sender,`mc_pcountries`) < 1) {
                    ev.sender.sendMessage(`§cあなたは国に所属していません`)
                    break
                }
                if(ev.sender.hasTag(`mc_cc`)) {
                    ev.sender.removeTag(`mc_cc`)
                    ev.sender.sendMessage(`§a通常チャットへ切り替えました`)
                    break
                }
                if(!ev.sender.hasTag(`mc_cc`)) {
                    ev.sender.addTag(`mc_cc`)
                    ev.sender.sendMessage(`§a国チャットへ切り替えました`)
                    break
                }
            }
            case `${config.prefix}report`: {
                ev.sender.runCommand(`title @s subtitle reportToDiscord ${ev.message.substring(config.prefix.length + 6)}`)    
                ev.sender.runCommand(`title @s subtitle §a`)
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
                if(ev.sender.dimension.id !== `minecraft:overworld`) {
                    ev.sender.sendMessage(`§cこのコマンドはオーバーワールドでしか使えません`)
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
                MC.world.scoreboard.getObjective(`mc_chunk`).removeParticipant(convertChunk(ev.sender.location.x,ev.sender.location.z))
                ev.sender.sendMessage(`§aこのチャンクを${config.sellChunk}円で売りました`)
                break
            }
            case `${config.prefix}help`: {
                ev.sender.sendMessage(`[MakeCountry] コマンド一覧\n§b${config.prefix}checkchunk §f現在のチャンクの情報を確認します\n§b${config.prefix}money §f所持金を確認します\n§b${config.prefix}msend <Number> <PlayerName> §f指定した相手に指定した金額を送金します\n§b${config.prefix}help §fコマンド一覧を出します\n§b${config.prefix}makecountry §f国を作るアイテムを手に入れます\n§b${config.prefix}settingcountry §f国を管理するアイテムを手に入れます\n§b${config.prefix}buychunk §f現在のチャンクを買います\n§b${config.prefix}sellchunk §f現在のチャンクが自分の領土だった場合売ります\n§b${config.prefix}dofwar req <国名> §f宣戦布告をします\n§b${config.prefix}dofwar delete <国名> §f宣戦布告を破棄します\n§b${config.prefix}alliance req <国名> §f同盟の申請をします\n§b${config.prefix}alliance check §f同盟の確認をします\n§b${config.prefix}alliance delete <国名> §f同盟を破棄します\n§b${config.prefix}peacechange §f平和主義を切り替えます(クールタイム: ${config.untilNextChangePeace}分)\n§b${config.prefix}countrylist §f国の一覧を表示します\n§b${config.prefix}sethome §fいつでもテレポートできるHomeを設定します\n§b${config.prefix}home §fセットしたHomeにテレポートします\n§b${config.prefix}checkhome §f現在のHomeを確認します\n§b${config.prefix}surrender §f現在戦争している全ての国に対して降伏します\n§b${config.prefix}leavecountry §f所属国から抜けます\n§b${config.prefix}deposit <Number> §f所属国の国庫に指定した金額を入金します§b${config.prefix}kill §f自滅します§b${config.prefix}report <message> §fモデレーターに報告します`)
                if(ev.sender.isOp()) ev.sender.sendMessage(`§b${config.prefix}setup §fアドオンをセットアップします`)
                if(ev.sender.hasTag(`mc_admin`)) ev.sender.sendMessage(`§b${config.prefix}adminchunk §f現在のチャンクを特別区域にする\n§b${config.prefix}resetchunk §f現在のチャンクを荒野にリセットする`)
                break
            }
            case `${config.prefix}surrender`: {
                if(!ev.sender.hasTag(`countryOwner` || getScore(ev.sender,`mc_pcountries`) < 1)) {
                    ev.sender.sendMessage(`§c権限がありません`)
                    break
                }
                if(MC.world.scoreboard.getObjective(`mc_warNow${getScore(ev.sender,`mc_pcountries`)}`).getScores().length === 0) {
                    ev.sender.sendMessage(`§c戦争をしていません`)
                    break
                }
                //降伏の処理
                let winners = ""
                let winnersAmount = 0
                for(const f of MC.world.scoreboard.getObjective(`mc_warNow${getScore(ev.sender,`mc_pcountries`)}`).getScores()) {
                    //問題個所
                    winners = winners + getNameScore(`mc_countries`,Number(f.participant.displayName)) + `§r\n`
                    winnersAmount++
                    MC.world.scoreboard.getObjective(`mc_warNow${f.participant.displayName}`).removeParticipant(`${getScore(ev.sender,`mc_pcountries`)}`)
                    MC.world.scoreboard.getObjective(`mc_warNow${getScore(ev.sender,`mc_pcountries`)}`).removeParticipant(`${f.participant.displayName}`)
                }
                MC.world.sendMessage(`§c[MakeCountry]§r\n${getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`))}§r§aは§r\n${winners}の計${winnersAmount}ヶ国に降伏した`)
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
                        ev.sender.sendMessage(`§cあなたの所持金よりも多い額を国庫に入金しようとしています(所持金: ${getScore(ev.sender,`mc_money`)})`)
                        break;
                    }
                    addScore(`${getScore(ev.sender,`mc_pcountries`)}`,`countrymoney`,Number(ev.message.split(` `)[1]))
                    addScore(ev.sender,`mc_money`,Number(ev.message.split(` `)[1]) * -1)
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
                        MC.world.sendMessage(`§c[MakeCountry]\n§r${getNameScore(`mc_countries`,getScore(ev.sender,`mc_pcountries`))} §r§aが§r ${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]} §r§aに同盟を申請しました`)
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
                        MC.world.scoreboard.getObjective(`mc_friend${country.number}`).removeParticipant(`${getScore(ev.sender,`mc_pcountries`)}`)
                        MC.world.scoreboard.getObjective(`mc_friend${getScore(ev.sender,`mc_pcountries`)}`).removeParticipant(`${country.number}`)
                        ev.sender.sendMessage(`${ev.message.split(/(?<=^[^ ]+?) /)[1].split(/(?<=^[^ ]+?) /)[1]} §r§cとの同盟を破棄しました`)
                        break;
                    }
                    case `check`: {
                        let friends = ""
                        let friendsAmount = 0
                        for(const f of MC.world.scoreboard.getObjective(`mc_friend${getScore(ev.sender,`mc_pcountries`)}`).getScores().filter(kuni => kuni.score > 0)) {
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
                for(const country of MC.world.scoreboard.getObjective(`mc_countries`).getScores().filter(kuni => kuni.score > 0)) {
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
                        MC.world.scoreboard.getObjective(`mc_limit${country.number}`).removeParticipant(`${getScore(ev.sender,`mc_pcountries`)}`)
                        MC.world.scoreboard.getObjective(`mc_dow${country.number}`).removeParticipant(`${getScore(ev.sender,`mc_pcountries`)}`)
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
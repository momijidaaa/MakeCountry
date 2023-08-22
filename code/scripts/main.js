import * as MC from "@minecraft/server"
import "commands.js"
import "useitem.js"
import { getNameScore, getScore , setScore , addScore, convertChunk, isWarNowCountry, findCountry, getRandomInteger} from "./function";
import { configs } from "./config"

MC.world.afterEvents.playerSpawn.subscribe((ev)=>{
    if(!MC.world.getPlayers({tags: [`mc_admin`]})[0]) return;
    ev.player.runCommandAsync(`scoreboard players add @a mc_money 0`)
    ev.player.runCommandAsync(`scoreboard players add @a mc_pcountries 0`)
})

//1分ごとにまわす
MC.system.runInterval(()=>{
    //setup前の場合処理を止める
    if(!MC.world.getPlayers({tags: [`mc_admin`]})[0]) return;
    //税金処理
    if(!MC.world.scoreboard.getParticipants().find(a => a.displayName === `tax`)) {
        MC.world.sendMessage(`§a徴収システム始動開始(徴収間隔(${configs.taxTime}分))`)
        MC.world.scoreboard.getObjective(`mc_timer`).setScore(`tax`,configs.taxTime)
        for(const ptimer of MC.world.scoreboard.getObjective(`mc_ptimer`).getScores().filter(peace => peace.score > 0)) {
            addScore(`${ptimer.participant.displayName}`,`mc_ptimer`,-1)
        }
    } else if(MC.world.scoreboard.getObjective(`mc_timer`).getScore(`tax`) === 10) {
        MC.world.sendMessage(`§a[MakeCountry]\n§r税金回収の時間です`)
        for(const p of MC.world.scoreboard.getObjective(`mc_pcountries`).getScores()) {
            if(p.score < 1) continue
            addScore(`${p.score}`,`countrymoney`,Math.floor(getScore(p.participant,`mc_money`) / 100 * getScore(`${p.score}`,`countrymoneyper`)))
            addScore(p.participant,`mc_money`,Math.floor(getScore(p.participant,`mc_money`) / 100 * getScore(`${p.score}`,`countrymoneyper`) * -1))
        }
        addScore(`tax`,`mc_timer`,-1)
        for(const ptimer of MC.world.scoreboard.getObjective(`mc_ptimer`).getScores().filter(peace => peace.score > 0)) {
            addScore(`${ptimer.participant.displayName}`,`mc_ptimer`,-1)
        }
    } else if(MC.world.scoreboard.getObjective(`mc_timer`).getScore(`tax`) === 0) {
        MC.world.sendMessage(`§a[MakeCountry]\n§r国維持費回収の時間です`)
        for (const c of MC.world.scoreboard.getObjective(`mc_countries`).getScores().filter(kuni => kuni.score > 0)) {
            const all_score = MC.world.scoreboard.getObjective(`mc_chunk`).getScores();
            const chunks = all_score.filter(nameScore => nameScore.score === c.score);
            addScore(`${c.score}`,`mc_days`,1)
            if(getScore(c.participant.displayName,`mc_days`) <= configs.taxFreeTime) continue
            addScore(`${c.score}`,`countrymoney`,configs.taxAmount * chunks.length * -1)
            if(getScore(c.participant.displayName,`mc_peace`) === 1) {
                addScore(`${c.score}`,`countrymoney`,configs.taxPeaceAmount * chunks.length * -1)
            }
            if(getScore(`${c.score}`,`countrymoney`) < 0) addScore(`${c.score}`,`mc_notax`,1)
            if(getScore(`${c.score}`,`countrymoney`) > -1) setScore(`${c.score}`,`mc_notax`,0)
            //mc_notax(赤字状態が続いたら国を削除)
            if(getScore(`${c.score}`,`mc_notax`) >= configs.deleteCountryReasonNoMoney) {
                const members = MC.world.scoreboard.getObjective(`mc_pcountries`).getScores()
                const chunks = MC.world.scoreboard.getObjective(`mc_chunk`).getScores()
                for(let i = 0;i < members.length;i++){
                    if(members[i].score === c.score) MC.world.scoreboard.getObjective(`mc_pcountries`).setScore(members[i].participant,0)
                }
                for(let i = 0;i < chunks.length;i++){
                  if(chunks[i].score === c.score) MC.world.scoreboard.getObjective(`mc_chunk`).removeParticipant(chunks[i].participant)
                }
                MC.world.scoreboard.getObjective(`mc_people`).removeParticipant(`${c.score}`)
                MC.world.scoreboard.getObjective(`mc_peace`).removeParticipant(`${c.score}`)
                if(countryNumber === null) return;
                MC.source.sendMessage(`§a国「§r${c.participant.displayName}§r§a」が削除されました\n(理由: ${configs.deleteCountryReasonNoMoney}日間財政破綻が続いたため)`)
                for(const f of MC.world.scoreboard.getObjective(`mc_friend${c.score}`).getScores()) {
                  MC.world.scoreboard.getObjective(`mc_friend${f.participant.displayName}`).removeParticipant(`${c.score}`)
                }
                for(const f of MC.world.scoreboard.getObjective(`mc_warNow${c.score}`).getScores()) {
                  MC.world.scoreboard.getObjective(`mc_warNow${f.participant.displayName}`).removeParticipant(`${c.score}`)
                }
                MC.world.scoreboard.getObjective(`mc_core`).removeParticipant(`${c.score}`)
                MC.world.scoreboard.removeObjective(`mc_friend${c.score}`)
                MC.world.scoreboard.removeObjective(`mc_warNow${c.score}`)
                MC.world.scoreboard.removeObjective(`mc_dow${c.score}`)
                MC.world.scoreboard.removeObjective(`mc_freq${c.score}`) 
                MC.world.scoreboard.getObjective(`countrymoneyper`).removeParticipant(`${c.score}`)
                MC.world.scoreboard.getObjective(`countrymoney`).removeParticipant(`${c.score}`)
                MC.world.scoreboard.removeObjective(`mc_limit${c.score}`)
                MC.world.scoreboard.getObjective(`mc_countries`).removeParticipant(c.participant)
            }
        }
        setScore(`tax`,`mc_timer`,configs.taxTime)
        for(const ptimer of MC.world.scoreboard.getObjective(`mc_ptimer`).getScores().filter(peace => peace.score > 0)) {
            addScore(`${ptimer.participant.displayName}`,`mc_ptimer`,-1)
        }
    } else {
        addScore(`tax`,`mc_timer`,-1)
        for(const ptimer of MC.world.scoreboard.getObjective(`mc_ptimer`).getScores().filter(peace => peace.score > 0)) {
            addScore(`${ptimer.participant.displayName}`,`mc_ptimer`,-1)
        }
    }
    for(const country of MC.world.scoreboard.getObjective(`mc_countries`).getScores().filter(kuni => kuni.score > 0)) {
        for(const limits of MC.world.scoreboard.getObjective(`mc_limit${country.score}`).getScores()) {
            if(limits.score === 0) {
                MC.world.scoreboard.getObjective(`mc_dow${country.score}`).removeParticipant(limits.participant.displayName)
                MC.world.scoreboard.getObjective(`mc_warNow${country.score}`).setScore(limits.participant.displayName,1)
                MC.world.scoreboard.getObjective(`mc_warNow${limits.participant.displayName}`).setScore(`${country.score}`,1)
                MC.world.scoreboard.getObjective(`mc_limit${country.score}`).removeParticipant(limits.participant)
                if(getScore(`${country.score}`)) addScore(`${country.score}`,`mc_core`,configs.coreDurableValue)
                if(!getScore(`${country.score}`)) setScore(`${country.score}`,`mc_core`,configs.coreDurableValue)
                if(getScore(`${limits.participant.displayName}`)) addScore(`${limits.participant.displayName}`,`mc_core`,configs.coreDurableValue)
                if(!getScore(`${limits.participant.displayName}`)) setScore(`${limits.participant.displayName}`,`mc_core`,configs.coreDurableValue)
                MC.world.sendMessage(`§c[MakeCountry]§r\n${getNameScore(`mc_countries`,Number(limits.participant.displayName))}§r と ${country.participant.displayName}§r の戦争が始まった`)
                continue
            }
            addScore(limits.participant.displayName,`mc_limit${country.score}`, -1)
        }
    }
},1200)

MC.world.afterEvents.blockBreak.subscribe((ev)=>{
    if(ev.brokenBlockPermutation.hasTag(`core`)) {
        if(ev.player.hasTag(`countryOwner`) && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) === getScore(ev.player,`mc_pcountries`)) {
            ev.player.sendMessage(`§aコアをアイテム化しました`)
            let core = ev.brokenBlockPermutation.getItemStack()
            core.nameTag = `${configs.coreName}`
            MC.world.getDimension(ev.dimension.id).spawnItem(core,ev.player.location)
        } else if (getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) > 0 && isWarNowCountry(getNameScore(`mc_countries`,getScore(ev.player,`mc_pcountries`)),getNameScore(`mc_countries`,getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`))) ) {
            ev.player.sendMessage(`§a敵国のコアを破壊しました。その調子です`)
            //ここから下に戦時中の処理
            if(getScore(`${getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`)}`,`mc_core`) === 0) {
                let winners = ""
                let winnersAmount = 0
                for(const f of MC.world.scoreboard.getObjective(`mc_warNow${getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`)}`).getScores()) {
                    
                    
                    //問題個所
                    
                    
                    MC.world.sendMessage(`${getNameScore(`mc_countries`,Number(f.participant.displayName))} ${f.participant.displayName} ${f.score}`)
                    winners = winners + getNameScore(`mc_countries`,Number(f.participant.displayName)) + `§r\n`
                    winnersAmount++
                    MC.world.scoreboard.getObjective(`mc_warNow${f.participant.displayName}`).removeParticipant(`${getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`)}`)
                    MC.world.scoreboard.getObjective(`mc_warNow${getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`)}`).removeParticipant(`${f.participant.displayName}`)
                }
                MC.world.sendMessage(`§c[MakeCountry]§r\n${getNameScore(`mc_countries`,getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`))}§r§aは§r\n${winners}の計${winnersAmount}ヶ国に敗れた`)
                ev.dimension.fillBlocks(ev.block.location,ev.block.location,ev.brokenBlockPermutation)
                return
            }
            addScore(`${getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`)}`,`mc_core`,-1)
            ev.dimension.fillBlocks(ev.block.location,ev.block.location,ev.brokenBlockPermutation)
            return
        } else if(!getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`)) {} else if(getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) > 0) {
            ev.dimension.fillBlocks(ev.block.location,ev.block.location,ev.brokenBlockPermutation)
            return
        }
    } else {
        if(configs.noBreakInWilderness && !getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`)) {
            ev.dimension.fillBlocks(ev.block.location,ev.block.location,ev.brokenBlockPermutation)
            return
        }
        if(configs.noBreakInSpecialZone && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) === -1) {
            ev.dimension.fillBlocks(ev.block.location,ev.block.location,ev.brokenBlockPermutation)
            return
        }
        if(configs.noBreakInCountry && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) > 0 && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) !== getScore(ev.player,`mc_pcountries`) ) {
            ev.dimension.fillBlocks(ev.block.location,ev.block.location,ev.brokenBlockPermutation)
            return
        }
        if(ev.brokenBlockPermutation.hasTag(`log`)) {
            addScore(ev.player,`mc_money`,getRandomInteger(configs.woodCutReward.min,configs.woodCutReward.max))
            return
        }
        if(ev.brokenBlockPermutation.type.id.endsWith(`_ore`)) {
            addScore(ev.player,`mc_money`,getRandomInteger(configs.oreMiningReward.min,configs.oreMiningReward.max))
            return
        }
        if(ev.brokenBlockPermutation.hasTag(`stone`)) {
            addScore(ev.player,`mc_money`,getRandomInteger(configs.stoneMiningReward.min,configs.stoneMiningReward.max))
            return
        }
    }
})
const airBlock = MC.BlockPermutation.resolve('minecraft:air')

MC.world.afterEvents.blockPlace.subscribe((ev)=>{
    if(ev.block.hasTag(`core`)) {
        if(ev.player.hasTag(`countryOwner`) && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) === getScore(ev.player,`mc_pcountries`)) {
            ev.player.sendMessage(`§aコアを置きました`)
            return
        } else {
            ev.player.sendMessage(`§cここには置けません`)
            ev.player.sendMessage(`§aコアをアイテム化しました`)
            let core = ev.block.getItemStack()
            core.nameTag = `${configs.coreName}`
            MC.world.getDimension(ev.dimension.id).spawnItem(core,ev.player.location)
            ev.dimension.fillBlocks(ev.block.location,ev.block.location,airBlock)
            return
        }
    }
    if(configs.noPlaceInWilderness && !getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`)) ev.dimension.fillBlocks(ev.block.location,ev.block.location,airBlock)
    if(configs.noPlaceInSpecialZone && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) === -1) ev.dimension.fillBlocks(ev.block.location,ev.block.location,airBlock)
    if(configs.noPlaceInCountry && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) > 0 && getScore(convertChunk(ev.block.location.x,ev.block.location.z),`mc_chunk`) !== getScore(ev.player,`mc_pcountries`)) ev.dimension.fillBlocks(ev.block.location,ev.block.location,airBlock)
})

MC.world.beforeEvents.explosion.subscribe((ev)=>{
    if(configs.noExplodeInWilderness && !getScore(convertChunk(ev.source.location.x,ev.source.location.z),`mc_chunk`)) ev.cancel = true
    if(configs.noExplodeInSpecialZone && getScore(convertChunk(ev.source.location.x,ev.source.location.z),`mc_chunk`) === -1) ev.cancel = true
    if(configs.noExplodeInCountry && getScore(convertChunk(ev.source.location.x,ev.source.location.z),`mc_chunk`) > 0) ev.cancel = true
})

MC.world.afterEvents.entityDie.subscribe((ev)=>{
    if(ev.damageSource.damagingEntity?.typeId !== `minecraft:player`) return
    try {
        addScore(ev.damageSource.damagingEntity,`mc_money`,getRandomInteger(configs[`${ev.deadEntity.typeId.split(`:`)[1]}KillReward`].min,configs[`${ev.deadEntity.typeId.split(`:`)[1]}KillReward`].max))
    } catch (error) {
        addScore(ev.damageSource.damagingEntity,`mc_money`,getRandomInteger(configs.oreMiningReward.min,configs.otherMobkillReward.max))
    }
})
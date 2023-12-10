import { world, system } from "./@scr/world";
import "commands.js"
import "useitem.js"
import { getNameScore, getScore, setScore, addScore, convertChunk, isWarNowCountry, findCountry, getRandomInteger, isFriendCountry } from "./function";
import config from "./config"

new Date()

world.afterEvents.playerSpawn.subscribe((ev) => {
    if (!world.getPlayers({ tags: [`mc_admin`] })[0]) return;
    ev.player.runCommandAsync(`scoreboard players add @a mc_money 0`)
    ev.player.runCommandAsync(`scoreboard players add @a mc_pcountries 0`)
})

//1分ごとにまわす
system.runInterval(() => {
    //setup前の場合処理を止める
    if (!world.getPlayers({ tags: [`mc_admin`] })[0]) return;
    //税金処理
    if (!world.scoreboard.getParticipants().find(a => a.displayName === `tax`)) {
        world.sendMessage(`§a徴収システム始動開始(徴収間隔(${config.taxTime}分))`)
        world.scoreboard.getObjective(`mc_timer`).setScore(`tax`, config.taxTime)
        for (const ptimer of world.scoreboard.getObjective(`mc_ptimer`).getScores().filter(peace => peace.score > 0)) {
            addScore(`${ptimer.participant.displayName}`, `mc_ptimer`, -1)
        }
    } else {
        addScore(`tax`, `mc_timer`, -1)
        if (world.scoreboard.getObjective(`mc_timer`).getScore(`tax`) === 10) {
            world.sendMessage(`§a[MakeCountry]\n§r税金回収の時間です`)
            for (const p of world.scoreboard.getObjective(`mc_pcountries`).getScores()) {
                if (p.score < 1) continue
                addScore(`${p.score}`, `countrymoney`, Math.floor(getScore(p.participant, `mc_money`) / 100 * getScore(`${p.score}`, `countrymoneyper`)))
                addScore(p.participant, `mc_money`, Math.floor(getScore(p.participant, `mc_money`) / 100 * getScore(`${p.score}`, `countrymoneyper`) * -1))
            }
            for (const ptimer of world.scoreboard.getObjective(`mc_ptimer`).getScores().filter(peace => peace.score > 0)) {
                addScore(`${ptimer.participant.displayName}`, `mc_ptimer`, -1)
            }
        } else if (world.scoreboard.getObjective(`mc_timer`).getScore(`tax`) === 0) {
            world.sendMessage(`§a[MakeCountry]\n§r国維持費回収の時間です`)
            for (const c of world.scoreboard.getObjective(`mc_countries`).getScores().filter(kuni => kuni.score > 0)) {
                const all_score = world.scoreboard.getObjective(`mc_chunk`).getScores();
                const chunks = all_score.filter(nameScore => nameScore.score === c.score);
                addScore(`${c.score}`, `mc_days`, 1)
                if (getScore(`${c.score}`, `mc_days`) < config.taxFreeTime) continue
                addScore(`${c.score}`, `countrymoney`, Math.floor(config.taxAmount * chunks.length * -1))
                if (getScore(`${c.score}`, `mc_peace`) === 1) {
                    addScore(`${c.score}`, `countrymoney`, Math.floor(config.taxPeaceAmount * chunks.length * -1))
                }
                if (getScore(`${c.score}`, `countrymoney`) < 0) addScore(`${c.score}`, `mc_notax`, 1)
                if (getScore(`${c.score}`, `countrymoney`) > -1) setScore(`${c.score}`, `mc_notax`, 0)
                //mc_notax(赤字状態が続いたら国を削除)
                if (getScore(`${c.score}`, `mc_notax`) >= config.deleteCountryReasonNoMoney) {
                    const members = world.scoreboard.getObjective(`mc_pcountries`).getScores()
                    const chunks = world.scoreboard.getObjective(`mc_chunk`).getScores()
                    for (let i = 0; i < members.length; i++) {
                        if (members[i].score === c.score) world.scoreboard.getObjective(`mc_pcountries`).setScore(members[i].participant, 0)
                    }
                    for (let i = 0; i < chunks.length; i++) {
                        if (chunks[i].score === c.score) world.scoreboard.getObjective(`mc_chunk`).removeParticipant(chunks[i].participant)
                    }
                    world.scoreboard.getObjective(`mc_people`).removeParticipant(`${c.score}`)
                    world.scoreboard.getObjective(`mc_peace`).removeParticipant(`${c.score}`)
                    world.scoreboard.getObjective(`mc_peace`).removeParticipant(`${c.score}`)
                    world.scoreboard.getObjective(`mc_days`).removeParticipant(`${c.score}`)
                    world.sendMessage(`§a国「§r${c.participant.displayName}§r§a」が削除されました\n(理由: ${config.deleteCountryReasonNoMoney}回連続で赤字が続いたため)`)
                    world.getDimension(`overworld`).runCommand(`title @s subtitle sendLogToDiscord 国「${c.participant.displayName}」が削除されました\n(理由: ${config.deleteCountryReasonNoMoney}回連続で赤字が続いたため)`)
                    world.getDimension(`overworld`).runCommand(`title @s subtitle §a`)
                    for (const f of world.scoreboard.getObjective(`mc_friend${c.score}`).getScores()) {
                        world.scoreboard.getObjective(`mc_friend${f.participant.displayName}`).removeParticipant(`${c.score}`)
                    }
                    for (const f of world.scoreboard.getObjective(`mc_warNow${c.score}`).getScores()) {
                        world.scoreboard.getObjective(`mc_warNow${f.participant.displayName}`).removeParticipant(`${c.score}`)
                    }
                    world.scoreboard.getObjective(`mc_core`).removeParticipant(`${c.score}`)
                    world.scoreboard.removeObjective(`mc_friend${c.score}`)
                    world.scoreboard.removeObjective(`mc_warNow${c.score}`)
                    world.scoreboard.removeObjective(`mc_dow${c.score}`)
                    world.scoreboard.removeObjective(`mc_freq${c.score}`)
                    world.scoreboard.getObjective(`countrymoneyper`).removeParticipant(`${c.score}`)
                    world.scoreboard.getObjective(`countrymoney`).removeParticipant(`${c.score}`)
                    world.scoreboard.removeObjective(`mc_limit${c.score}`)
                    world.scoreboard.getObjective(`mc_countries`).removeParticipant(c.participant)
                }
            }
            setScore(`tax`, `mc_timer`, config.taxTime)
            for (const ptimer of world.scoreboard.getObjective(`mc_ptimer`).getScores().filter(peace => peace.score > 0)) {
                addScore(`${ptimer.participant.displayName}`, `mc_ptimer`, -1)
            }
        } else {
            for (const ptimer of world.scoreboard.getObjective(`mc_ptimer`).getScores().filter(peace => peace.score > 0)) {
                addScore(`${ptimer.participant.displayName}`, `mc_ptimer`, -1)
            }
        }
        for (const country of world.scoreboard.getObjective(`mc_countries`).getScores().filter(kuni => kuni.score > 0)) {
            for (const limits of world.scoreboard.getObjective(`mc_limit${country.score}`).getScores()) {
                if (limits.score === 0) {
                    world.scoreboard.getObjective(`mc_dow${country.score}`).removeParticipant(limits.participant.displayName)
                    world.scoreboard.getObjective(`mc_warNow${country.score}`).setScore(limits.participant.displayName, 1)
                    world.scoreboard.getObjective(`mc_warNow${limits.participant.displayName}`).setScore(`${country.score}`, 1)
                    world.scoreboard.getObjective(`mc_limit${country.score}`).removeParticipant(limits.participant)
                    if (getScore(`${country.score}`)) addScore(`${country.score}`, `mc_core`, config.coreDurableValue)
                    if (!getScore(`${country.score}`)) setScore(`${country.score}`, `mc_core`, config.coreDurableValue)
                    if (getScore(`${limits.participant.displayName}`)) addScore(`${limits.participant.displayName}`, `mc_core`, config.coreDurableValue)
                    if (!getScore(`${limits.participant.displayName}`)) setScore(`${limits.participant.displayName}`, `mc_core`, config.coreDurableValue)
                    world.sendMessage(`§c[MakeCountry]§r\n${getNameScore(`mc_countries`, Number(limits.participant.displayName))}§r と ${country.participant.displayName}§r の戦争が始まった`)
                    continue
                }
                addScore(limits.participant.displayName, `mc_limit${country.score}`, -1)
            }
        }
    }
}, 1200)


const airBlock = MC.BlockPermutation.resolve('minecraft:air')

world.beforeEvents.itemUseOn.subscribe((ev) => {
    if (config.noUseInWilderness && !getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)) {
        ev.cancel = true
    }
    if (config.noUseInSpecialZone && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) === -1) {
        ev.cancel = true
    }
    if (config.noUseInCountry && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) > 0 && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) !== getScore(ev.source, `mc_pcountries`) && !isFriendCountry(getNameScore(`mc_countries`, getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)), getNameScore(`mc_countries`, getScore(ev.source, `mc_pcountries`)))) {
        ev.cancel = true
    }
})

world.beforeEvents.explosion.subscribe((ev) => {
    if (config.noExplodeInWilderness && !getScore(convertChunk(ev.source.location.x, ev.source.location.z), `mc_chunk`)) ev.cancel = true
    if (config.noExplodeInSpecialZone && getScore(convertChunk(ev.source.location.x, ev.source.location.z), `mc_chunk`) === -1) ev.cancel = true
    if (config.noExplodeInCountry && getScore(convertChunk(ev.source.location.x, ev.source.location.z), `mc_chunk`) > 0) ev.cancel = true
})

world.afterEvents.entityDie.subscribe((ev) => {
    try {
        if (!(ev.damageSource.damagingEntity instanceof MC.Player)) { return }
        try {
            const random = getRandomInteger(config[`${ev.deadEntity.typeId.split(`:`)[1]}KillReward`].min, config[`${ev.deadEntity.typeId.split(`:`)[1]}KillReward`].max)
            if (config.showRewardMessage) ev.damageSource.damagingEntity.onScreenDisplay.setActionBar(`§6+${random}`)
            addScore(ev.damageSource.damagingEntity, `mc_money`, random)
        } catch (error) {
            const random = getRandomInteger(config.oreMiningReward.min, config.otherMobkillReward.max)
            if (config.showRewardMessage) ev.damageSource.damagingEntity.onScreenDisplay.setActionBar(`§6+${random}`)
            addScore(ev.damageSource.damagingEntity, `mc_money`, random)
        }
    } catch (error) {
        return;
    }

})

world.afterEvents.entitySpawn.subscribe((ev) => {
    try {
        if (ev.entity.typeId !== `minecraft:player` && ev.entity.typeId !== `minecraft:item` && ev.entity.typeId !== `minecraft:xp_orb`) {
            if (!getScore(convertChunk(ev.entity.location.x, ev.entity.location.z), `mc_chunk`)) return
            if (getScore(convertChunk(ev.entity.location.x, ev.entity.location.z), `mc_chunk`) === -1 && config.noSpawnEntityInSpecialZone) {
                ev.entity.teleport({ x: ev.entity.location.x, y: -100, z: ev.entity.location.z })
            }
        }
    } catch (error) {
        return
    }
})

system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
        let land = getNameScore(`mc_countries`, getScore(p, `mc_pcountries`))
        if (getScore(p, `mc_pcountries`) === 0) land = config.noCountry
        p.nameTag = `§a${land} §r| ${p.name}`
        if (typeof getScore(p, `mc_nowc`) === 'undefined') {
            if (typeof getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`) === 'number') setScore(p, `mc_nowc`, getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`))
            if (typeof getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`) === 'undefined') setScore(p, `mc_nowc`, 0)
            continue
        }
        if (getScore(p, `mc_nowc`) === -1) {
            p.addEffect(`instant_health`, 20, { amplifier: 250, showParticles: false })
            p.addEffect(`resistance`, 20, { amplifier: 250, showParticles: false })
        }
        if (getScore(p, `mc_nowc`) === getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`)) continue
        if (getScore(p, `mc_nowc`) === 0 && !getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`)) continue
        if (typeof getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`) === 'number') setScore(p, `mc_nowc`, getScore(convertChunk(p.location.x, p.location.z), `mc_chunk`))
        if (typeof getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`) === 'undefined') setScore(p, `mc_nowc`, 0)
        if (typeof getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`) === 'number') p.onScreenDisplay.setTitle(`${getNameScore(`mc_countries`, getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`))}`)
        if (typeof getScore(convertChunk(Math.floor(p.location.x), Math.floor(p.location.z)), `mc_chunk`) === 'undefined') p.onScreenDisplay.setTitle(`§a荒野`)
    }
}, 20)

world.afterEvents.itemStartUseOn.subscribe((ev) => {
    if (ev.block.typeId !== `minecraft:chest` && !ev.block.typeId.endsWith(`shulker_box`) && ev.block.typeId !== `minecraft:barrel` && !ev.block.typeId.endsWith(`furnace`) && ev.block.typeId !== `minecraft:smoker`) return
    if (getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) > 0 && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) !== getScore(ev.source, `mc_pcountries`) && !isFriendCountry(getNameScore(`mc_countries`, getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)), getNameScore(`mc_countries`, getScore(ev.source, `mc_pcountries`)))) {
        ev.source.teleport(world.getDefaultSpawnLocation())
        for (const target of world.getPlayers()) {
            if (getScore(target, `mc_pcountries`) !== getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) && !target.isOp()) continue
            target.sendMessage(`${ev.source.name} §r§cが ${getNameScore(`mc_countries`, getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`))} §r§cでコンテナ系ブロックを開きました\n(ブロックID: ${ev.block.typeId} , 座標: ${ev.block.location.x},${ev.block.location.y},${ev.block.location.z} )`)
        }
        ev.source.sendMessage(`§c他国でコンテナブロックを開けることは禁止されています`)
        ev.source.runCommand(`title @s subtitle sendLogToDiscord ${ev.source.name} が ${getNameScore(`mc_countries`, getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`))} でコンテナ系ブロックを開きました\n(ブロックID: ${ev.block.typeId} , 座標: ${ev.block.location.x},${ev.block.location.y},${ev.block.location.z} )`)
        ev.source.runCommand(`title @s subtitle §a`)
    }
})

world.afterEvents.entityHurt.subscribe((ev) => {
    if (!(ev.damageSource.damagingEntity instanceof MC.Player)) return
    if (config.noMobAttackInWilderness && !getScore(convertChunk(ev.hurtEntity.location.x, ev.hurtEntity.location.z), `mc_chunk`)) {
        /**
         * @type {MC.EntityHealthComponent}
         */
        const health = ev.hurtEntity.getComponent(`minecraft:health`)
        health.setCurrentValue(health.currentValue + ev.damage)
        return
    }
    if (config.noMobAttackInSpecialZone && getScore(convertChunk(ev.hurtEntity.location.x, ev.hurtEntity.location.z), `mc_chunk`) === -1) {
        /**
        * @type {MC.EntityHealthComponent}
        */
        const health = ev.hurtEntity.getComponent(`minecraft:health`)
        health.setCurrentValue(health.currentValue + ev.damage)
        return
    }
    if (config.noMobAttackInCountry && getScore(convertChunk(ev.hurtEntity.location.x, ev.hurtEntity.location.z), `mc_chunk`) > 0 && getScore(convertChunk(ev.hurtEntity.location.x, ev.hurtEntity.location.z), `mc_chunk`) !== getScore(ev.damageSource.damagingEntity, `mc_pcountries`) && !isFriendCountry(getNameScore(`mc_countries`, getScore(convertChunk(ev.hurtEntity.location.x, ev.hurtEntity.location.z), `mc_chunk`)), getNameScore(`mc_countries`, getScore(ev.damageSource.damagingEntity, `mc_pcountries`)))) {
        if (ev.hurtEntity instanceof MC.Player && isWarNowCountry(getNameScore(`mc_countries`, getScore(convertChunk(ev.hurtEntity.location.x, ev.hurtEntity.location.z), `mc_chunk`)), getNameScore(`mc_countries`, getScore(ev.damageSource.damagingEntity, `mc_pcountries`)))) {
            return
        }
        ev.damageSource.damagingEntity.sendMessage(`§c他国でのプレイヤー、エンティティへの攻撃は禁止されています`)
        ev.damageSource.damagingEntity.runCommand(`title @s subtitle sendLogToDiscord ${ev.damageSource.damagingEntity.name} が ${getNameScore(`mc_countries`, getScore(convertChunk(ev.hurtEntity.location.x, ev.hurtEntity.location.z), `mc_chunk`))} でエンティティに攻撃しました\n(エンティティID: ${ev.hurtEntity.typeId} , 座標: ${Math.floor(ev.hurtEntity.location.x)},${Math.floor(ev.hurtEntity.location.y)},${Math.floor(ev.hurtEntity.location.z)} )`)
        ev.damageSource.damagingEntity.runCommand(`title @s subtitle §a`)
        /**
         * @type {MC.EntityHealthComponent}
         */
        const health = ev.hurtEntity.getComponent(`minecraft:health`)
        health.setCurrentValue(health.currentValue + ev.damage)
        return
    }
})



world.beforeEvents.playerPlaceBlock.subscribe((ev) => {
    if (ev.block.hasTag(`core`)) {
        if (ev.player.hasTag(`countryOwner`) && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) === getScore(ev.player, `mc_pcountries`) && ev.dimension.id === `minecraft:overworld`) {
            ev.player.sendMessage(`§aコアを置きました`)
            return
        } else {
            ev.player.sendMessage(`§cここには置けません`)
            ev.cancel = true
            return
        }
    }
    if (ev.dimension.id !== `minecraft:overworld`) return
    if (config.noPlaceInWilderness && !getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)) {
        ev.cancel = true
    }
    if (config.noPlaceInSpecialZone && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) === -1) {
        ev.cancel = true
    }
    if (config.noPlaceInCountry && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) > 0 && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) !== getScore(ev.player, `mc_pcountries`) && !isFriendCountry(getNameScore(`mc_countries`, getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)), getNameScore(`mc_countries`, getScore(ev.player, `mc_pcountries`)))) {
        ev.cancel = true
    }
})

world.beforeEvents.playerBreakBlock.subscribe((ev) => {
    if (ev.dimension.id !== `minecraft:overworld`) return
    if (ev.brokenBlockPermutation.hasTag(`core`)) {
        if (ev.dimension.id !== `minecraft:overworld`) return
        if (ev.player.hasTag(`countryOwner`) && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) === getScore(ev.player, `mc_pcountries`)) {
            ev.player.sendMessage(`§aコアをアイテム化しました`)
            let core = ev.brokenBlockPermutation.getItemStack()
            core.nameTag = `${config.coreName}`
            world.getDimension(ev.dimension.id).spawnItem(core, ev.player.location)
        } else if (getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) > 0 && isWarNowCountry(getNameScore(`mc_countries`, getScore(ev.player, `mc_pcountries`)), getNameScore(`mc_countries`, getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)))) {
            if (config.coreBreakMessage) ev.player.sendMessage(`§a敵国のコアを破壊しました。その調子です`)
            if (config.showCoreDurableValueOnBreak) ev.player.onScreenDisplay.setActionBar(`§aコアの残り耐久値: ${getScore(`${getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)}`, `mc_core`)}`)
            //ここから下に戦時中の処理
            if (getScore(`${getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)}`, `mc_core`) === 0) {
                let winners = ""
                let winnersAmount = 0
                for (const f of world.scoreboard.getObjective(`mc_warNow${getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)}`).getScores()) {
                    world.sendMessage(`${getNameScore(`mc_countries`, Number(f.participant.displayName))} ${f.participant.displayName} ${f.score}`)
                    winners = winners + getNameScore(`mc_countries`, Number(f.participant.displayName)) + `§r\n`
                    winnersAmount++
                    world.scoreboard.getObjective(`mc_warNow${f.participant.displayName}`).removeParticipant(`${getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)}`)
                    world.scoreboard.getObjective(`mc_warNow${getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)}`).removeParticipant(`${f.participant.displayName}`)
                }
                world.sendMessage(`§c[MakeCountry]§r\n${getNameScore(`mc_countries`, getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`))}§r§aは§r\n${winners}の計${winnersAmount}ヶ国に敗れた`)
                ev.cancel = true
                return
            }
            addScore(`${getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)}`, `mc_core`, -1)
            ev.dimension.fillBlocks(ev.block.location, ev.block.location, ev.brokenBlockPermutation)
            return
        } else if (!getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)) { } else if (getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) > 0) {
            ev.cancel = true
            ev.block.getComponent(``)
            return
        }
    } else {
        if (config.noBreakInWilderness && !getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)) {
            ev.cancel = true
            ev.player.sendMessage(`§c荒野でのブロック破壊はできません`)
            return
        }
        if (config.noBreakInSpecialZone && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) === -1) {
            ev.cancel = true
            ev.player.sendMessage(`§c特別区域でのブロック破壊はできません`)

            return
        }
        if (config.noBreakInCountry && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) > 0 && getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`) !== getScore(ev.player, `mc_pcountries`) && !isFriendCountry(getNameScore(`mc_countries`, getScore(convertChunk(ev.block.location.x, ev.block.location.z), `mc_chunk`)), getNameScore(`mc_countries`, getScore(ev.player, `mc_pcountries`)))) {
            ev.player.sendMessage(`§c他国でブロック破壊はできません`)
            ev.cancel = true
            return
        }
        if (ev.brokenBlockPermutation.hasTag(`log`)) {
            const random = getRandomInteger(config.woodCutReward.min, config.woodCutReward.max)
            if (config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`)
            addScore(ev.player, `mc_money`, random)
            return
        }
        if (ev.brokenBlockPermutation.type.id.endsWith(`_ore`)) {
            const random = getRandomInteger(config.oreMiningReward.min, config.oreMiningReward.max)
            if (config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`)
            addScore(ev.player, `mc_money`, random)
            return
        }
        if (ev.brokenBlockPermutation.hasTag(`stone`) || ev.brokenBlockPermutation.type.id === `minecraft:deepslate`) {
            const random = getRandomInteger(config.stoneMiningReward.min, config.stoneMiningReward.max)
            addScore(ev.player, `mc_money`, random)
            if (config.showRewardMessage) ev.player.onScreenDisplay.setActionBar(`§6+${random}`)
            return
        }
    }
})
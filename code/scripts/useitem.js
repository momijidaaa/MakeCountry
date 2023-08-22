import { Entity, world ,ItemStack, system,MolangVariableMap,BlockPermutation} from "@minecraft/server";
import * as UI from "@minecraft/server-ui"
import { addScore, convertChunk, getNameScore, getNumberScore, getScore, setScore } from "./function";
import { configs } from "./config";

world.afterEvents.itemUse.subscribe((ev)=>{
    switch(ev.itemStack.typeId){
        case "karo:countryinvite":{
            if(isNaN(Number(ev.itemStack.getLore()[0])) || Number(ev.itemStack.getLore()[0]) == 0) {
              ev.source.sendMessage(`§c招待が無効です。`)
              ev.source.getComponent(`inventory`).container.setItem(ev.source.selectedSlot)
              return;
            }
            const countrys = world.scoreboard.getObjective(`mc_countries`).getScores()
            let countryName = ""
            let countryCheck = "No"
            for(let i = 0;i < countrys.length;i++){
              if(countrys[i].score === Number(ev.itemStack.getLore()[0])) {
                countryCheck = "OK"
                countryName = countrys[i].participant.displayName
              }
            }
            if(countryCheck === "No") {
              ev.source.sendMessage(`§c招待が無効です。`)
              ev.source.getComponent(`inventory`).container.setItem(ev.source.selectedSlot)
              return;
            }
            if(world.scoreboard.getObjective(`mc_pcountries`).getScore(ev.source) !== 0) {
              ev.source.sendMessage(`§c既に別の国に加入中の為使えません。`)
              ev.source.getComponent(`inventory`).container.setItem(ev.source.selectedSlot)
              return;
            }
            world.scoreboard.getObjective(`mc_pcountries`).setScore(ev.source,Number(ev.itemStack.getLore()[0]))
            world.sendMessage(`${ev.source.name}§r§a が国『${countryName}』に加入しました。`)
            ev.source.removeTag(`countryAdmin`)
            ev.source.getComponent(`inventory`).container.setItem(ev.source.selectedSlot)
            break;
        }
        case "karo:countrycreate":{
            if(world.scoreboard.getObjective(`mc_pcountries`).getScore(ev.source) !== 0) {
                ev.source.sendMessage(`§c既に別の国に加入中の為使えません。`)
                return;
            }
            countryCreateForm(ev.source)
            break;
        }
        case "karo:countryadmin":{
            if(!world.scoreboard.getObjective(`mc_pcountries`).getScore(ev.source) || world.scoreboard.getObjective(`mc_pcountries`).getScore(ev.source) === 0) return;
            countryAdminForm(ev.source)
            break;
        }
        default: return;
    }
})

/**********************************************************************************************************************
 * 国関係の関数たち　　　　　　　　                                                                                *
 *                                                                                                                    *
 **********************************************************************************************************************/

export function countryTaxSetting(source) {
  if(!source.hasTag(`countryOwner`)) return;
  const country1 = world.scoreboard.getObjective(`countrymoneyper`).getScores()
  let countryMoney = 0
  for(let i = 0;i < country1.length;i++){
    if(country1[i].participant.displayName === `${world.scoreboard.getObjective(`mc_pcountries`).getScore(source)}`) countryMoney = country1[i].score
  }
  const form = new UI.ModalFormData()
  form.title(`§l徴収率変更`)
  form.slider(`金徴収率`,0,100,1,countryMoney)
  form.show(source).then((rs)=>{
    if(rs.canceled) return;
    world.scoreboard.getObjective(`countrymoneyper`).setScore(`${world.scoreboard.getObjective(`mc_pcountries`).getScore(source)}`,rs.formValues[0])
    source.sendMessage(`§a徴収率変更\n金: ${rs.formValues[0]} パーセント`)
  })
}

export function countryTresureWithdraw(source) {
  if(!source.hasTag(`countryOwner`)) return;
  const country1 = world.scoreboard.getObjective(`countrymoney`).getScores()
  let countryMoney = 0
  for(let i = 0;i < country1.length;i++){
    if(country1[i].participant.displayName === `${world.scoreboard.getObjective(`mc_pcountries`).getScore(source)}`) countryMoney = country1[i].score
  }
  const form = new UI.ModalFormData()
  form.title(`§l国庫財産引き出し`)
  form.slider(`金引き出し`,0,countryMoney,1)
  form.show(source).then((rs)=>{
    if(rs.canceled) return;
    world.scoreboard.getObjective(`mc_money`).setScore(source,world.scoreboard.getObjective(`mc_money`).getScore(source) + rs.formValues[0])
    world.scoreboard.getObjective(`countrymoney`).setScore(`${world.scoreboard.getObjective(`mc_pcountries`).getScore(source)}`,world.scoreboard.getObjective(`countrymoney`).getScore(`${world.scoreboard.getObjective(`mc_pcountries`).getScore(source)}`) - rs.formValues[0])
    source.sendMessage(`§a金: +${rs.formValues[0]}円`)
  })
}

export function countryCreateForm(source){
    const form = new UI.ModalFormData()
    form.title(`国作成`)
    form.textField(`国名を決めて作成してください`,`国名を入力`,``)
    form.show(source).then((rs)=>{
        if(rs.canceled) return;
        if(!rs.formValues[0]) {
          source.sendMessage(`§c国名を入力してください`)
          return
        }
        countryCreate(source,rs.formValues[0])
    })
}

export function countryAdminForm(source){
    const form = new UI.ActionFormData()
    form.title(`§l§0国管理`)
    form.body(`§l§f何をしますか？`)
    form.button(`§l§0情報確認`)
    if(source.hasTag(`countryAdmin`) || source.hasTag(`countryOwner`)) form.button(`§l§0メンバー追加`)
    if(source.hasTag(`countryAdmin`) || source.hasTag(`countryOwner`)) form.button(`§l§0メンバー削除`)
    if(source.hasTag(`countryAdmin`) || source.hasTag(`countryOwner`)) form.button(`§l§0国庫財産引き出し`)
    if(source.hasTag(`countryAdmin`) || source.hasTag(`countryOwner`)) form.button(`§l§0税徴収割合変更`)
    if(source.hasTag(`countryOwner`)) form.button(`§l§0受信した宣戦布告`)
    if(source.hasTag(`countryOwner`)) form.button(`§l§0受信した同盟申請`)
    if(source.hasTag(`countryOwner`)) form.button(`§l§0幹部追加`)
    if(source.hasTag(`countryOwner`)) form.button(`§l§0幹部削除`)
    if(source.hasTag(`countryOwner`)) form.button(`§l§0国名変更`)
    if(source.hasTag(`countryOwner`)) form.button(`§l§0国王変更`)
    if(source.hasTag(`countryOwner`)) form.button(`§l§c国削除`)
    form.show(source).then((rs)=>{
        if(rs.canceled) return;
        switch(rs.selection){
            case 0: {
              countryInfo(source)
              break
            }
            case 1: {
                countryAddMember(source)
                break;
            }
            case 2: {
                countryRemoveMember(source)
                break;
            }
            case 3: {                
              countryTresureWithdraw(source)
              break;
            }
            case 4: {                
              countryTaxSetting(source)
              break;
            }
            case 5: {
              DeclarationOfWarList(source)
              break
            }
            case 6: {
              friendReqList(source)
              break
            }
            case 7: {                
              countryAddAdmin(source)
              break;
            }
            case 8: {
              countryRemoveAdmin(source)
              break;
            }
            case 9: {
                countryNameChangeForm(source)
                break;
            }
            case 10: {
                countryOwnerChange(source)
                break;
            }
            case 11: {
                countryDeleteForm(source)
                break;
            }
        }
    })
}

export function countryNameChangeForm(source){
    if(!source.hasTag(`countryOwner`)) return;
    const form = new UI.ModalFormData()
    form.title(`国名変更`)
    form.textField(`変更後の国名を入力`,`新しい国名を入力`,`国`)
    form.show(source).then((rs)=>{
        if(rs.canceled) return;
        if(!rs.formValues[0]) {
          source.sendMessage(`§c新しい国名を入力してください`)
        }
        countryNameChange(source,rs.formValues[0])
    })
}

export function countryInfo(source) {
  const all_score = world.scoreboard.getObjective(`mc_chunk`).getScores();
  const chunks = all_score.filter(nameScore => nameScore.score === getScore(source,`mc_pcountries`));
  const form = new UI.ActionFormData()
  form.title(`国情報`)
  form.body(`国名: ${getNameScore(`mc_countries`,getScore(source,`mc_pcountries`))} \n所有チャンク数: ${chunks.length}チャンク\n国民数: ${getScore(`${getScore(source,`mc_pcountries`)}`,`mc_people`)}人\n国庫金: ${getScore(`${getScore(source,`mc_pcountries`)}`,`countrymoney`)}円\n税徴収率: ${getScore(`${getScore(source,`mc_pcountries`)}`,`countrymoneyper`)}パーセント`)
  form.button(`§lok`)
  form.show(source).then((rs)=>{})
}

export function countryDeleteForm(source) {
    if(!source.hasTag(`countryOwner`)) return;
    const form = new UI.ActionFormData()
    form.title(`国削除`)
    form.body(`削除すると元には戻せません。本当に削除しますか？`)
    form.button(`§l§0キャンセル`)
    form.button(`§l§c削除する`)
    form.show(source).then((rs)=>{
        if(rs.canceled) return;
        if(rs.selection === 1) countryDelete(source)
    })
}

/**
 * 
 * @param {import('@minecraft/server').Player|Entity} source 
 * @param {String} countryName 
 * @returns 
 */

export function countryCreate(source, countryName) {
    const sourcecountry = world.scoreboard.getObjective(`mc_pcountries`).getScore(source)
    if(typeof sourcecountry === 'undefined' || sourcecountry !== 0) {
      source.sendMessage(`§c既に国に所属している場合、作成することは出来ません。`)
    }
    if(getScore(source,`mc_money`) < configs.makeCountryCost) {
      source.sendMessage(`§c建国には${configs.makeCountryCost}円が必要です`)
      return;
    }
    if(getScore(convertChunk(source.location.x,source.location.y),`mc_chunk`) > 0) {
      source.sendMessage(`§cこのチャンクは§r ${getNameScore(`mc_countries`,getScore(convertChunk(source.location.x,source.location.y),`mc_chunk`))}§r§c の領土なので建国不可です`)
      return
    } 
    if(getScore(convertChunk(source.location.x,source.location.y),`mc_chunk`) === -1) {
      source.sendMessage(`§cこのチャンクは特別区域のため、建国不可能です`)
      return
    }
    if(countryName.length > 15) {
      source.sendMessage(`§c国名は15文字以内にしてください。`)
      return;
    }
    const countrys = world.scoreboard.getObjective(`mc_countries`).getScores()
    let countryNumber = null
    let countrysAmount = [1]
    let countryNames = []
    for(let i = 0;i < countrys.length;i++){
      countrysAmount[countrysAmount.length] = countrys[i].score
      countryNames[countryNames.length] = countrys[i].participant.displayName
    }
    if(countryNames.indexOf(countryName) !== -1) {
      source.sendMessage(`§cその名前は使えません`)
      return;
    }
    const countryMaxNumber = Math.max(...countrysAmount)
    source.sendMessage(`§a国§r「 ${countryName} §r」§aを作成しました。`)
    setScore(source,`mc_money`,getScore(source,`mc_money`) - configs.makeCountryCost)
    setScore(convertChunk(source.location.x,source.location.z),`mc_chunk`,countryMaxNumber + 1)
    source.addTag(`countryOwner`)
    const countryAdminItem = new ItemStack(`karo:countryadmin`)
    /**
     * @type {Container} selectSlot
     */
    const selectSlot = source.getComponent(`inventory`).container
    selectSlot.setItem(source.selectedSlot,countryAdminItem)
    setScore(`${countryMaxNumber + 1}`,`mc_peace`,1)
    setScore(`${countryMaxNumber + 1}`,`mc_days`,0)
    const core = BlockPermutation.resolve('karo:mc_core')
    
    world.getDimension(source.dimension.id).fillBlocks(source.location,source.location,core)
    world.scoreboard.addObjective(`mc_friend${countryMaxNumber + 1}`,`friend${countryMaxNumber + 1}`)
    world.scoreboard.addObjective(`mc_limit${countryMaxNumber + 1}`,`limit${countryMaxNumber + 1}`)
    world.scoreboard.addObjective(`mc_warNow${countryMaxNumber + 1}`,`war${countryMaxNumber + 1}`)
    world.scoreboard.addObjective(`mc_dow${countryMaxNumber + 1}`,`sensen${countryMaxNumber + 1}`)
    world.scoreboard.addObjective(`mc_freq${countryMaxNumber + 1}`,`doumeireq${countryMaxNumber + 1}`)
    world.scoreboard.getObjective(`mc_people`).setScore(`${countryMaxNumber + 1}`,1)
    world.scoreboard.getObjective(`mc_ptimer`).setScore(`${countryMaxNumber + 1}`,0)
    world.scoreboard.getObjective(`countrymoney`).setScore(`${countryMaxNumber + 1}`,0)
    world.scoreboard.getObjective(`mc_core`).setScore(`${countryMaxNumber + 1}`,0)
    if(configs.firstPeace) world.scoreboard.getObjective(`mc_peace`).setScore(`${countryMaxNumber + 1}`,1)
    if(!configs.firstPeace) world.scoreboard.getObjective(`mc_peace`).setScore(`${countryMaxNumber + 1}`,0)
    world.scoreboard.getObjective(`countrymoneyper`).setScore(`${countryMaxNumber + 1}`,1)
    world.scoreboard.getObjective(`mc_countries`).setScore(`${countryName}`,countryMaxNumber + 1)
    world.scoreboard.getObjective(`mc_pcountries`).setScore(source,countryMaxNumber + 1)
}

  /**
   * 
   * @param {import('@minecraft/server').Player} source
   * @returns 
   */
export function countryDelete(source) {
    const sourcecountry = world.scoreboard.getObjective(`mc_pcountries`).getScore(source)
    if(typeof sourcecountry === 'undefined') return;
    if(!source.hasTag(`countryOwner`)) return;
    const countrys = world.scoreboard.getObjective(`mc_countries`).getScores()
    const members = world.scoreboard.getObjective(`mc_pcountries`).getScores()
    const chunks = world.scoreboard.getObjective(`mc_chunk`).getScores()
    let countryNumber = null
    for(let i = 0;i < countrys.length;i++){
        if(countrys[i].score === sourcecountry) {
            countryNumber = i
        }
    }
    for(let i = 0;i < members.length;i++){
        if(members[i].score === sourcecountry) world.scoreboard.getObjective(`mc_pcountries`).setScore(members[i].participant,0)
    }
    for(let i = 0;i < chunks.length;i++){
      if(chunks[i].score === sourcecountry) world.scoreboard.getObjective(`mc_chunk`).removeParticipant(chunks[i].participant)
    }
    world.scoreboard.getObjective(`mc_people`).removeParticipant(`${sourcecountry}`)
    world.scoreboard.getObjective(`mc_peace`).removeParticipant(`${sourcecountry}`)
    if(countryNumber === null) return;
    source.sendMessage(`§aあなたの国が削除されました。`)
    source.removeTag(`countryOwner`)
    source.removeTag(`countryAdmin`)
    for(const f of world.scoreboard.getObjective(`mc_friend${sourcecountry}`).getScores()) {
      world.scoreboard.getObjective(`mc_friend${f.participant.displayName}`).removeParticipant(`${sourcecountry}`)
    }
    for(const f of world.scoreboard.getObjective(`mc_warNow${sourcecountry}`).getScores()) {
      world.scoreboard.getObjective(`mc_warNow${f.participant.displayName}`).removeParticipant(`${sourcecountry}`)
    }
    addScore(source,`mc_money`,getScore(`${sourcecountry}`,`countrymoney`))
    world.scoreboard.getObjective(`countrymoneyper`).removeParticipant(`${sourcecountry}`)
    world.scoreboard.getObjective(`countrymoney`).removeParticipant(`${sourcecountry}`)
    world.scoreboard.getObjective(`mc_core`).removeParticipant(`${sourcecountry}`)
    world.scoreboard.removeObjective(`mc_friend${sourcecountry}`)
    world.scoreboard.removeObjective(`mc_warNow${sourcecountry}`)
    world.scoreboard.removeObjective(`mc_dow${sourcecountry}`)
    world.scoreboard.removeObjective(`mc_freq${sourcecountry}`)
    world.scoreboard.removeObjective(`mc_limit${sourcecountry}`)
    world.scoreboard.getObjective(`mc_countries`).removeParticipant(countrys[countryNumber].participant.displayName)
}

export function DeclarationOfWarList(source){
  if(!source.hasTag(`countryOwner`)) return;
  const form = new UI.ActionFormData()
  form.title(`受信した宣戦布告`)
  
  for(const country of world.scoreboard.getObjective(`mc_dow${getScore(source,`mc_pcountries`)}`).getScores()) {
    if(!getNameScore(`mc_countries`,Number(country.participant.displayName))) {
      world.scoreboard.getObjective(`mc_dow${getScore(source,`mc_pcountries`)}`).removeParticipant(country.participant.displayName)
      continue
    }
    form.button(`${getNameScore(`mc_countries`,Number(country.participant.displayName))}`)
  }
  if(world.scoreboard.getObjective(`mc_dow${getScore(source,`mc_pcountries`)}`).getScores().length === 0) {
    NotCountryIs(source)
    return
  }
  form.show(source).then((rs)=>{
      if(rs.canceled) return;
      DeclarationOfWarExecute(source,rs.selection)
  })
}

export function DeclarationOfWarExecute(source,number){
  if(!source.hasTag(`countryOwner`)) return;
  const country = world.scoreboard.getObjective(`mc_dow${getScore(source,`mc_pcountries`)}`).getScores()
  const form = new UI.ActionFormData()
  form.title(`${getNameScore(`mc_countries`,Number(country[number].participant.displayName))}`)
  form.button(`§l§0宣戦布告を受け入れる`)
  form.show(source).then((rs)=>{
      if(rs.canceled) return;
      if(rs.selection === 0) {
        setScore(`${country[number].participant.displayName}`,`mc_warNow${getScore(source,`mc_pcountries`)}`,1)
        setScore(`${getScore(source,`mc_pcountries`)}`,`mc_warNow${country[number].participant.displayName}`,1)
        world.sendMessage(`§c[MakeCountry]§r\n${getNameScore(`mc_countries`,Number(country[number].participant.displayName))} §rと ${getNameScore(`mc_countries`,getScore(source,`mc_pcountries`))} §rの戦争が始まりました`)
        world.scoreboard.getObjective(`mc_dow${getScore(source,`mc_pcountries`)}`).removeParticipant(country[number].participant.displayName)
        world.scoreboard.getObjective(`mc_limit${getScore(source,`mc_pcountries`)}`).removeParticipant(country[number].participant.displayName)
        if(getScore(`${country[number].score}`)) addScore(`${country[number].score}`,`mc_core`,configs.coreDurableValue)
        if(!getScore(`${country[number].score}`)) setScore(`${country[number].score}`,`mc_core`,configs.coreDurableValue)
        if(getScore(`${getScore(source,`mc_pcountries`)}`)) addScore(`${getScore(source,`mc_pcountries`)}`,`mc_core`,configs.coreDurableValue)
        if(!getScore(`${getScore(source,`mc_pcountries`)}`)) setScore(`${getScore(source,`mc_pcountries`)}`,`mc_core`,configs.coreDurableValue)
      }
  })
}

export function friendReqList(source){
  if(!source.hasTag(`countryOwner`)) return;
  const form = new UI.ActionFormData()
  form.title(`受信した同盟申請`)
  
  for(const country of world.scoreboard.getObjective(`mc_freq${getScore(source,`mc_pcountries`)}`).getScores()) {
    if(!getNameScore(`mc_countries`,Number(country.participant.displayName))) {
      world.scoreboard.getObjective(`mc_freq${getScore(source,`mc_pcountries`)}`).removeParticipant(country.participant.displayName)
      continue
    }
    form.button(`${getNameScore(`mc_countries`,Number(country.participant.displayName))}`)
  }
  if(world.scoreboard.getObjective(`mc_freq${getScore(source,`mc_pcountries`)}`).getScores().length === 0) {
    NotCountryIs(source)
    return
  }
  form.show(source).then((rs)=>{
      if(rs.canceled) return;
      friendReqExecute(source,rs.selection)
  })
}

export function friendReqExecute(source,number){
  if(!source.hasTag(`countryOwner`)) return;
  const country = world.scoreboard.getObjective(`mc_freq${getScore(source,`mc_pcountries`)}`).getScores()
  const form = new UI.ActionFormData()
  form.title(`${getNameScore(`mc_countries`,Number(country[number].participant.displayName))}`)
  form.button(`§l§0同盟申請を受け入れる`)
  form.button(`§c§l削除`)
  form.show(source).then((rs)=>{
      if(rs.canceled) return;
      if(rs.selection === 0) {
        setScore(`${country[number].participant.displayName}`,`mc_friend${getScore(source,`mc_pcountries`)}`,1)
        setScore(`${getScore(source,`mc_pcountries`)}`,`mc_friend${country[number].participant.displayName}`,1)
        source.sendMessage(`${getNameScore(`mc_countries`,Number(country[number].participant.displayName))} §r§aと同盟を結びました`)
        world.scoreboard.getObjective(`mc_freq${getScore(source,`mc_pcountries`)}`).removeParticipant(country[number].participant.displayName)
      }
      if(rs.selection === 1) {
        world.scoreboard.getObjective(`mc_freq${getScore(source,`mc_pcountries`)}`).removeParticipant(country[number].participant.displayName)
      }
  })
}

/**
 * 
 * @param {import('@minecraft/server').Player} source 
 * @param {String} newName
 * @returns 
 */
export function countryNameChange(source, newName) {
    const sourcecountry = world.scoreboard.getObjective(`mc_pcountries`).getScore(source)
    if(typeof sourcecountry === 'undefined') return;
    if(!source.hasTag(`countryOwner`)) return;
    if(newName.length > 15) {
        source.sendMessage(`§c国名は15文字以内にしてください。`)
        return;
    }
    const countrys = world.scoreboard.getObjective(`mc_countries`).getScores()
    let countryNames = []
    for(let i = 0;i < countrys.length;i++){
      countryNames[countryNames.length] = countrys[i].participant.displayName
    }
    if(countryNames.indexOf(newName) !== -1) {
      source.sendMessage(`§cその名前は使えません`)
      return;
    }
    let countryNumber = null
    for(let i = 0;i < countrys.length;i++){
      if(countrys[i].score === sourcecountry) {
        countryNumber = i
      }
    }
    if(countryNumber === null) return;
    const newcountryNumber = countrys[countryNumber].score
    source.sendMessage(`§aあなたの国の名前を§r ${countrys[countryNumber].participant.displayName} §r§aから§r ${newName} §r§aに変更しました。`)
    world.scoreboard.getObjective(`mc_countries`).removeParticipant(countrys[countryNumber].participant.displayName)
    world.scoreboard.getObjective(`mc_countries`).setScore(`${newName}`,newcountryNumber)
}

/**
 * 
 * @param {import('@minecraft/server').Player} source 
 * @returns 
 */
export function countryAddMember(source){
    if(!source.hasTag(`countryOwner`) && !source.hasTag(`countryAdmin`)) return;
    const sourcecountry = world.scoreboard.getObjective(`mc_pcountries`).getScore(source)
    if(typeof sourcecountry === 'undefined') return;
    const players = world.getDimension(`overworld`).getPlayers().filter(p => world.scoreboard.getObjective(`mc_pcountries`).getScore(p) === 0)
    if(players.length === 0) {NotPlayerIs(source); return;}
    let buttons = []
    for(const p of players){
      buttons[buttons.length] = p.name
    }
    const form = new UI.ModalFormData
    form.title(`メンバー追加`)
    form.dropdown(`追加メンバーを選択`,buttons)
    form.show(source).then((rs)=>{
      if(rs.canceled) return;
      const item = new ItemStack(`karo:countryinvite`)
      item.setLore([`${sourcecountry}`])
      players[rs.formValues[0]].getComponent(`inventory`).container.addItem(item)
      players[rs.formValues[0]].sendMessage(`${source.name} §r§aから国へ招待されました。`)
      source.sendMessage(`${buttons[rs.formValues]} §r§aを国に招待しました。`)
    })
}

/**
 * 
 * @param {import('@minecraft/server').Player} source 
 * @returns 
 */
export function countryRemoveMember(source){
  if(!source.hasTag(`countryOwner`) && !source.hasTag(`countryAdmin`)) return;
  const sourcecountry = world.scoreboard.getObjective(`mc_pcountries`).getScore(source)
  if(typeof sourcecountry === 'undefined') return;
  let players 
  if(source.hasTag("countryAdmin")) players = world.getDimension(`overworld`).getPlayers({excludeTags:["countryOwner","countryAdmin"]}).filter(p => world.scoreboard.getObjective(`mc_pcountries`).getScore(p) === world.scoreboard.getObjective(`mc_pcountries`).getScore(source))
  if(source.hasTag("countryOwner")) players = world.getDimension(`overworld`).getPlayers({excludeTags:["countryOwner"]}).filter(p => world.scoreboard.getObjective(`mc_pcountries`).getScore(p) === world.scoreboard.getObjective(`mc_pcountries`).getScore(source))
  if(players.length === 0) {
    NotPlayerIs(source); return;
  }
  let buttons = []
  for(const p of players){
    buttons[buttons.length] = p.name
  }
  const form = new UI.ModalFormData
  form.title(`メンバー削除`)
  form.dropdown(`削除するメンバーを選択`,buttons)
  form.show(source).then((rs)=>{
    if(rs.canceled) return;
    world.scoreboard.getObjective(`mc_pcountries`).setScore(players[rs.formValues[0]],0)
    players[rs.formValues[0]].removeTag(`countryAdmin`)
    players[rs.formValues[0]].sendMessage(`${source.name} §r§cにより国から削除されました。`)
    source.sendMessage(`${buttons[rs.formValues]} §r§aを国から削除しました。`)
  })
}

/**
 * 
 * @param {import('@minecraft/server').Player} source 
 * @returns 
 */
export function countryAddAdmin(source){
  if(!source.hasTag(`countryOwner`)) return;
  const sourcecountry = world.scoreboard.getObjective(`mc_pcountries`).getScore(source)
  if(typeof sourcecountry === 'undefined') return;
  const players = world.getDimension(`overworld`).getPlayers({excludeTags:["countryOwner","countryAdmin"]}).filter(p => world.scoreboard.getObjective(`mc_pcountries`).getScore(p) === world.scoreboard.getObjective(`mc_pcountries`).getScore(source))
  if(players.length === 0) {NotPlayerIs(source); return;}
  let buttons = []
  for(const p of players){
    buttons[buttons.length] = p.name
  }
  const form = new UI.ModalFormData
  form.title(`幹部追加`)
  form.dropdown(`幹部にするメンバーを選択`,buttons)
  form.show(source).then((rs)=>{
    if(rs.canceled) return;
    players[rs.formValues[0]].addTag(`countryAdmin`)
    players[rs.formValues[0]].sendMessage(`${source.name} §r§aによって国の幹部になりました。`)
    source.sendMessage(`${buttons[rs.formValues]} §r§aを国の幹部にしました。`)
  })
}

/**
 * 
 * @param {import('@minecraft/server').Player} source 
 * @returns 
 */
export function countryRemoveAdmin(source){
  if(!source.hasTag(`countryOwner`)) return;
  const sourcecountry = world.scoreboard.getObjective(`mc_pcountries`).getScore(source)
  if(typeof sourcecountry === 'undefined') return;
  const players = world.getDimension(`overworld`).getPlayers({tags:["countryAdmin"],excludeTags:["countryOwner"]}).filter(p => world.scoreboard.getObjective(`mc_pcountries`).getScore(p) === world.scoreboard.getObjective(`mc_pcountries`).getScore(source))
  if(players.length === 0) {NotPlayerIs(source); return;}
  let buttons = []
  for(const p of players){
    buttons[buttons.length] = p.name
  }
  const form = new UI.ModalFormData
  form.title(`幹部削除`)
  form.dropdown(`幹部から外すメンバーを選択`,buttons)
  form.show(source).then((rs)=>{
    if(rs.canceled) return;
    players[rs.formValues[0]].removeTag(`countryAdmin`)
    players[rs.formValues[0]].sendMessage(`${source.name} §r§cによって国の幹部権限を剥奪されました。`)
    source.sendMessage(`${buttons[rs.formValues]} §r§aを国の幹部から外しました。`)
  })
}

/**
 * 
 * @param {import('@minecraft/server').Player} source 
 * @returns 
 */
export function countryOwnerChange(source){
  if(!source.hasTag(`countryOwner`)) return;
  const sourcecountry = world.scoreboard.getObjective(`mc_pcountries`).getScore(source)
  if(typeof sourcecountry === 'undefined') return;
  const players = world.getDimension(`overworld`).getPlayers({excludeTags:["countryOwner"]}).filter(p => world.scoreboard.getObjective(`mc_pcountries`).getScore(p) === world.scoreboard.getObjective(`mc_pcountries`).getScore(source))
  if(players.length === 0) {NotPlayerIs(source); return;}
  let buttons = []
  for(const p of players){
    buttons[buttons.length] = p.name
  }
  const countrys = world.scoreboard.getObjective(`mc_countries`).getScores()
    let countryName
    for(let i = 0;i < countrys.length;i++){
      if(countrys[i].score === sourcecountry) {
        countryName = countrys[i].participant.displayName
      }
    }
  const form = new UI.ModalFormData
  form.title(`国王変更`)
  form.dropdown(`国王にするメンバーを選択`,buttons)
  form.show(source).then((rs)=>{
    if(rs.canceled) return;
    players[rs.formValues[0]].addTag(`countryOwner`)
    players[rs.formValues[0]].removeTag(`countryAdmin`)
    source.removeTag(`countryOwner`)
    world.sendMessage(`${players[rs.formValues[0]].name} §r§aが${source.name} §r§aによって国『${countryName}』の国王になりました。`)
    source.sendMessage(`${buttons[rs.formValues]} §r§aを国王にしました。`)
  })
}

export function NotPlayerIs(source){
    const form = new UI.ActionFormData()
    form.title(`§lお知らせ`)
    form.body(`§l§c対象に合うプレイヤーがいません。`)
    form.button(`§lOK`)
    form.show(source)
}

export function NotCountryIs(source){
  const form = new UI.ActionFormData()
  form.title(`§lお知らせ`)
  form.body(`§l§c何もありません`)
  form.button(`§lOK`)
  form.show(source)
}
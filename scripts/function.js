import * as MC from "@minecraft/server"

/*
 *  getScore(target,object) → number
 *  setScore(target,object,number) → スコアを設定
 *  addScore(target,object,number) → スコアを追加
 */

export function getScore(target,object) {
    try {
        const returnNumber = MC.world.scoreboard.getObjective(object)?.getScore(target)
        return returnNumber
    } catch (error) {
        return undefined
    }
}

export function setScore(target,object,number) {
    MC.world.scoreboard.getObjective(object)?.setScore(target,number)
}

export function addScore(target,object,number) {
    MC.world.scoreboard.getObjective(object)?.setScore(target,MC.world.scoreboard.getObjective(object)?.getScore(target) + number)
}

/* 
 * getNameScore(object,number) → string
 * getNumberScore(object,string) → number
 */

export function getNameScore(object,number) {
    try {
        const all_score = MC.world.scoreboard.getObjective(object).getScores();
        const returnString = all_score.find(nameScore => nameScore.score === number);
        return returnString.participant.displayName

    } catch (error) {
        return undefined
    }
    
}

export function getNumberScore(object,string) {
    try {
        const all_score = MC.world.scoreboard.getObjective(object).getScores();
        const returnNumber = all_score.find(numberScore => numberScore.participant.displayName === string);
        return returnNumber.score
    } catch (error) {
        return undefined
    }
}

export function getNumberScores(object,string) {
    try {
        const all_score = MC.world.scoreboard.getObjective(object).getScores();
        const returnNumber = all_score.filter(numberScore => numberScore.participant.displayName === string);
        return returnNumber
    } catch (error) {
        return undefined
    }
}

/*
座標をいれるとチャンクの文字列に変換
*/
export function convertChunk(x,z) {
    return `${Math.floor(x / 16) * 16}_${Math.floor(z / 16) * 16}`
}

export function findCountry(countryNameString) {
    const countries = MC.world.scoreboard.getObjective(`mc_countries`).getScores().filter(kuni => kuni.score > 0)
    try {
        const country = countries.find(kuni => kuni.participant.displayName === countryNameString)
        return {name: country.participant.displayName , number: country.score} 
    } catch (error) {
        return undefined
    }
}

export function isPeaceCountry(countryNameString) {
    const peaceCountries = MC.world.scoreboard.getObjective(`mc_peace`).getScores()
    try {
        const country = peaceCountries.find(kuni => kuni.participant.displayName === `${findCountry(countryNameString).number}`)
        if(country.score === 1) {
            return true
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

export function isWarNowCountry(checkCountryNameString , partnerCountryNameString) {
    if(!findCountry(checkCountryNameString)) return false
    if(!findCountry(partnerCountryNameString)) return false
    const peaceCountries = MC.world.scoreboard.getObjective(`mc_warNow${findCountry(checkCountryNameString).number}`).getScores()
    try {
        const country = peaceCountries.find(kuni => kuni.participant.displayName === `${findCountry(partnerCountryNameString).number}`)
        if(country) {
            return true
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

export function isFriendCountry(checkCountryNameString , partnerCountryNameString) {
    if(!findCountry(checkCountryNameString)) return false
    if(!findCountry(partnerCountryNameString)) return false
    const peaceCountries = MC.world.scoreboard.getObjective(`mc_friend${findCountry(partnerCountryNameString).number}`).getScores()
    try {
        const country = peaceCountries.find(kuni => kuni.participant.displayName === `${findCountry(checkCountryNameString).number}`)
        if(country) {
            return true
        } else {
            return false
        }
    } catch (error) {
        return false
    }
}

export function getRandomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function getAdjacentChunkAmount(chunkString) {
    const [ chunkX, chunkY ] = chunkString.split("_").map((v) => { return Number(v); });
    let chunkAmount = 0
    const chunkCountry = getScore(chunkString, "mc_chunk");

    for (let [ posX, posY ] of [ [ chunkX + 16, chunkY ], [ chunkX - 16,chunkY ], [ chunkX, chunkY - 16 ], [ chunkX, chunkY + 16 ] ]) {
        const chunkHas = getScore(convertChunk(posX, posY), "mc_chunk");
        if(!chunkHas) continue;
        if(chunkHas === chunkCountry) chunkAmount++
    }

    return chunkAmount
}

export function getCountoryAdjacentChunkAmount(chunkString,number) {
    const [ chunkX, chunkY ] = chunkString.split("_").map((v) => { return Number(v); });
    let chunkAmount = 0
    const chunkCountry = number

    for (let [ posX, posY ] of [ [ chunkX + 16, chunkY ], [ chunkX - 16,chunkY ], [ chunkX, chunkY - 16 ], [ chunkX, chunkY + 16 ] ]) {
        const chunkHas = getScore(convertChunk(posX, posY), "mc_chunk");
        if(!chunkHas) continue;
        if(chunkHas === chunkCountry) chunkAmount++
    }

    return chunkAmount
}
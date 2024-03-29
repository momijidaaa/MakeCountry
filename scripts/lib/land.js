import { world } from "@minecraft/server";
import * as DyProp from "./DyProp";

// 領土データを管理するやつ
let grid = DyProp.get(`grid`) ?? {};
if(typeof grid === "string") grid = JSON.parse(grid);

//国データを管理
let countries = DyProp.get(`countries`) ?? [];
if(typeof countries === "string") countries = JSON.parse(countries);

// データ内のセルを取得する関数
function getChunkData(rawX, rawZ) {
    const x = Math.floor(rawX / 16);
    const z = Math.floor(rawZ / 16);
    if (!grid[x]) {
        grid[x] = {};
    }
    if (!grid[x][z]) {
        grid[x][z] = { land: null, owner: null, permission: 0 };
    }
    return grid[x][z];
}

function convertChunk(rawX,rawZ) {
        const x = Math.floor(rawX / 16);
        const z = Math.floor(rawZ / 16);
        return [x,z];
}

// 国のデータを保存する配列
// ユニークなIDを管理する変数
let nextCountryId = DyProp.get(`nextCountryId`) ?? 1;
if(typeof nextCountryId === "string") nextCountryId = Number(nextCountryId);

// 新しい国を追加する関数
function addCountry(name, capital, population, resources, territories) {
    let newCountry = {
        id: nextCountryId++,
        name: name,
        capital: capital,
        population: population,
        resources: resources,
        territories: territories // 領土情報を追加
    };
    countries.push(newCountry);
}

// 国を削除する関数
function removeCountry(countryId) {
    countries = countries.filter(country => country.id !== countryId);
}

// 使用例
let japanTerritories = [{ x: 3, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 6 }];
addCountry("Japan", "Tokyo", 126800000, ["rice", "fish", "electronics"], japanTerritories);

let usaTerritories = [{ x: 8, y: 12 }, { x: 9, y: 12 }, { x: 10, y: 12 }];
addCountry("USA", "Washington D.C.", 331000000, ["corn", "wheat", "oil"], usaTerritories);

let germanyTerritories = [{ x: 15, y: 20 }, { x: 16, y: 20 }, { x: 15, y: 21 }];
addCountry("Germany", "Berlin", 83100000, ["automobiles", "machinery", "chemicals"], germanyTerritories);

console.log(countries);

// Japan を削除する
removeCountry(1);

console.log(countries);

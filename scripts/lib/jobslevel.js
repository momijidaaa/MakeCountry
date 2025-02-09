import { Player } from "@minecraft/server";
import jobs_config from "../jobs_config";

export class JobLevel {
    /**
     * 
     * @param {Player} player 
     * @param {string} key 
     * @param {} baseXp 
     */
    constructor(player, key) {
        this.player = player;
        this.key = key;
        this.maxLevel = jobs_config.maxLevel;
    }

    getLevel() {
        return parseInt(this.player.getDynamicProperty(`${this.key}_level`) ?? "1") || 1;
    }

    getXp() {
        return parseInt(this.player.getDynamicProperty(`${this.key}_xp`) ?? "0") || 0;
    }

    setLevel(level) {
        this.player.setDynamicProperty(`${this.key}_level`, level.toString());
    }

    setXp(xp) {
        this.player.setDynamicProperty(`${this.key}_xp`, xp.toString());
    }

    getXpRequired(level) {
        const formula = jobs_config.jobsLevelFormula; // 必要経験値の計算式
        const expr = formula
            .replace(/(\d)x/g, "$1*x") // "4x" → "4*x"
            .replace(/\^/g, "**") // "^" → "**"
            .replace(/x/g, `(${level})`); // "x" を `(level)` に置換
        return eval(expr); // 計算結果を返す
    }

    getReward(level) {
        const formula = jobs_config.jobsLevelFormula; // 必要経験値の計算式
        const expr = formula
            .replace(/(\d)x/g, "$1*x") // "4x" → "4*x"
            .replace(/\^/g, "**") // "^" → "**"
            .replace(/x/g, `(${level})`); // "x" を `(level)` に置換
        return eval(expr); // 計算結果を返す
    }

    addXp(amount) {
        if (amount <= 0) return;

        let xp = this.getXp() + amount;
        let level = this.getLevel();

        while (level < this.maxLevel && xp >= this.getXpRequired(level)) {
            xp -= this.getXpRequired(level);
            level++;
            this.player.onScreenDisplay.setTitle({ rawtext: [{ text: "§2" }, { translate: this.key }] });
            this.player.onScreenDisplay.updateSubtitle(`§e${level - 1}Lv --> ${level}Lv`);
            this.player.playSound(`random.levelup`);
        }

        this.setXp(xp);
        this.setLevel(level);
    }

    removeXp(amount) {
        let xp = this.getXp() - amount;
        if (xp < 0) xp = 0;
        this.setXp(xp);
    }

    reset() {
        this.setLevel(1);
        this.setXp(0);
    }

    get() {
        return {
            level: this.getLevel(),
            xp: this.getXp(),
            xpRequired: this.getXpRequired(this.getLevel())
        };
    }
}
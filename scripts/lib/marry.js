import * as DyProp from "./DyProp";

export class MarriageManager {
    constructor() {
        this.dyprop = DyProp;
        this.pendingKey = "pendingMarriages";
        this.marriageCounterKey = "marriageCounter";
        this.marriageHomeKey = "marriageHomes";
        this.rejectKey = "marriageRejects";
    }

    _getData(key) {
        const data = this.dyprop.getDynamicProperty(key);
        return data ? JSON.parse(data) : {};
    }

    _setData(key, data) {
        this.dyprop.setDynamicProperty(key, JSON.stringify(data));
    }

    _getNextMarriageKey() {
        let counter = this.dyprop.getDynamicProperty(this.marriageCounterKey) || 0;
        counter++;
        this.dyprop.setDynamicProperty(this.marriageCounterKey, counter);
        return `marriage_${counter}`;
    }

    requestMarriage(player1, player2) {
        if (player1.id === player2.id) return false;

        const pending = this._getData(this.pendingKey);
        const rejects = this._getData(this.rejectKey);

        if (rejects[player2.id]) return false; // プレイヤー2が求婚を受け取らない設定の場合

        const requestId = `${player1.id}_${player2.id}`;

        if (pending[requestId]) return false;

        pending[requestId] = { player1: player1.id, player2: player2.id, approved: false, key: null };

        this._setData(this.pendingKey, pending);
        return true;
    }

    rejectMarriage(player) {
        const rejects = this._getData(this.rejectKey);
        rejects[player.id] = true;
        this._setData(this.rejectKey, rejects);
    }

    acceptMarriageRequests(player) {
        const rejects = this._getData(this.rejectKey);
        delete rejects[player.id];
        this._setData(this.rejectKey, rejects);
    }

    approveMarriage(player1, player2) {
        const pending = this._getData(this.pendingKey);
        const requestId = `${player1.id}_${player2.id}`;

        if (!pending[requestId] || pending[requestId].approved) return false;

        const key = this._getNextMarriageKey();
        pending[requestId].approved = true;
        pending[requestId].key = key;

        this._setData(this.pendingKey, pending);
        return key;
    }

    confirmMarriage(priest, key) {
        const pending = this._getData(this.pendingKey);

        for (const requestId in pending) {
            if (pending[requestId].approved && pending[requestId].key === key) {
                const marriageData = { player1: pending[requestId].player1, player2: pending[requestId].player2 };

                this._setData(key, marriageData);
                delete pending[requestId];

                this._setData(this.pendingKey, pending);
                return true;
            }
        }
        return false;
    }

    divorce(player) {
        const counter = this.dyprop.getDynamicProperty(this.marriageCounterKey) || 0;
        for (let i = 1; i <= counter; i++) {
            const key = `marriage_${i}`;
            const marriage = this._getData(key);

            if (marriage.player1 === player.id || marriage.player2 === player.id) {
                this.dyprop.setDynamicProperty(key, null);
                return true;
            }
        }
        return false;
    }

    getSpouse(player) {
        const counter = this.dyprop.getDynamicProperty(this.marriageCounterKey) || 0;
        for (let i = 1; i <= counter; i++) {
            const key = `marriage_${i}`;
            const marriage = this._getData(key);

            if (marriage.player1 === player.id) return marriage.player2;
            if (marriage.player2 === player.id) return marriage.player1;
        }
        return null;
    }

    isMarried(player) {
        return this.getSpouse(player) !== null;
    }

    getCouples() {
        const counter = this.dyprop.getDynamicProperty(this.marriageCounterKey) || 0;
        const couples = [];

        for (let i = 1; i <= counter; i++) {
            const key = `marriage_${i}`;
            const marriage = this._getData(key);
            if (marriage) {
                couples.push({ player1: marriage.player1, player2: marriage.player2 });
            }
        }
        return couples;
    }

    setHome(player, x, y, z) {
        const homeData = this._getData(this.marriageHomeKey);
        const spouse = this.getSpouse(player);
        if (!spouse) return false;

        homeData[spouse] = { x, y, z };
        homeData[player.id] = { x, y, z };

        this._setData(this.marriageHomeKey, homeData);
        return true;
    }

    getHome(player) {
        const homeData = this._getData(this.marriageHomeKey);
        return homeData[player.id] || null;
    }
}
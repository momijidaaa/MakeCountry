import { world, system } from "@minecraft/server";

const callbacks = new Map();
const playerFishing = new Map();

export default class PlayerFishingAfterEvent {
    callback = () => {};
    constructor(callback) {
        this.callback = callback;
        callbacks.set(this.callback, true);
    }
    static subscribe(callback) {
        new PlayerFishingAfterEvent(callback);
    }
    static unsubscribe(callback) {
        callbacks.delete(callback);
    }
}

world.beforeEvents.itemUse.subscribe(ev => {
    const { itemStack, source } = ev;
    const id = source.id;

    if (itemStack.typeId === "minecraft:fishing_rod") {
        if (playerFishing.has(id)) {
            // 非同期でプレイヤーフィッシングデータを削除
            system.runTimeout(() => {
                playerFishing.delete(id);
            }, 2);
            return;
        }
        playerFishing.set(id, "");
    }
});

world.afterEvents.entitySpawn.subscribe(ev => {
    const { entity } = ev;

    if (entity.typeId === "minecraft:fishing_hook") {
        for (const [playerId] of playerFishing) {
            playerFishing.set(playerId, entity.id);
            break; // 1つのエンティティに対して1つのプレイヤーのみ設定
        }
    }
});

world.beforeEvents.entityRemove.subscribe(ev => {
    const { removedEntity } = ev;

    if (removedEntity.typeId === "minecraft:fishing_hook") {
        let event = {
            player: null,
            itemStack: null,
            dimension: removedEntity.dimension,
            result: null,
        };

        const items = removedEntity.dimension.getEntities({ location: removedEntity.location, minDistance: 0, maxDistance: 0.2 });
        const item = items[1];
        const isItemEntity = item?.typeId === "minecraft:item";

        event.itemStack = isItemEntity ? item.getComponent("item").itemStack : undefined;
        event.itemEntity = isItemEntity ? item : undefined;
        event.result = isItemEntity;

        for (const [playerId, hookId] of playerFishing) {
            if (hookId === removedEntity.id) {
                for (const player of world.getAllPlayers()) {
                    if (player.id === playerId) {
                        event.player = player;
                        break;
                    }
                }
                playerFishing.delete(playerId);
                break; // プレイヤーを見つけたらループを抜ける
            }
        }

        system.run(() => {
            callbacks.forEach((_, callback) => callback(event));
        });
    }
});

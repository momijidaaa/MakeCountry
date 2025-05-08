import { world, system, Player, EntityComponentTypes, ItemStack, EquipmentSlot, EnchantmentType, EnchantmentTypes, ItemComponentTypes, Container, EntityEquippableComponent, ItemLockMode, ContainerSlot } from "@minecraft/server";
import { FormCancelationReason } from "@minecraft/server-ui";
import { ActionForm } from "../../lib/form_class";
const ActionFormData = ActionForm;
import { http, HttpRequest, HttpRequestMethod, HttpHeader } from "@minecraft/server-net";
import { transferPlayer } from "@minecraft/server-admin";
import { langChangeItemName } from "../../lib/util";
import { GetAndParsePropertyData } from "../../lib/util";

const warnItems = [
    'minecraft:chainmail_helmet',
    'minecraft:chainmail_leggings',
    'minecraft:chainmail_chestplate',
    'minecraft:chainmail_boots',
    'minecraft:wooden_helmet',
    'minecraft:wooden_leggings',
    'minecraft:wooden_chestplate',
    'minecraft:wooden_boots',
    'minecraft:diamond_helmet',
    'minecraft:diamond_leggings',
    'minecraft:diamond_chestplate',
    'minecraft:diamond_boots',
    'minecraft:netherite_helmet',
    'minecraft:netherite_leggings',
    'minecraft:netherite_chestplate',
    'minecraft:netherite_boots',
    'minecraft:iron_helmet',
    'minecraft:iron_leggings',
    'minecraft:iron_chestplate',
    'minecraft:iron_boots',
    'minecraft:golden_helmet',
    'minecraft:golden_leggings',
    'minecraft:golden_chestplate',
    'minecraft:golden_boots',
    'minecraft:leather_helmet',
    'minecraft:leather_leggings',
    'minecraft:leather_chestplate',
    'minecraft:leather_boots',
    'minecraft:shield',
    'minecraft:arrow',
    'minecraft:bed',
];

const outItems = [
    'minecraft:arrow',
    'minecraft:bundle',
    'minecraft:black_bundle',
    'minecraft:blue_bundle',
    'minecraft:brown_bundle',
    'minecraft:cyan_bundle',
    'minecraft:gray_bundle',
    'minecraft:green_bundle',
    'minecraft:light_blue_bundle',
    'minecraft:light_gray_bundle',
    'minecraft:lime_bundle',
    'minecraft:magenta_bundle',
    'minecraft:orange_bundle',
    'minecraft:pink_bundle',
    'minecraft:purple_bundle',
    'minecraft:red_bundle',
    'minecraft:white_bundle',
    'minecraft:banner',
    'minecraft:decorated_pot',
    'minecraft:suspicious_stew',
    'minecraft:black_shulker_box',
    'minecraft:blue_shulker_box',
    'minecraft:brown_shulker_box',
    'minecraft:cyan_shulker_box',
    'minecraft:gray_shulker_box',
    'minecraft:green_shulker_box',
    'minecraft:light_blue_shulker_box',
    'minecraft:light_gray_shulker_box',
    'minecraft:lime_shulker_box',
    'minecraft:magenta_shulker_box',
    'minecraft:orange_shulker_box',
    'minecraft:pink_shulker_box',
    'minecraft:purple_shulker_box',
    'minecraft:red_shulker_box',
    'minecraft:white_shulker_box',
    'minecraft:undyed_shulker_box',
    'minecraft:writable_book',
    'minecraft:written_book',
    'minecraft:goat_horn',
    'minecraft:map',
    'minecraft:empty_map',
    'minecraft:filled_map',
    'minecraft:firework_rocket',
    'minecraft:bee_nest',
    'minecraft:firework_star',
];

const SERVER_URL = "http://localhost:10015"; // DBサーバーIP
const SERVER_ID = "karoearth"; // サーバーの識別子
const DEBUG_MODE = false; // デバッグモードのオン/オフ

// デバッグログ出力関数
function debugLog(...args) {
    if (DEBUG_MODE) {
        console.warn("[DEBUG]", ...args);
    }
}

// プレイヤーデータを保存する関数
async function savePlayerData(player) {
    try {
        const health = player.getComponent("health");
        const inventoryComponent = player.getComponent(EntityComponentTypes.Inventory);
        const equipmentComponent = player.getComponent(EntityComponentTypes.Equippable);

        const playerData = {
            health: health.currentValue,
            inventory: getInventoryData(inventoryComponent.container),
            equipment: getEquipmentData(player, equipmentComponent),
            attributes: getAttributesData(player),
            effects: getEffectsData(player),
            experience: {
                totalXp: player.getTotalXp(),
                level: player.level,
                xpEarnedAtCurrentLevel: player.xpEarnedAtCurrentLevel,
            },
            money: GetAndParsePropertyData(`player_${player.id}`).money,
            lastServer: SERVER_ID,
        };

        debugLog("Saving data for player: " + player.name);
        debugLog(JSON.stringify(playerData));

        await sendHttpRequest('/save', {
            playerName: player.name, // プレイヤー名で識別しているがいずれuuidなどになる予定
            data: playerData,
        });

        console.warn("Player data saved successfully.");
        player.sendMessage("§aPlayer data saved successfully.");
    } catch (error) {
        console.error("Error saving player data:", error);
        player.sendMessage("§cError saving player data. Check console for details.");
    }
}

// インベントリデータを取得する関数
/**
 * 
 * @param {Container} container 
 * @returns 
 */
/**
 * 
 * @param {Container} container 
 * @returns 
 */
function getInventoryData(container) {
    const contents = [];
    if (container) {
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (item) {
                const dyp = [];
                for (const id of item.getDynamicPropertyIds()) {
                    dyp.push({ id: id, data: item.getDynamicProperty(id) })
                };
                contents.push({
                    typeId: item.typeId,
                    amount: item.amount,
                    data: item.data, // 廃止予定
                    nameTag: item.nameTag,
                    lore: item.getLore(),
                    enchantments: getEnchantmentsData(item),
                    nbt: item.getComponent("durability")?.damage,
                    dyp: dyp,
                });
            } else {
                contents.push(undefined);
            }
        }
    }
    return { contents };
}

// エンチャントデータを取得する関数
function getEnchantmentsData(item) {
    const enchantable = item.getComponent(ItemComponentTypes.Enchantable);
    if (!enchantable) return undefined;

    const enchantments = [];
    for (const enchantment of enchantable.getEnchantments()) {
        enchantments.push({
            typeId: enchantment.type.id,
            level: enchantment.level
        });
    }
    return enchantments;
}

// 属性データを取得する関数
function getAttributesData(player) {
    const attributes = [];
    const movementAttribute = player.getComponent("movement");
    if (movementAttribute) {
        attributes.push({
            id: "minecraft:movement",
            currentValue: movementAttribute.currentValue,
        });
    }
    return attributes;
}

// エフェクトデータを取得する関数
function getEffectsData(player) {
    const effects = [];
    for (const effect of player.getEffects()) {
        effects.push({
            typeId: effect.typeId,
            amplifier: effect.amplifier,
            duration: effect.duration,
            displayName: effect.displayName,
        });
    }
    return effects;
}

// 装備データを取得する関数
/**
 * 
 * @param {Player} player 
 * @param {EntityEquippableComponent} equipmentComponent 
 * @returns 
 */
function getEquipmentData(player, equipmentComponent) {
    const equipment = {};
    if (equipmentComponent) {
        //equipment['mainhand'] = containerToData(equipmentComponent.getEquipment(EquipmentSlot.Mainhand));
        equipment['offhand'] = containerToData(equipmentComponent.getEquipment(EquipmentSlot.Offhand));
        equipment['head'] = containerToData(equipmentComponent.getEquipment(EquipmentSlot.Head));
        equipment['chest'] = containerToData(equipmentComponent.getEquipment(EquipmentSlot.Chest));
        equipment['legs'] = containerToData(equipmentComponent.getEquipment(EquipmentSlot.Legs));
        equipment['feet'] = containerToData(equipmentComponent.getEquipment(EquipmentSlot.Feet));
    }
    return equipment;
}

// アイテムをデータに変換する関数
/**
 * 
 * @param {ItemStack} item 
 * @returns 
 */
function containerToData(item) {
    if (item) {
        const dyp = [];
        for (const id of item.getDynamicPropertyIds()) {
            dyp.push({ id: id, data: item.getDynamicProperty(id) })
        };
        return {
            typeId: item.typeId,
            amount: item.amount,
            data: item.data,
            nameTag: item.nameTag,
            lore: item.getLore(),
            enchantments: getEnchantmentsData(item),
            nbt: item.getComponent("durability")?.damage,
            dyp: dyp
        };
    } else {
        return undefined;
    }
}

// プレイヤーデータを読み込む関数
/**
 * 
 * @param {Player} player 
 * @returns 
 */
async function loadPlayerData(player) {
    try {
        debugLog(`Loading data for player: ${player.name}`);
        const playerData = await sendHttpRequest('/load', {
            playerName: player.name,
        });

        console.warn("Player data loaded successfully.");
        player.sendMessage("§aPlayer data loaded successfully.");

        // データが空、または最終参加サーバーが同じ場合は読み込みしない
        if (!playerData || playerData.lastServer === SERVER_ID) {
            debugLog(`Skipping data loading for player: ${player.name} (Same server or no data)`);
            player.sendMessage("§eSkipping loading of player data.");
            await savePlayerData(player);
            return;
        }

        // プレイヤーデータ適用処理
        await applyPlayerData(player, playerData);
        player.sendMessage("§aPlayer data synchronization complete!")
        //データ保存
        await savePlayerData(player)
    } catch (error) {
        console.error("Error loading player data:", error);
        player.sendMessage("§cError loading player data. Check console for details.");
        player.runCommand(`kick ${player.name} §cプレイヤーデータ ロード処理に失敗しました！\n§g再参加しても解決しない場合は運営に報告してください！`)
    }
}

// プレイヤーデータを適用する関数
async function applyPlayerData(player, playerData) {
    debugLog(`Applying data for player: ${player.name}`);
    debugLog(`Received playerData: ${JSON.stringify(playerData)}`);

    if (playerData?.money) {
        system.runTimeout(() => {
            player.runCommand(`scriptevent mc:set ${playerData.money}`)
        });
    }

    // インベントリと装備をクリア
    await clearInventoryAndEquipment(player);

    // 体力の適用
    const healthComponent = player.getComponent("health");
    if (healthComponent && playerData.health !== undefined) {
        debugLog(`Applying health: ${playerData.health}`);
        healthComponent.setCurrentValue(playerData.health);
    }

    // インベントリの適用
    const inventoryComponent = player.getComponent(EntityComponentTypes.Inventory);
    if (inventoryComponent && inventoryComponent.container && playerData.inventory) {
        const container = inventoryComponent.container;
        //container.clearAll();
        debugLog(`Applying inventory items:`);
        for (let i = 0; i < playerData.inventory.contents.length; i++) {
            const itemData = playerData.inventory.contents[i];
            if (itemData) {
                debugLog(`  Slot ${i}: ${itemData.typeId} x ${itemData.amount}`);
                const itemStack = new ItemStack(itemData.typeId, itemData.amount);
                if (itemData.nameTag) {
                    itemStack.nameTag = itemData.nameTag;
                    debugLog(`    - Name Tag: ${itemData.nameTag}`);
                }
                if (itemData.lore) {
                    itemStack.setLore(itemData.lore);
                    debugLog(`    - Lore: ${JSON.stringify(itemData.lore)}`);
                }
                if (itemData.nbt) {
                    const durabilityComponent = itemStack.getComponent("durability");
                    if (durabilityComponent) {
                        durabilityComponent.damage = itemData.nbt;
                        debugLog(`    - Durability Damage: ${itemData.nbt}`);
                    }
                }
                // エンチャントの適用
                if (itemData.enchantments) {
                    const enchantableComponent = itemStack.getComponent(ItemComponentTypes.Enchantable);
                    if (enchantableComponent) {
                        debugLog(`    - Enchantments:`);
                        for (const enchantmentData of itemData.enchantments) {
                            const enchantmentType = EnchantmentTypes.get(enchantmentData.typeId);
                            if (enchantmentType) {
                                const enchantment = { type: enchantmentType, level: enchantmentData.level };
                                if (enchantableComponent.canAddEnchantment(enchantment)) {
                                    enchantableComponent.addEnchantment(enchantment);
                                    debugLog(`      - Type: ${enchantmentType.id}, Level: ${enchantmentData.level}`);
                                } else {
                                    debugLog(`      - Cannot add enchantment ${enchantmentType.id} to ${itemStack.typeId}`);
                                }
                            } else {
                                debugLog(`      - Unknown enchantment type: ${enchantmentData.typeId}`);
                            }
                        }
                    }
                }
                if (itemData.dyp) {
                    for (const dypData of itemData.dyp ?? []) {
                        itemStack.setDynamicProperty(dypData.id, dypData.data)
                    }
                }
                await container.setItem(i, itemStack);
            }
        }
    } else {
        debugLog(`Inventory component or container not found, or no inventory data.`);
    }

    // 装備の適用
    const equipmentComponent = player.getComponent(EntityComponentTypes.Equippable);
    if (equipmentComponent && playerData.equipment) {
        debugLog(`Applying equipment items:`);
        for (const slot in playerData.equipment) {
            const itemData = playerData.equipment[slot];
            if (itemData) {
                debugLog(`  Slot ${slot}: ${itemData.typeId} x ${itemData.amount}`);
                const itemStack = new ItemStack(itemData.typeId, itemData.amount);
                if (itemData.nameTag) {
                    itemStack.nameTag = itemData.nameTag;
                }
                if (itemData.lore) {
                    itemStack.setLore(itemData.lore);
                }
                if (itemData.nbt) {
                    const durabilityComponent = itemStack.getComponent("durability");
                    if (durabilityComponent) {
                        durabilityComponent.damage = itemData.nbt;
                    }
                }
                // エンチャントの適用
                if (itemData.enchantments) {
                    const enchantableComponent = itemStack.getComponent(ItemComponentTypes.Enchantable);
                    if (enchantableComponent) {
                        debugLog(`    - Enchantments:`);
                        for (const enchantmentData of itemData.enchantments) {
                            const enchantmentType = EnchantmentTypes.get(enchantmentData.typeId);
                            if (enchantmentType) {
                                const enchantment = { type: enchantmentType, level: enchantmentData.level };
                                if (enchantableComponent.canAddEnchantment(enchantment)) {
                                    enchantableComponent.addEnchantment(enchantment);
                                    debugLog(`Applying enchantment: ${enchantmentType.id} - Level ${enchantmentData.level}`);
                                } else {
                                    debugLog(`Cannot add enchantment ${enchantmentType.id} to ${itemStack.typeId}`);
                                }
                            } else {
                                debugLog(`Unknown enchantment type: ${enchantmentData.typeId}`);
                            }
                        }
                    }
                }
                // 文字列の slot を EquipmentSlot 列挙型に変換
                const equipmentSlot = stringToEquipmentSlot(slot);
                if (equipmentSlot) {
                    await equipmentComponent.setEquipment(equipmentSlot, itemStack);
                } else {
                    debugLog(`Invalid equipment slot: ${slot}`);
                }
            }
        }
    }

    // 属性の適用
    if (playerData.attributes) {
        debugLog(`Applying attributes:`);
        for (const attribute of playerData.attributes) {
            debugLog(`  Attribute: ${attribute.id} -> ${attribute.currentValue}`);
            const component = player.getComponent(attribute.id);
            if (component) {
                component.setCurrentValue = attribute.currentValue;
            }
        }
    }

    // エフェクトの適用
    if (playerData.effects) {
        debugLog(`Applying effects:`);
        for (const effect of playerData.effects) {
            const effectNameMap = {
                "hero_of_the_village": "village_hero",
            };

            let effectName = effect.typeId;
            if (effectNameMap[effect.typeId]) {
                effectName = effectNameMap[effect.typeId];
            }

            let adjustedAmplifier = effect.amplifier;
            if (effect.amplifier === 0) {
                adjustedAmplifier = 1;
            }
            debugLog(`  Effect: ${effectName} (Amplifier: ${adjustedAmplifier}, Duration: ${effect.duration})`);
            const options = {};
            if (effect.amplifier !== undefined) {
                options.amplifier = effect.amplifier;
            }
            player.addEffect(effectName, effect.duration, options);
        }
    }

    // 経験値の適用
    if (playerData.experience) {
        debugLog(`Applying experience:`);
        debugLog(`  Level: ${playerData.experience.level}`);
        debugLog(`  Total XP: ${playerData.experience.totalXp}`);
        player.resetLevel();
        player.addLevels(playerData.experience.level);
        player.addExperience(playerData.experience.totalXp - player.getTotalXp());
    }
}

// インベントリと装備をクリアする関数
async function clearInventoryAndEquipment(player) {
    const inventoryComponent = player.getComponent(EntityComponentTypes.Inventory);
    if (inventoryComponent && inventoryComponent.container) {
        await inventoryComponent.container.clearAll();
        debugLog(`[DEBUG] Inventory cleared for player: ${player.name}`);
    }

    const equipmentComponent = player.getComponent(EntityComponentTypes.Equippable);
    if (equipmentComponent) {
        for (const slot in EquipmentSlot) {
            await equipmentComponent.setEquipment(EquipmentSlot[slot], undefined);
        }
        debugLog(`[DEBUG] Equipment cleared for player: ${player.name}`);
    }
}


// 文字列を EquipmentSlot に変換する関数
function stringToEquipmentSlot(slotName) {
    switch (slotName) {
        /*case "mainhand":
          return EquipmentSlot.Mainhand;*/
        case "offhand":
            return EquipmentSlot.Offhand;
        case "head":
            return EquipmentSlot.Head;
        case "chest":
            return EquipmentSlot.Chest;
        case "legs":
            return EquipmentSlot.Legs;
        case "feet":
            return EquipmentSlot.Feet;
        default:
            return undefined;
    }
}

// 共通の HTTP リクエスト送信関数
async function sendHttpRequest(path, data) {
    const req = new HttpRequest(SERVER_URL + path);
    req.body = JSON.stringify(data);
    req.method = HttpRequestMethod.Post;
    req.headers = [
        new HttpHeader("Content-Type", "application/json"),
        // 必要に応じて認証情報を追加
    ];

    const response = await http.request(req);
    if (response.status === 200) {
        return JSON.parse(response.body);
    } else if (response.status === 404) {
        console.warn("404 Not Found: Returning null to indicate no data.");
        return null;
    } else {
        throw new Error(`HTTP Error: ${response.status} - ${response.body}`);
    }
}

// サーバー情報を一元管理
const servers = {
    resource1: {
        name: "資源1",
        address: "karoearth.xyz",
        port: 20270,
    },
    resource2: {
        name: "資源2",
        address: "karoearth.xyz",
        port: 20280,
    },
    resource3: {
        name: "資源3",
        address: "karoearth.xyz",
        port: 20290,
    },
    /*earth: {
        name: "Earth",
        address: "karoearth.xyz",
        port: 20000,
    }*/
};

/**
 * 
 * @param {Player} player 
 */
export async function formshow(player) {
    const form = new ActionFormData();
    form.title("サーバー選択");
    form.body("移動先のサーバーを選んでください\n\nEarth\nメインの地球\n\n資源1\nPvP勢向けの資源集め用のワールド\nアイテム保持: なし\nモブ湧き: あり\nPvP: あり\n難易度: ハード\n\n資源2\n普通の資源集め用のワールド\nアイテム保持: あり\nモブ湧き: あり\nPvP: あり\n難易度: ノーマル\n\n資源3\n建築資材集め用の平和なワールド\nアイテム保持: あり\nモブ湧き: なし\nPvP: なし\n難易度: ピース");
    form.button(servers.resource1.name);
    form.button(servers.resource2.name);
    form.button(servers.resource3.name);
    form.show(player).then(async (res) => {
        if (res.canceled) {
            if (res.cancelationReason == FormCancelationReason.UserBusy) {
                formshow(player);
                return;
            };
            player.sendMessage("サーバー選択がキャンセルされました。");
            return;
        }
        const warnItemData = [];
        const outItemData = [];
        const container = player.getComponent('inventory').container;
        for (let i = 0; i < container.size; i++) {
            const item = container.getItem(i);
            if (!item) continue;
            if (warnItems.includes(item.typeId)) {
                warnItemData.push(item.typeId);
                continue;
            }
            if (outItems.includes(item.typeId) || !item.typeId.startsWith('minecraft:')) {
                outItemData.push(item.typeId);
                continue;
            }
        }
        const equipmentSlots = [EquipmentSlot.Offhand, EquipmentSlot.Feet, EquipmentSlot.Legs, EquipmentSlot.Chest, EquipmentSlot.Head];
        const equipment = player.getComponent('equippable');
        for (const es of equipmentSlots) {
            const item = equipment.getEquipment(es);
            if (!item) continue;
            if (warnItems.includes(item.typeId)) {
                warnItemData.push(item.typeId);
                continue;
            }
            if (outItems.includes(item.typeId)) {
                outItemData.push(item.typeId);
                continue;
            }
        }
        if (outItemData.length > 0) {
            const body = [{ text: '§c転送できないアイテムを所持しています\n所持中の転送不可アイテム' }];
            for (const itemName of outItemData) {
                body.push({ text: '§r§c\n・' });
                body.push({ translate: langChangeItemName(itemName) });
            };
            player.sendMessage({ rawtext: body });
            return;
        };
        let selectedServer;
        if (res.selection === 0) {
            selectedServer = servers.resource1;
        }
        if (res.selection === 1) {
            selectedServer = servers.resource2;
        }
        if (res.selection === 2) {
            selectedServer = servers.resource3;
        }
        if (warnItemData.length > 0) {
            CheckForm(player, warnItemData, selectedServer);
            return;
        }
        if (selectedServer) {
            for (let i = 0; i < container.size; i++) {
                const item = container.getItem(i);
                if (!item) continue;
                item.lockMode = ItemLockMode.slot;
                container.setItem(i, item);
            };
            for (const es of equipmentSlots) {
                const item = equipment.getEquipment(es);
                if (!item) continue;
                item.lockMode = ItemLockMode.slot;
                equipment.setEquipment(es, item);
            }
            await savePlayerData(player);
            transferPlayer(player, selectedServer.address, selectedServer.port);
        }
    });
}

/**
 * 
 * @param {Player} player 
 * @param {Array<string>} items 
 * @param {{name: string,address: string, port: number}|undefined} selectedServer 
 */
function CheckForm(player, items, selectedServer) {
    const form = new ActionFormData();
    form.title('§c§lWarning!!');
    const body = [{ text: '§cあなたが持ってるアイテムの中には色が付いていたり効能があったり、装飾があった場合、それが消えるアイテムがあります(アイテムそのもの、エンチャントは消えません)\nそれでも転送しますか？\n所持している該当するアイテム:' }];
    for (const itemName of items) {
        body.push({ text: '§r§c\n・' });
        body.push({ translate: langChangeItemName(itemName) });
    };
    form.body({ rawtext: body });
    form.button('No');
    form.button('Yes');
    form.show(player).then(async (rs) => {
        if (rs.canceled) {
            if (rs.cancelationReason == FormCancelationReason.UserBusy) {
                CheckForm(player, items, selectedServer);
                return;
            }
            return;
        }
        if (rs.selection == 1) {
            if (selectedServer) {
                const container = player.getComponent('inventory').container;
                for (let i = 0; i < container.size; i++) {
                    const item = container.getItem(i);
                    if (!item) continue;
                    item.lockMode = ItemLockMode.slot;
                    container.setItem(i, item);
                };
                const equipmentSlots = [EquipmentSlot.Offhand, EquipmentSlot.Feet, EquipmentSlot.Legs, EquipmentSlot.Chest, EquipmentSlot.Head];
                const equipment = player.getComponent('equippable');
                for (const es of equipmentSlots) {
                    const item = equipment.getEquipment(es);
                    if (!item) continue;
                    item.lockMode = ItemLockMode.slot;
                    equipment.setEquipment(es, item);

                }
                await savePlayerData(player);
                transferPlayer(player, selectedServer.address, selectedServer.port);
            }
        }
    })
}

world.afterEvents.playerSpawn.subscribe((ev) => {
    if (ev.initialSpawn) {
        const player = ev.player;
        player.sendMessage("Loading data....")
        system.runTimeout(() => {
            loadPlayerData(player);
        }, 1);
    }
});

const DB_SERVER_URL = "http://localhost:10016";

world.afterEvents.playerSpawn.subscribe(async ev => {
    if (ev.initialSpawn) {
        const player = ev.player;
        system.runTimeout(async () => {
            const req = new HttpRequest(DB_SERVER_URL + "/update");
            req.method = HttpRequestMethod.Post;
            req.headers = [new HttpHeader("Content-Type", "application/json")];
            req.body = JSON.stringify({
                player_name: player.name,
                server_id: "karoearth"
            });

            try {
                await http.request(req);
                console.log(`[Server Transfer] Player data updated for ${player.name}`);
            } catch (error) {
                console.error(`[Server Transfer] Failed to update player data: ${error}`);
            }
        }, 50);
    }
});

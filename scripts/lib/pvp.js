import { Player, world } from "@minecraft/server";

const weapons = {
    "minecraft:wooden_sword": 4,
    "minecraft:wooden_axe": 3,
    "minecraft:wooden_pickaxe": 2,
    "minecraft:wooden_shovel": 1,
    "minecraft:wooden_hoe": 2,
    "minecraft:stone_sword": 5,
    "minecraft:stone_axe": 4,
    "minecraft:stone_pickaxe": 3,
    "minecraft:stone_shovel": 2,
    "minecraft:stone_hoe": 3,
    "minecraft:iron_sword": 6,
    "minecraft:iron_axe": 5,
    "minecraft:iron_pickaxe": 4,
    "minecraft:iron_shovel": 3,
    "minecraft:iron_hoe": 4,
    "minecraft:diamond_sword": 7,
    "minecraft:diamond_axe": 6,
    "minecraft:diamond_pickaxe": 5,
    "minecraft:diamond_shovel": 4,
    "minecraft:diamond_hoe": 5,
    "minecraft:netherite_sword": 8,
    "minecraft:netherite_axe": 7,
    "minecraft:netherite_pickaxe": 6,
    "minecraft:netherite_shovel": 5,
    "minecraft:netherite_hoe": 6,
    "minecraft:golden_sword": 4,
    "minecraft:golden_axe": 3,
    "minecraft:golden_pickaxe": 2,
    "minecraft:golden_shovel": 1,
    "minecraft:golden_hoe": 2
};

world.afterEvents.entityHitEntity.subscribe((ev) => {
    const { hitEntity: player, damagingEntity: attacker } = ev;
    if (!(player instanceof Player) || !(attacker instanceof Player)) return;
    const getItem = attacker.getComponent(`inventory`).container.getItem(player.selectedSlotIndex);
    let attacker_power = 0;
    if (!getItem) {
        attacker_power += 1;
    } else {
        let weaponValue = weapons[getItem.typeId];
        if (weaponValue) {
            attacker_power += (weaponValue * 2);
        };
    };
});
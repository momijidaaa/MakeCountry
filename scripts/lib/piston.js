import { BlockPermutation, world } from "@minecraft/server";
import { GetAndParsePropertyData, GetPlayerChunkPropertyId } from "./util"

world.afterEvents.pistonActivate.subscribe((ev) => {
    if (!isNoPiston) return;
    const { block } = ev;
    const chunkData = GetAndParsePropertyData(GetPlayerChunkPropertyId(block))
    if (!chunkData) {
        block.setPermutation(BlockPermutation.resolve(`minecraft:air`));
        return;
    };
    if (!chunkData?.countryId) {
        block.setPermutation(BlockPermutation.resolve(`minecraft:air`));
        return;
    };
    if (chunkData?.countryId != 0) return;
    block.setPermutation(BlockPermutation.resolve(`minecraft:air`));
    return;
});
import { WorldBuilder } from "./lib/world";

/** @type {import("../@types/lib/world").WorldBuilder} */
export const world = new WorldBuilder();
world.commands.load();

export * from "@minecraft/server";
import { Player, Scoreboard, EntityQueryOptions, Dimension, CommandResult } from "@minecraft/server";
import { EventEmitter } from "./events";
import { Logger } from "./log";
import { Formatter } from "./format";
import { CommandManager } from "./commands";

/**
 * @beta
 * @author yuki2825624
 */
export class WorldBuilder {
    private constructor ();
    readonly events: EventEmitter;
    readonly scoreboard: Scoreboard;
    readonly logger: Logger;
    readonly formatter: Formatter;
    readonly commands: CommandManager;
    readonly active: boolean;
    readonly cahce: WorldCache;
    reload (): Promise<CommandResult>;
    getPlayers (options?: EntityQueryOptions): Player[];
    getDimension (dimensionId: "overworld"|"nether"|"the_end"): Dimension;
    sendMessage (message: string | RawMessage | (string | RawMessage)[]): void
    getDynamicProperty (identifier: string): boolean | number | string | Vector3 | undefined
    getDynamicPropertyIds (): string[];
    getDynamicPropertyTotalByteCount (): number;
    setDynamicProperty (identifier: string, value?: string | number | boolean | Vector3 | undefined): void
}

/**
 * @beta
 * @author yuki2825624
 */
declare class WorldCache {
    private constructor();
    readonly tpsShard: number[];
}
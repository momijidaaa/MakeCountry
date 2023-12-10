import { Player } from "@minecraft/server";

/**
 * @beta
 * @author yuki2825624
 */
export declare class CommandManager {
    private constructor();
    load(): void;
    getAll(): RegisteredWorldCommandData[];
    register(data: RegisteredWorldCommandData, callback: (player: Player, args: string[], option: WorldCommandOption) => void): void;
}

/**
 * @beta
 * @author yuki2825624
 */
declare class RegisteredWorldCommandData extends WorldCommandData {
    private constructor();
    permission: number;
    callback(player: Player, args: string[], option: WorldCommandOption): void; 
}

/**
 * @beta
 * @author
 */
declare class WorldCommandData {
    private constructor();
    name: string;
    description: string;
    usages: string[];
    target?: WorldCommandTargetOption | boolean;
    aliases?: string[];
}

/**
 * @beta
 * @author yuki2825624
 */
declare class WorldCommandOption {
    private constructor();
    member: Player;
    flags: Map<string, string | null>
}

/**
 * @beta
 * @author yuki2825624
 */
declare class WorldCommandTargetOption {
    private constructor();
    high?: boolean;
    self?: boolean;
}

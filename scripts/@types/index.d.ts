import "@minecraft/server";

declare module "@minecraft/server" {
    /**
     * @beta
     * @author yuki2825624
     */
    interface Player {
        readonly distId: string;
        readonly permission: 0 | 1 | 2 | 3 | 4 | 5;
        readonly gamemode: 0 | 1 | 2 | 3;
    }
}

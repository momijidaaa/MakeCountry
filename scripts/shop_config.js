import { world } from "@minecraft/server";

const banPlayers = [`SappyTadpole675`, `bedrock6gatu`, `reimari8555`, `giyokundaK`, `rintannooheya`, `yuukiairi88`, `nontanon2000`, `reizylake`, `karesa2580`, `MildWool0182355`, `D Berlin98`, `SoundBag6772156`, `Sunandearth31`, `USSR20231917`, `USSR20231917`];

world.afterEvents.playerSpawn.subscribe(ev => {
    if (ev.initialSpawn) {
        if (banPlayers.includes(ev.player.name)) {
            ev.player.runCommand(`kick "${ev.player.name}" Your Banned`);
        };
    };
});
import { CommandPermissionLevel, CustomCommandParamType, Player, system, world } from "@minecraft/server";
import { DynamicProperties } from "../dyp";
import { CheckPermissionFromLocation, GetAndParsePropertyData } from "../../lib/util";

system.beforeEvents.startup.subscribe((event) => {
    system.runTimeout(() => {
        const countryDataBaseTop = new DynamicProperties("country");
        const countryStr = [];
        for (const countryKey of countryDataBaseTop.idList) {
            const countryRawData = countryDataBaseTop.get(countryKey);
            const countryData = JSON.parse(countryRawData);
            countryStr.push(`${countryData.id}_${countryData.name}`);
        }

        event.customCommandRegistry.registerEnum("makecountry:country", countryStr);

        event.customCommandRegistry.registerCommand(
            {
                name: 'makecountry:spawn',
                description: '他国のパブリックホームへスポーン',
                permissionLevel: CommandPermissionLevel.Any,
                mandatoryParameters: [{ name: "makecountry:country", type: CustomCommandParamType.Enum }]
            },
            ((origin, ...args) => {
                if (!origin?.sourceEntity || !(origin?.sourceEntity instanceof Player)) return;
                const sender = origin.sourceEntity;

                system.runTimeout(() => {
                    const playerDataBase = new DynamicProperties("player");
                    const countryDataBase = new DynamicProperties("country");

                    const rawData = playerDataBase.get(`player_${sender.id}`);
                    const playerData = JSON.parse(rawData);

                    const rawCountryData = countryDataBase.get(`country_${args[0].split("_")[0]}`);
                    const countryData = JSON.parse(rawCountryData);

                    if (sender.hasTag(`mc_notp`)) return;
                    if (!playerData?.country) {
                        sender.sendMessage({ translate: `command.chome.error.notjoin.country` });
                        return;
                    }
                    if (!countryData?.spawn || !countryData?.publicSpawn) return;

                    let [x, y, z, rx, ry, dimensionId] = countryData.spawn.split(`_`);
                    if (CheckPermissionFromLocation(sender, Number(x), Number(z), dimensionId, `publicHomeUse`)) {
                        sender.sendMessage({ translate: `no.permission` });
                        return;
                    }

                    sender.teleport(
                        { x: Number(x), y: Number(y), z: Number(z) },
                        {
                            dimension: world.getDimension(dimensionId.replace(`minecraft:`, ``)),
                            rotation: { x: Number(rx), y: Number(ry) }
                        }
                    );
                    sender.sendMessage({ translate: `command.chome.result` });
                })
            })
        );
    })
});
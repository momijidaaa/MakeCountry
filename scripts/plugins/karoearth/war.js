import { country } from "../../api/api";
import { sendToDiscord } from "./server_net";

country.afterEvents.startInvade.subscribe(async (ev) => {
    const { invadedCountryName, invader, invaderCountryName, locationString } = ev;

    await sendToDiscord({
        channelId: `1322821337990955081`,
        content: {
            embeds: [
                {
                    color: 0xe8bce8,
                    description: `${invader.name}(${invaderCountryName}) が ${locationString}(${invadedCountryName}) を侵略開始した`
                }
            ]
        }
    });
});
import { system } from "@minecraft/server";
import * as DyProp from "../lib/DyProp";
import { sendData } from "./api";
import { playerCountryJoin, playerCountryLeave } from "../lib/land";

system.afterEvents.scriptEventReceive.subscribe((ev) => {
    const { id, sourceEntity, message } = ev;
    switch (id) {
        case `mcapi:countryjoin`: {
            playerCountryJoin(sourceEntity, Number(message));
            break;
        };
        case `mcapi:countryleave`: {
            playerCountryLeave(sourceEntity);
            break;
        };
        case `mcapi:getcountrydata`: {
            const countryData = DyProp.getDynamicProperty(`country_${message}`);
            if (!countryData) return;
            sendData(`mcapi:getcountrydataresult`, `result`, JSON.parse(countryData));
            break;
        };
    };
});
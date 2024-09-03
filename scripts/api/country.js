import { system } from "@minecraft/server";
import * as DyProp from "../lib/DyProp";
import { sendData } from "./api";
import { DeleteCountry, playerCountryJoin, playerCountryLeave } from "../lib/land";

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
            const splitMessage = message.split(/(?<=^[^ ]+) /);
            const countryData = DyProp.getDynamicProperty(`country_${splitMessage[0]})}`);
            if (!countryData) return;
            sendData(`mcapi:getcountrydataresult`, `result`, JSON.parse(countryData), splitMessage[1]);
            break;
        };
        case `mcapi:deletecountry`: {
            DeleteCountry(message);
        };
    };
});
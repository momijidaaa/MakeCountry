import { world } from "@minecraft/server";
import * as DyProp from "./DyProp";
import { GetAndParsePropertyData, StringifyAndSavePropertyData } from "./util";

world.afterEvents.worldLoad.subscribe(() => {
    fixCountryData();
});

export function fixCountryData() {
    /**
 * @type {Array<string>}
 */
    const countryIds = DyProp.DynamicPropertyIds().filter(id => id.startsWith(`country_`));
    const checkCountryIds = countryIds;
    const aliveCountryIds = countryIds.map(a => Number(a.split('_')[1]));
    for (const id of checkCountryIds) {
        const countryData = GetAndParsePropertyData(id);

        if(!countryData) {
            DyProp.setDynamicProperty(id);
            continue;
        }
        const allianceIds = countryData.alliance ?? [];
        let aliveAllianceCountryIds = [];
        for (const a of allianceIds) {
            const allianceCountryData = GetAndParsePropertyData(a);
            if(!allianceCountryData) continue;
            if (aliveCountryIds.includes(a)) {
                aliveAllianceCountryIds.push(a);
            };
        };
        countryData.alliance = aliveAllianceCountryIds;

        const hostilityIds = countryData.hostility ?? [];
        let aliveHostilityCountryIds = [];
        for (const a of hostilityIds) {
            const hostilityCountryData = GetAndParsePropertyData(a);
            if(!hostilityCountryData) continue;
            if (aliveCountryIds.includes(a)) {
                aliveHostilityCountryIds.push(a);
            };
        };
        countryData.hostility = aliveHostilityCountryIds;

        const allianceRequestReceiveIds = countryData.allianceRequestReceive ?? [];
        let aliveAllianceRequestReceiveCountryIds = [];
        for (const a of allianceRequestReceiveIds) {
            const allianceCountryData = GetAndParsePropertyData(a);
            if(!allianceCountryData) continue;
            if (aliveCountryIds.includes(a)) {
                aliveAllianceRequestReceiveCountryIds.push(a);
            };
        };
        countryData.hostility = aliveAllianceRequestReceiveCountryIds;

        const AllianceRequestSendIds = countryData.allianceRequestSend ?? [];
        let aliveAllianceRequestSendCountryIds = [];
        for (const a of AllianceRequestSendIds) {
            const allianceCountryData = GetAndParsePropertyData(a);
            if(!allianceCountryData) continue;
            if (aliveCountryIds.includes(a)) {
                aliveAllianceRequestSendCountryIds.push(a);
            };
        };
        countryData.allianceRequestSend = aliveAllianceRequestSendCountryIds;

        const ApplicationPeaceRequestReceiveIds = countryData.applicationPeaceRequestReceive ?? [];
        let aliveApplicationPeaceRequestReceiveIds = [];
        for (const a of ApplicationPeaceRequestReceiveIds) {
            const allianceCountryData = GetAndParsePropertyData(a);
            if(!allianceCountryData) continue;
            if (aliveCountryIds.includes(a)) {
                aliveApplicationPeaceRequestReceiveIds.push(a);
            };
        };
        countryData.applicationPeaceRequestReceive = aliveApplicationPeaceRequestReceiveIds;

        const ApplicationPeaceRequestSendIds = countryData.applicationPeaceRequestSend ?? [];
        let alivApplicationPeaceRequestSendIds = [];
        for (const a of ApplicationPeaceRequestSendIds) {
            const allianceCountryData = GetAndParsePropertyData(a);
            if(!allianceCountryData) continue;
            if (aliveCountryIds.includes(a)) {
                alivApplicationPeaceRequestSendIds.push(a);
            };
        };
        countryData.applicationPeaceRequestSend = alivApplicationPeaceRequestSendIds;

        const MergeRequestSendIds = countryData.mergeRequestSend ?? [];
        let aliveMergeRequestSendIds = [];
        for (const a of MergeRequestSendIds) {
            const allianceCountryData = GetAndParsePropertyData(a);
            if(!allianceCountryData) continue;
            if (aliveCountryIds.includes(a)) {
                aliveMergeRequestSendIds.push(a);
            };
        };
        countryData.mergeRequestSend = aliveMergeRequestSendIds;

        const MergeRequestReceiveIds = countryData.mergeRequestReceive ?? [];
        let aliveMergeRequestReceiveIds = [];
        for (const a of MergeRequestReceiveIds) {
            const allianceCountryData = GetAndParsePropertyData(a);
            if(!allianceCountryData) continue;
            if (aliveCountryIds.includes(a)) {
                aliveMergeRequestReceiveIds.push(a);
            };
        };
        countryData.mergeRequestReceive = aliveMergeRequestReceiveIds;

        StringifyAndSavePropertyData(id, countryData);
    };
};
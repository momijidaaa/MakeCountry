import { world, system, Player } from '@minecraft/server';
import { ActionFormData, ModalFormData, FormCancelationReason } from '@minecraft/server-ui';
import config from '../config.js';

const teleportRequests = new Map();
const timeoutHandlers = new Map();

world.afterEvents.worldInitialize.subscribe(() => {
    const players = world.getPlayers();
    for (const player of players) {
        teleportRequests.set(player.name, []);
    };
});

/**
 * @param {Player} sender
 * @returns {string[]}
 */
export function getOtherPlayers(sender) {
    return world.getPlayers().filter(player => player.name !== sender.name).map(player => player.name);
};

/**
 * @param {string} name
 * @returns {Player}
 */
function findPlayerByName(name) {
    return world.getPlayers({ name: name })[0];
};

/**
 * @param {Player} sender
 */
export function tpaMainForm(sender) {

    const form = new ActionFormData()
        .title({ translate: `form.title.teleport` })
        .button({ translate: `form.teleport.button.send` })
        .button({ translate: `form.teleport.button.receive` });

    form.show(sender).then((rs) => {
        if (rs.canceled) {
            if (rs.cancelationReason == FormCancelationReason.UserBusy) {
                tpaMainForm(sender);
                return;
            };
            return;
        };
        switch (rs.selection) {
            case 0: {
                showRequestSendMenu(sender);
                break;
            };
            case 1: {
                showRequestAcceptMenu(sender);
                break;
            };
        };
    });
};

/**
 * @param {Player} sender
 */
const showRequestSendMenu = (sender) => {
    const otherPlayers = getOtherPlayers(sender);

    if (otherPlayers.length === 0) {
        sender.sendMessage({ translate: `command.error.notarget.player` });
        return;
    };

    const modalForm = new ModalFormData()
        .title({ translate: `form.teleport.button.send` })
        .dropdown({ translate: `players.list` }, otherPlayers, 0);

    modalForm.show(sender).then((rs) => {
        if (rs.canceled) {
            tpaMainForm(sender);
            return;
        };
        const selectedPlayerName = otherPlayers[rs.formValues[0]];
        const requests = teleportRequests.get(selectedPlayerName) || [];

        if (!requests.includes(sender.name)) {
            sender.sendMessage({ rawtext: [{ translate: `teleport.request.send.message`, with: [`${selectedPlayerName}`] }] });
            findPlayerByName(selectedPlayerName)?.sendMessage({ rawtext: [{ translate: `teleport.request.receive.message`, with: [`${sender.name}`] }, { text: `\n` }, { translate: `teleport.request.limit.message`, with: [`${config.tpaValiditySeconds}`] }] });;

            requests.push(sender.name);
            teleportRequests.set(selectedPlayerName, requests);

            const timeoutId = system.runTimeout(() => {
                const requests = teleportRequests.get(selectedPlayerName) || [];
                const updatedRequests = requests.filter((value) => value !== sender.name);

                teleportRequests.set(selectedPlayerName, updatedRequests);
                timeoutHandlers.delete(`${sender.name}=>${selectedPlayerName}`);
            }, config.tpaValiditySeconds * 20);

            timeoutHandlers.set(`${sender.name}=>${selectedPlayerName}`, timeoutId);
        } else {
            sender.sendMessage({ translate: `teleport.request.already.send` });
        };
    });
};

/**
 * @param {Player} sender
 */
function showRequestAcceptMenu(sender) {
    const requests = teleportRequests.get(sender.name) || [];

    const form = new ActionFormData()
        .title({ translate: `form.teleport.button.receive` });
    form.button({ translate: `mc.button.back` });
    for (const playerName of requests) {
        form.button({ translate: `mc.button.accept.request`, with: [`${playerName}`] });
    };

    form.show(sender).then((rs) => {
        if (rs.canceled) {
            tpaMainForm(sender);
            return;
        };
        switch (rs.selection) {
            case 0: {
                tpaMainForm(sender);
                return;
            };
            default: {
                const playerName = requests[rs.selection - 1];
                if (teleportRequests.get(sender.name).includes(playerName)) {
                    findPlayerByName(playerName)?.teleport(sender.location,{dimension: sender.dimension});

                    sender.sendMessage({ translate: `accept.request.message` });

                    const updatedRequests = requests.filter((value) => value !== playerName);
                    teleportRequests.set(sender.name, updatedRequests);

                    const timeoutId = timeoutHandlers.get(`${playerName}=>${sender.name}`);
                    system.clearRun(timeoutId);
                    timeoutHandlers.delete(`${playerName}=>${sender.name}`);
                } else {
                    sender.sendMessage({ translate: `application.deadline.message` });
                };
            };
        };
    });
};

world.afterEvents.playerJoin.subscribe((ev) => {
    const { playerName } = ev;
    teleportRequests.set(playerName, []);
});
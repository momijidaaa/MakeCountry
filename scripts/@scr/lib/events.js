export class EventEmitter {

    #events = [];
    /**
     * @template {import("../../@types/lib/events").WorldEventTypes} EventTypes
     * @template {keyof EventTypes} K
     * @param {K} eventName 
     * @param {(eventData: EventTypes[K]) => void} listener 
     * @returns {(eventData: EventTypes[K]) => void}
     */
    on(eventName, listener) {
        this.#events.push([eventName, listener]);
        return listener;
    }

    /**
     * @param {(eventData: EventTypes[K]) => void} input
     */
    off(input) {
        this.#events.filter(([, listener]) => { return listener === input });
    }

    /**
     * @template {import("../../@types/lib/events").WorldEventTypes} EventTypes
     * @template {keyof EventTypes} K
     * @param {K} eventName 
     * @param {EventTypes[K]} eventData 
     */
    emit(eventName, eventData) {
        //if (![ "tick", "entityHurt", "entityHealthChanged" ].includes(eventName)) server.logger.log("emit", eventName);
        const events = this.#events.filter(([name]) => { return name === eventName; });
        for (let [, listener] of events) {
            listener(eventData);
        }
    }
}
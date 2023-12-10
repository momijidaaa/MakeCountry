export class Logger {
    #timerActive = {}; #countActive = {}; #saveCount = 0;

    log(message, ...optionalParams) {
        console.warn("§b[Log]", message, ...optionalParams);
    }

    warn(message, ...optionalParams) {
        console.warn("§c[Warn]", message, ...optionalParams);
    }

    error(message, ...optionalParams) {
        console.error("§4[Error]", message, ...optionalParams);
    }

    debug(message, ...optionalParams) {
        console.warn("§d[Debug]", message, ...optionalParams);
    }

    timer(label) {
        if (!this.#timerActive[label]) {
            this.#timerActive[label] = Date.now();
        }
    }

    timerLog(label) {
        if (this.#timerActive[label]) {
            console.warn(`§e[Timer] ${label}: ${Date.now() - this.#timerActive[label]}`);
            return Date.now() - this.#timerActive[label];
        }
    }

    timerEnd(label, log = false) {
        if (this.#timerActive[label]) {
            if (log) this.timerLog(label);
            delete this.#timerActive[label];
            return Date.now() - this.#timerActive[label];
        }
    }

    count(label) {
        this.#countActive[label] ??= 0;
        console.warn(`§d[Count] ${label}: ${++this.#countActive[label]}`);
        return this.#countActive[label];
    }

    resetCount(label) {
        if (this.#countActive[label]) {
            delete this.#countActive[label];
        }
    }
}
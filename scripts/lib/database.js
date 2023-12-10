import { world, system, Entity } from "../@scr/world";

/**
 * @beta
 * @author yuki2825624
 */
class Database extends Map {
    constructor(name) {
        super();
        this.name = name;
        if (typeof name !== "string") throw TypeError("Database name must be a string");
        if (name.length > 15) throw ReferenceError("Database name length 15 charter less");
    }
}

/**
 * @beta
 * @author yuki2825624
 */
class WorldDatabase extends Database {
    #input;
    constructor(name, input = () => { }) {
        try {
            super(name);
            this.#input = input;
            this.reloadAsync();
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    setup(arg) {
        try {
            const output = this.#input(arg);
            if (!output) return;
            const [key, value] = output;
            if (!this.has(key)) this.set(key, value);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    reload() {
        try {
            for (let id of world.getDynamicPropertyIds().filter((id) => id.startsWith(`${this.name}#`))) {
                //world.logger.debug(id.replace(`${this.name}#`, ""), world.getDynamicProperty(id));
                super.set(id.replace(`${this.name}#`, ""), JSON.parse(world.getDynamicProperty(id)));
            }
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    reloadAsync() {
        try {
            system.runTimeout(() => { this.reload(); }, 1);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    get(key) {
        try {
            return super.get(String(key));
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    set(key, value) {
        try {
            world.setDynamicProperty(`${this.name}#${key}`, JSON.stringify(value));
            super.set(String(key), value);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    has(key) {
        try {
            return super.has(String(key));
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    delete(key) {
        try {
            world.setDynamicProperty(`${this.name}#${key}`, undefined);
            super.delete(String(key));
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    clear() {
        try {
            for (let id of world.getDynamicPropertyIds().filter((id) => { return id.startsWith(`${this.name}#`); })) {
                world.setDynamicProperty(id, undefined);
            }
            super.clear();
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

}

/**
 * @beta
 * @author yuki2825624
 */
class EntityDatabase extends Database {
    #input;
    constructor(name, input = () => { }) {
        try {
            super(name);
            this.#input = input;
            this.reloadAsync();
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    setup(arg) {
        try {
            const output = this.#input(arg);
            if (!output) return;
            const [key, value] = output;
            if (!this.has(key)) this.set(key, value);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    reload(ids = ["overworld"]) {
        try {
            for (let id of ids) for (const entity of world.getDimension(id).getEntities()) {
                let value = entity.getDynamicProperty(this.name);
                if (value) {
                    try { value = JSON.parse(value); } catch (e) { };
                    super.set(entity.id, value);
                }
            }
            return this;
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    reloadAsync(ids = ["overworld"]) {
        try {
            system.runTimeout(() => { this.reload(ids); }, 1);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    get(entity) {
        try {
            if (!(entity instanceof Entity)) throw TypeError("key instance is not a Entity");
            return super.get(entity.id);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    set(entity, value = null) {
        try {
            if (!(entity instanceof Entity)) throw TypeError("key instance is not a Entity");
            entity.setDynamicProperty(this.name, JSON.stringify(value));
            return super.set(entity.id, value);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    has(entity) {
        try {
            if (!(entity instanceof Entity)) throw TypeError("key instance is not a Entity");
            return super.has(entity.id);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    delete(entity) {
        try {
            if (!(entity instanceof Entity)) throw TypeError("key instance is not a Entity");
            entity.setDynamicProperty(this.name, undefined);
            return super.delete(entity.id);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    clear(ids = ["overworld"]) {
        try {
            for (let id of ids) for (const entity of world.getDimension(id).getEntities({ families: ["mob"] })) {
                this.delete(entity);
            }
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }
}

/**
 * @beta
 * @author yuki2825624
 */
export class MainDB {
    static add(database) {
        try {
            MainDB.databases.push(database);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    /**
     * 
     * @param {string} name 
     * @returns {WorldDatabase|EntityDatabase}
     */
    static get(name) {
        try {
            return MainDB.databases.find(db => db.name === name);
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    static databases = [];
}

MainDB.add(new WorldDatabase("timeout"));
MainDB.add(new WorldDatabase("freeze"));
MainDB.add(new WorldDatabase("disconnect"));
MainDB.add(new WorldDatabase("kick"));
MainDB.add(new WorldDatabase("ban"));
MainDB.add(new WorldDatabase("players", (player) => {
    return [
        player.distId,
        {
            name: player.name
        }
    ]
}))
import { world, Player } from "../../@scr/world";
import { ActionFormData, ActionFormResponse } from "@minecraft/server-ui";
import { parseId } from "../utils/formatter";

/**
 * @beta
 * @author yuki2825624
 * @utility ActionFormDataの改良版
 */
export class ActionFormBuilder {

    #data = { title: null, body: null, buttons: [] };
    constructor(title) {
        try {
            this.#data.title = title;
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    setTitle(title) {
        try {
            this.#data.title = title;
            return this;
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    /**
     * @param {string|string[]} body 
     */
    setBody(body) {
        try {
            this.#data.body = body;
            return this;
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    /**
     * @param {{ label: string, texture?: `ui/${"back_button_default.png"|"close_button_default.png"}`, valid?: boolean }} option 
     * @param {(player: Player) => void} callback 
     */
    addButton(option, callback = () => { }) {
        try {
            this.#data.buttons.push({ ...option, callback });
            return this;
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    /**
     * @param {(result: ActionFormResponse) => void} callback 
     */
    executes(callback) {
        try {
            this.#data.callback = callback;
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }

    async show(player) {
        try {
            const { title, body, buttons, callback = () => { } } = this.#data;
            const callbacks = [];
            const form = new ActionFormData();
            if (title) form.title(title);
            if (body) form.body(Array.isArray(body) ? body.join("\n") : body);
            for (let { valid = true, label, texture, callback } of buttons)
                if (valid) form.button(label, texture && parseId(texture, "textures/")), callbacks.push(callback);
            const result = await form.show(player);
            callback(result);
            if (!result.canceled) {
                const callback = callbacks[result.selection];
                callback(player);
            };
        } catch (e) {
            world.logger.error(e, e.stack);
        }
    }
}
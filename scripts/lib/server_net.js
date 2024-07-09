import { system, world } from "@minecraft/server";
import { http, HttpRequest, HttpHeader, HttpRequestMethod } from "@minecraft/server-net";

system.runInterval(async () => {
    const players = world.getDimension(`overworld`).getPlayers();
    for (const player of players) {
        const req = new HttpRequest("http://localhost:3000/update");

        req.method = HttpRequestMethod.Post;
        req.headers = [
            new HttpHeader("Content-Type", "application/json")
        ];
        const { x, z } = player.location;
        const point = getPoint(player.name, x, z, undefined)
        req.body = JSON.stringify({
            name: player.name,
            point: point,
        });
        http.request(req);
    };
}, 200);

function getPoint(name, x, y, imageUrl) {
    return {
        name: name,
        x: x,
        y: y,
        url: "https://media.discordapp.net/attachments/1135444105586016336/1136950757812338779/THXnY55LLYlcWLi1691140519_1691140556.png?width=778&height=562",
        lastUpdated: Date.now(),
        imageUrl: imageUrl
    };
}
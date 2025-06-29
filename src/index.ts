import { Elysia } from "elysia";
import { registerTwitchOAuth, loadTokens } from "./twitch-oauth";
import { startTwitchChat } from "./twitch-chat";
import { tokenEvents } from "./token-events";
import serveStatic from "@elysiajs/static";
import { join } from "path";
import { startTwitchFollowsWS } from "./twitch-follows";

const app = new Elysia();
const wsClients = new Set<WebSocket>();

app.ws("/ws", {
    open(ws) { wsClients.add(ws); },
    close(ws) { wsClients.delete(ws); },
    message(ws, data) { /* handle overlay/admin messages if needed */ }
});

registerTwitchOAuth(app);

let chatInitialized = false;
async function initializeChatAndModules() {
    if (chatInitialized) return;
    const tokens = await loadTokens();
    if (tokens) {
        chatInitialized = true;
        startTwitchChat({
            channel: "kremstream",
            onMessage: (msg) => {
                const json = JSON.stringify({ type: "chat", data: msg });
                console.log(msg)
                for (const ws of wsClients) ws.send(json);
            },
            clientId: process.env.TWITCH_CLIENT_ID!,
            accessToken: tokens.access_token,
        });
        console.log("Twitch chat initialized.");

        startTwitchFollowsWS({
            accessToken: tokens.access_token,
            clientId: process.env.TWITCH_CLIENT_ID!,
            broadcasterUserId: process.env.TWITCH_USER_ID!,
            onFollow: (event) => {
                const msg = JSON.stringify({ type: "follow", data: { username: event.username } });
                console.log(msg);
                for (const ws of wsClients) ws.send(msg);
            }
        });
        console.log("Twitch follows initialized.");
    }
}

// serve overlays
app.use(
    serveStatic({
        prefix: "/overlay/primo",
        assets: join(process.cwd(), "overlays/primo/dist").toString(),
        alwaysStatic: true,
    })
);

app.listen(3000, async () => {
    const tokens = await loadTokens();
    if (tokens) {
        console.log("Access token loaded:", tokens.access_token);
        initializeChatAndModules();
    } else {
        console.log("No tokens found. Visit http://localhost:3000/auth/twitch to authorize.");
    }
    console.log("Server running at http://localhost:3000");
});

// initialize chat after OAuth
tokenEvents.on("tokenReady", () => {
    console.log("Token obtained via OAuth! Initializing chat...");
    initializeChatAndModules();
});

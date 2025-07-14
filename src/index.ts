import { Elysia } from "elysia";
import { registerTwitchOAuth, loadTokens } from "./twitch-oauth";
import { tokenEvents } from "./token-events";
import serveStatic from "@elysiajs/static";
import { join } from "path";
import { startTwitchEventWS } from "./twitch-events";
import { playPipe } from "./eastereggs";
import { OBSWebSocket } from "./obs-websocket";

const app = new Elysia();
const wsClients = new Set<WebSocket>();

const obsClient = new OBSWebSocket();

app.ws("/ws", {
    open(ws) { wsClients.add(ws); },
    close(ws) { wsClients.delete(ws); },
    message(ws, data: any) {
        // overlay message handler
        console.log(data);
        if (data.type === "overlay") {
            if (data.data.subType === "darkMode") {
                const json = JSON.stringify({ type: "toggleDarkMode" });
                for (const ws of wsClients) ws.send(json);
            }
        }
        if (data.type === "obs") {
            if (data.data.subType === "scene") {
                obsClient.setCurrentProgramScene(data.data.sceneName);
            }
        }
    }
});

registerTwitchOAuth(app);
obsClient.connect();

let chatInitialized = false;
let chatInitPromise: Promise<void> | null = null;   // ugly, may fix later

async function initializeChatAndModules() {
    if (chatInitialized) return;
    if (chatInitPromise) return chatInitPromise;

    chatInitPromise = (async () => {
        const tokens = await loadTokens();

        if (tokens) {
            chatInitialized = true;

            /*
            * WS messages structure:
            * {
            *   type: string,
            *   data: {
            *     subType?: string,
            *     type/subtype specific props...
            *   }
            * }
            *
            * types:
            * - chat
            * - follow
            * - chatDelete
            *
            * - overlay (are propagated to overlays from other views)
            *   - darkMode
            * - obs
            *   - scene
            */

            startTwitchEventWS({
                accessToken: tokens.access_token,
                clientId: process.env.TWITCH_CLIENT_ID!,
                broadcasterUserId: process.env.TWITCH_USER_ID!,
                onFollow: (event) => {
                    const msg = JSON.stringify({ type: "follow", data: { username: event.username, profilePic: event.profilePic } });
                    console.log(msg);
                    for (const ws of wsClients) ws.send(msg);
                },
                onChatMessage: (msg) => {
                    const json = JSON.stringify({ type: "chat", data: msg });
                    console.log(msg)
                    if (msg.text.includes("!pipe")) {
                        obsClient.getSourceScreenshot("HD60 X", "test.png", "png", 1920, 1080)
                        // playPipe()
                    }
                    for (const ws of wsClients) ws.send(json);
                },
                onMessageDelete: (msg) => {
                    const json = JSON.stringify({ type: "chatDelete", data: msg });
                    console.log(msg)
                    for (const ws of wsClients) ws.send(json);
                },
            });
            console.log("Twitch events initialized.");
        }
    })();

    await chatInitPromise;
}

// serve overlays
app.use(
    serveStatic({
        prefix: "/overlay/switch2",
        assets: join(process.cwd(), "overlays/switch2/dist").toString(),
        alwaysStatic: true,
    }),
);
app.use(
    serveStatic({
        prefix: "/overlay/sims2",
        assets: join(process.cwd(), "overlays/sims2/dist").toString(),
        alwaysStatic: true,
    }),
);
app.use(
    serveStatic({
        prefix: "/admin/deck",
        assets: join(process.cwd(), "admin/deck/dist").toString(),
        alwaysStatic: true,
    }),
)

app.listen(3000, async () => {
    const tokens = await loadTokens();
    if (tokens) {
        console.log("Access token loaded:", tokens.access_token);
        await initializeChatAndModules();
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

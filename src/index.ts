import { Elysia } from "elysia";
import { registerTwitchOAuth, loadTokens } from "./twitch-oauth";
import { tokenEvents } from "./token-events";
import serveStatic from "@elysiajs/static";
import { join } from "path";
import { startTwitchEventWS } from "./twitch-events";
import { playPipe } from "./eastereggs";
import { OBSWebSocket } from "./obs-websocket";
import { registerYoutubeOAuth, loadYoutubeTokens } from "./youtube-oauth";
import { startYoutubeChatPolling, fetchLiveChatId } from "./youtube-events";
import TwitchEmoticons from '@mkody/twitch-emoticons';
import { initVnyan, sendToVnyan } from "./vnyan-int";
const { EmoteFetcher, EmoteParser } = TwitchEmoticons;

const fetcher = new EmoteFetcher(process.env.TWITCH_CLIENT_ID, process.env.TWITCH_CLIENT_SECRET)
const parser = new EmoteParser(fetcher, {
    template: '<img class="emote" alt="{name}" src="{link}">',
    match: /(\w+)+?/g
})

const app = new Elysia();
const wsClients = new Set<WebSocket>();

const obsClient = new OBSWebSocket();

initVnyan();

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
            if (data.data.subType === "pause") {
                const json = JSON.stringify({ type: "togglePause" });
                for (const ws of wsClients) ws.send(json);
                setTimeout(() => {
                    obsClient.toggleFilterEnabled("Freeze")    // checks the active scene, and toggles the filter on scene "<SceneName> Grouped"
                }, 100)
            }
        }
        if (data.type === "obs") {
            if (data.data.subType === "scene") {
                obsClient.setCurrentProgramScene(data.data.sceneName);
            }
        }
        if (data.type === "vnyan") {
            if (data.data.subType === "reset") {
                sendToVnyan("reset");
            }
        }
    }
});

// twitch
registerTwitchOAuth(app);
obsClient.connect();

let chatInitialized = false;
let chatInitPromise: Promise<void> | null = null;   // ugly, may fix later

function handleChatMessage(msg: { id: string, text: string, username: string, color?: string, profilePic: string, source?: string }) {
    Promise.all([
        // Twitch global
        fetcher.fetchTwitchEmotes(),
        // BTTV global
        fetcher.fetchBTTVEmotes(),
        // 7TV global
        fetcher.fetchSevenTVEmotes(),
        // FFZ global
        fetcher.fetchFFZEmotes(),
    ]).then(() => {
        msg.text = parser.parse(msg.text);
        
        // comment the following line to enable marking if message is from twitch or youtube
        // this is a workaround in case you're using one or the other, at least until I split the two
        msg.source = "";
        
        const json = JSON.stringify({ type: "chat", data: msg });
        console.log(msg);
        for (const ws of wsClients) ws.send(json);

        if (msg.text.includes("!pipe")) {
            playPipe();
        }
    }).catch(err => {
        console.error('Error loading emotes...');
        console.error(err);
    });
}

function handleDeleteChatMessage(msg: { id: string }) {
    const json = JSON.stringify({ type: "chatDelete", data: msg });
    console.log(msg)
    for (const ws of wsClients) ws.send(json);
}

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
                onChatMessage: handleChatMessage,
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

// youtube
registerYoutubeOAuth(app);

let youtubeChatInitialized = false;
let youtubeChatInitPromise: Promise<void> | null = null;

async function initializeYoutubeChat() {
    if (youtubeChatInitialized) return;
    if (youtubeChatInitPromise) return youtubeChatInitPromise;

    youtubeChatInitPromise = (async () => {
        const tokens = await loadYoutubeTokens();
        if (tokens) {
            const liveChatId = await fetchLiveChatId(tokens.access_token);
            if (!liveChatId) {
                console.log("No active YouTube live chat found.");
                return;
            }
            youtubeChatInitialized = true;
            startYoutubeChatPolling({
                accessToken: tokens.access_token,
                liveChatId,
                onChatMessage: handleChatMessage,
            });
            console.log("YouTube chat events initialized.");
        }
    })();

    await youtubeChatInitPromise;
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
        prefix: "/overlay/sims2wait",
        assets: join(process.cwd(), "overlays/sims2wait/dist").toString(),
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

// TODO: add switch to disable either yt or twitch
// currently yt relies on twitch kinda being loaded before
app.listen({
    hostname: "0.0.0.0",
    port: 3000
}, async () => {
    const twTokens = await loadTokens();
    if (twTokens) {
        console.log("Twitch token loaded.");
        await initializeChatAndModules();
        const ytTokens = await loadYoutubeTokens();
        if (ytTokens) {
            console.log("YouTube token loaded.")
            await initializeYoutubeChat();
        } else {
            console.log("No YouTube tokens found. Visit http://localhost:3000/auth/youtube to authorize.")
        }

    } else {
        console.log("No Twitch tokens found. Visit http://localhost:3000/auth/twitch to authorize.");
    }
    console.log("Server running at http://localhost:3000");
});

// initialize chat after OAuth
tokenEvents.on("tokenReady", () => {
    console.log("Token obtained via OAuth! Initializing chat...");
    initializeChatAndModules();
});
tokenEvents.on("youtubeTokenReady", () => {
    console.log("YouTube Token obtained via OAuth! Initializing chat...");
    initializeYoutubeChat();
});

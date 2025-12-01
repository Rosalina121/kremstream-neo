import { Elysia } from "elysia";
import { registerTwitchOAuth } from "./twitch-oauth";
import { registerYoutubeOAuth } from "./youtube-oauth";
import { tokenEvents } from "./token-events";
import serveStatic from "@elysiajs/static";
import { join } from "path";
import { OBSWebSocket } from "./obs-websocket";
import { initVnyan, sendToVnyan } from "./vnyan-int";
import { eventBus } from "./event-bus";
import { IntegrationManager } from "./integration-manager";
import { TwitchIntegration } from "./integrations/twitch-integration";
import { YouTubeIntegration } from "./integrations/youtube-integration";
import { StartupManager } from "./startup-manager";
import { mmrManager } from "./mk-mmr";

const app = new Elysia();
const obsClient = new OBSWebSocket();

const integrationManager = new IntegrationManager(eventBus);
integrationManager.registerIntegration(new TwitchIntegration());
integrationManager.registerIntegration(new YouTubeIntegration());

const startupManager = new StartupManager(integrationManager);

initVnyan();

app.ws("/ws", {
    open(ws) {
        integrationManager.addWebSocketClient(ws);
    },
    close(ws) {
        integrationManager.removeWebSocketClient(ws);
    },
    async message(ws, data: any) {
        console.log(data);
        if (data.type === "overlay") {
            if (data.data.subType === "darkMode") {
                integrationManager.broadcast({ type: "toggleDarkMode" });
            }
            if (data.data.subType === "widescreen") {
                integrationManager.broadcast({ type: "toggleWidescreen" });
            }
            if (data.data.subType === "pause") {
                integrationManager.broadcast({ type: "togglePause" });
                setTimeout(() => {
                    obsClient.toggleFilterEnabled("Freeze");
                }, 100);
            }

            if (data.data.subType === "mmr") {
                await mmrManager.saveMmr(data.data.mmr);
                integrationManager.broadcast({ type: "mmr", data: data.data.mmr });
            }
        }
        if (data.type === "obs") {
            if (data.data.subType === "scene") {
                obsClient.setCurrentProgramScene(data.data.sceneName);
            }
            if (data.data.subType === "jojo") {
                // integrationManager.broadcast({ type: "toggleVintage" });  // chyba niepotrzebne teraz
                setTimeout(() => {
                    obsClient.toggleFilterEnabled("CRT");
                    obsClient.toggleFilterEnabled("VHS");
                    obsClient.toggleFilterEnabled("Freeze");
                    obsClient.toggleSourceEnabled("TEXT VHS End", "Talk Grouped");
                    obsClient.toggleSourceEnabled("TEXT VHS Extra", "Talk Grouped");

                }, 100);
            }
            if (data.data.subType === "freeze") {
                obsClient.toggleFilterEnabled("Freeze");
                setTimeout(() => {
                    obsClient.toggleFilterEnabled("Freeze");
                }, data.data.duration);

            }
        }
        if (data.type === "vnyan") {
            if (data.data.subType === "reset") {
                sendToVnyan("reset");
            }
        }
    }
});

registerTwitchOAuth(app);
registerYoutubeOAuth(app);
obsClient.connect();

app.use(
    serveStatic({
        prefix: "/overlay/switch2",
        assets: join(process.cwd(), "overlays/switch2/dist").toString(),
        alwaysStatic: true,
    }),
);
app.use(
    serveStatic({
        prefix: "/overlay/mariokart",
        assets: join(process.cwd(), "overlays/mariokart/dist").toString(),
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
        prefix: "/overlay/sims2ui",
        assets: join(process.cwd(), "overlays/sims2ui").toString(),
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
        prefix: "/overlay/simswait",
        assets: join(process.cwd(), "overlays/simswait/dist").toString(),
        alwaysStatic: true,
    }),
);
app.use(
    serveStatic({
        prefix: "/overlay/kremos",
        assets: join(process.cwd(), "overlays/kremos/dist").toString(),
        alwaysStatic: true,
    }),
);
app.use(
    serveStatic({
        prefix: "/overlay/kremoswait",
        assets: join(process.cwd(), "overlays/kremoswait/dist").toString(),
        alwaysStatic: true,
    }),
);
app.use(
    serveStatic({
        prefix: "/admin/deck",
        assets: join(process.cwd(), "admin/deck/dist").toString(),
        alwaysStatic: true,
    }),
);

// Handle OAuth callbacks - these fire when user completes authentication
tokenEvents.on("tokenReady", async () => {
    await startupManager.handleNewAuthentication("twitch");
});

tokenEvents.on("youtubeTokenReady", async () => {
    await startupManager.handleNewAuthentication("youtube");
});

app.get("/api/mmr", async () => {
    const mmr = await mmrManager.loadMmr();
    return { mmr };
});

app.listen({
    hostname: "0.0.0.0",
    port: 3000
}, async () => {
    console.log("🌐 Server running at http://localhost:3000");

    // Initialize all integrations based on environment variables and token availability
    await startupManager.initialize();
});

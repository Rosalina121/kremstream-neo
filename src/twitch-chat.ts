import tmi from "tmi.js";

type ChatMessage = {
    text: string;
    username: string;
    color: string;
    profilePic: string;
};

type UserCacheEntry = {
    profilePic: string;
    cachedAt: number;
};

const CACHE_FILE = "./twitch-user-cache.json";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

async function loadUserCache(): Promise<Record<string, UserCacheEntry>> {
    try {
        const file = Bun.file(CACHE_FILE);
        if (!(await file.exists())) return {};
        const text = await file.text();
        return JSON.parse(text);
    } catch {
        return {};
    }
}

async function saveUserCache(cache: Record<string, UserCacheEntry>) {
    await Bun.write(CACHE_FILE, JSON.stringify(cache));
}

export function startTwitchChat({
    channel,
    onMessage,
    clientId,
    accessToken,
}: {
    channel: string;
    onMessage: (msg: ChatMessage) => void;
    clientId: string;
    accessToken: string;
}) {
    const client = new tmi.Client({
        channels: [channel],
        connection: { reconnect: true },
    });

    let userCache: Record<string, UserCacheEntry> = {};
    let cacheLoaded = false;
    async function ensureCacheLoaded() {
        if (!cacheLoaded) {
            userCache = await loadUserCache();
            cacheLoaded = true;
        }
    }

    client.connect();

    client.on("message", async (channel, tags, message, self) => {
        if (self) return;
        await ensureCacheLoaded();

        const username = tags.username || "";
        const now = Date.now();
        let color = tags.color || "#ff256a";
        let profilePic = "";

        const cacheEntry = userCache[username];
        if (cacheEntry && now - cacheEntry.cachedAt < CACHE_TTL) {
            profilePic = cacheEntry.profilePic;
        } else {
            // fetch profile pic from Twitch API
            const userRes = await fetch(`https://api.twitch.tv/helix/users?login=${username}`, {
                headers: {
                    "Client-ID": clientId,
                    "Authorization": `Bearer ${accessToken}`,
                },
            });
            const userData = await userRes.json();
            profilePic = userData.data?.[0]?.profile_image_url ?? "";
            // cache it so we're not spamming twitch api every message
            userCache[username] = {
                profilePic,
                cachedAt: now,
            };
            saveUserCache(userCache);
        }

        onMessage({
            text: message,
            username: tags["display-name"] || username,
            color,
            profilePic,
        });
    });

    return client;
}

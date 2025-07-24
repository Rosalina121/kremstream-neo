type FollowEvent = {
    username: string;
    profilePic: string;
};

type UserCacheEntry = {
    profilePic: string;
    cachedAt: number;
};

const CACHE_FILE = "./twitch_chat_cache.json";
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

type ChatMessageEvent = {
    id: string;
    text: string;
    username: string;
    color: string;
    profilePic: string;
    source: string;
};

type MessageDeleteEvent = {
    id: string;
};

type StartOptions = {
    accessToken: string;
    clientId: string;
    broadcasterUserId: string;
    onFollow?: (event: FollowEvent) => void;
    onChatMessage?: (event: ChatMessageEvent) => void;
    onMessageDelete?: (event: MessageDeleteEvent) => void;
};

export function startTwitchEventWS(opts: StartOptions) {
    let ws: WebSocket | null = null;
    let sessionId: string | null = null;
    let reconnectUrl: string | null = null;
    let keepaliveTimeout: ReturnType<typeof setTimeout> | null = null;

    async function subscribeToEvents(sessionId: string) {
        const eventTypes = [
            {
                type: "channel.follow",
                version: "2",
                condition: {
                    broadcaster_user_id: opts.broadcasterUserId,
                    moderator_user_id: opts.broadcasterUserId
                }
            },
            {
                type: "channel.chat.message",
                version: "1",
                condition: {
                    broadcaster_user_id: opts.broadcasterUserId,
                    user_id: opts.broadcasterUserId
                }
            },
            {
                type: "channel.chat.message_delete",
                version: "1",
                condition: {
                    broadcaster_user_id: opts.broadcasterUserId,
                    user_id: opts.broadcasterUserId
                }
            }
        ];

        for (const eventType of eventTypes) {
            await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
                method: "POST",
                headers: {
                    "Client-ID": opts.clientId,
                    "Authorization": `Bearer ${opts.accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...eventType,
                    transport: {
                        method: "websocket",
                        session_id: sessionId,
                    },
                }),
            });
        }
    }

    function resetKeepalive() {
        if (keepaliveTimeout) clearTimeout(keepaliveTimeout);
        // If no keepalive in 6 minutes, reconnect
        keepaliveTimeout = setTimeout(() => {
            console.warn("[TwitchFollowsWS] No keepalive received, reconnecting...");
            ws?.close();
            connect(reconnectUrl || undefined);
        }, 6 * 60 * 1000);
    }

    async function fetchProfilePic(userId: string): Promise<string> {
        // cached so we don't spam twitch api every chat message
        let userCache: Record<string, UserCacheEntry> = await loadUserCache();
        const now = Date.now();
        const cacheEntry = userCache[userId];
        if (cacheEntry && now - cacheEntry.cachedAt < CACHE_TTL) {
            return cacheEntry.profilePic;
        }

        // call api if not yet cached
        const res = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
            headers: {
                "Client-ID": opts.clientId,
                "Authorization": `Bearer ${opts.accessToken}`,
            },
        });
        const data = await res.json();
        const profilePic = data.data?.[0]?.profile_image_url ?? "";

        userCache[userId] = {
            profilePic,
            cachedAt: now,
        };
        saveUserCache(userCache);
        return profilePic;
    }

    function connect(url = "wss://eventsub.wss.twitch.tv/ws") {
        ws = new WebSocket(url);

        ws.onopen = () => {
            resetKeepalive();
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data.toString());
            const type = data.metadata?.message_type;

            if (type === "session_welcome") {
                sessionId = data.payload.session.id;
                await subscribeToEvents(sessionId);
                resetKeepalive();
            }

            if (type === "session_keepalive") {
                resetKeepalive();
            }

            if (type === "session_reconnect") {
                reconnectUrl = data.payload.session.reconnect_url;
                ws?.close();
                connect(reconnectUrl!);
            }

            if (type === "notification") {
                const subType = data.payload?.subscription?.type;
                const event = data.payload.event;

                if (subType === "channel.follow" && opts.onFollow) {
                    const userId = event.user_id;
                    const username = event.user_name;
                    let profilePic = "";
                    if (!profilePic && userId) {
                        profilePic = await fetchProfilePic(userId);
                    }

                    opts.onFollow({
                        username: username,
                        profilePic: profilePic
                    });
                }

                if (subType === "channel.chat.message" && opts.onChatMessage) {
                    const userId = event.chatter_user_id;
                    const username = event.chatter_user_name;
                    const color = event.chatter_color || "#ff256a";
                    const text = event.message.text;
                    const id = event.message_id;
                    let profilePic = "";
                    if (!profilePic && userId) {
                        profilePic = await fetchProfilePic(userId);
                    }
                    // TODO: parse emotes

                    opts.onChatMessage({
                        id,
                        text,
                        username,
                        color,
                        profilePic,
                        source: "twitch"
                    });
                }

                if (subType === "channel.chat.message_delete" && opts.onMessageDelete) {
                    opts.onMessageDelete({
                        id: event.message_id,
                    });
                }
            }
        };

        ws.onclose = () => {
            if (keepaliveTimeout) clearTimeout(keepaliveTimeout);
            connect(reconnectUrl || undefined);
        };

        ws.onerror = (err) => {
            ws?.close();
        };
    }

    connect();
    return {
        close: () => {
            if (keepaliveTimeout) clearTimeout(keepaliveTimeout);
            ws?.close();
        }
    };
}

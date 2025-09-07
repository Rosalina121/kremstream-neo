import { AbstractIntegration } from './base-integration';
import { eventBus } from '../event-bus';
import { loadTokens, refreshTokens } from '../twitch-oauth';

type UserCacheEntry = {
    profilePic: string;
    cachedAt: number;
};

const CACHE_FILE = "./twitch_chat_cache.json";
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

export class TwitchIntegration extends AbstractIntegration {
    name = "twitch";
    private ws: WebSocket | null = null;
    private sessionId: string | null = null;
    private reconnectUrl: string | null = null;
    private keepaliveTimeout: ReturnType<typeof setTimeout> | null = null;
    private accessToken: string = "";
    private clientId: string = "";
    private broadcasterUserId: string = "";

    constructor() {
        super({ eventBus });
    }

    async start(): Promise<void> {
        if (this.active) return;

        const tokens = await loadTokens();
        if (!tokens) {
            throw new Error("No Twitch tokens available");
        }

        this.accessToken = tokens.access_token;
        this.clientId = process.env.TWITCH_CLIENT_ID!;
        this.broadcasterUserId = process.env.TWITCH_USER_ID!;

        this.connect();
        this.active = true;
        console.log("Twitch integration started");
    }

    async stop(): Promise<void> {
        if (!this.active) return;

        if (this.keepaliveTimeout) {
            clearTimeout(this.keepaliveTimeout);
        }
        this.ws?.close();
        this.active = false;
        console.log("Twitch integration stopped");
    }

    private async loadUserCache(): Promise<Record<string, UserCacheEntry>> {
        try {
            const file = Bun.file(CACHE_FILE);
            if (!(await file.exists())) return {};
            const text = await file.text();
            return JSON.parse(text);
        } catch {
            return {};
        }
    }

    private async saveUserCache(cache: Record<string, UserCacheEntry>) {
        await Bun.write(CACHE_FILE, JSON.stringify(cache));
    }

    private async fetchProfilePic(userId: string): Promise<string> {
        let userCache: Record<string, UserCacheEntry> = await this.loadUserCache();
        const now = Date.now();
        const cacheEntry = userCache[userId];

        if (cacheEntry && now - cacheEntry.cachedAt < CACHE_TTL) {
            return cacheEntry.profilePic;
        }

        const res = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
            headers: {
                "Client-ID": this.clientId,
                "Authorization": `Bearer ${this.accessToken}`,
            },
        });
        const data = await res.json();
        const profilePic = data.data?.[0]?.profile_image_url ?? "";

        userCache[userId] = {
            profilePic,
            cachedAt: now,
        };
        this.saveUserCache(userCache);
        return profilePic;
    }

    private async subscribeToEvents(sessionId: string) {
        const eventTypes = [
            {
                type: "channel.follow",
                version: "2",
                condition: {
                    broadcaster_user_id: this.broadcasterUserId,
                    moderator_user_id: this.broadcasterUserId
                }
            },
            {
                type: "channel.chat.message",
                version: "1",
                condition: {
                    broadcaster_user_id: this.broadcasterUserId,
                    user_id: this.broadcasterUserId
                }
            },
            {
                type: "channel.chat.message_delete",
                version: "1",
                condition: {
                    broadcaster_user_id: this.broadcasterUserId,
                    user_id: this.broadcasterUserId
                }
            }
        ];

        for (const eventType of eventTypes) {
            await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
                method: "POST",
                headers: {
                    "Client-ID": this.clientId,
                    "Authorization": `Bearer ${this.accessToken}`,
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

    private resetKeepalive() {
        if (this.keepaliveTimeout) clearTimeout(this.keepaliveTimeout);

        this.keepaliveTimeout = setTimeout(() => {
            console.warn("[TwitchIntegration] No keepalive received, reconnecting...");
            this.ws?.close();
            this.connect(this.reconnectUrl || undefined);
        }, 6 * 60 * 1000);
    }

    private connect(url = "wss://eventsub.wss.twitch.tv/ws") {
        this.ws = new WebSocket(url);

        this.ws.onopen = () => {
            this.resetKeepalive();
        };

        this.ws.onmessage = async (event) => {
            const data = JSON.parse(event.data.toString());
            const type = data.metadata?.message_type;

            if (type === "session_welcome") {
                this.sessionId = data.payload.session.id;
                if (this.sessionId) {
                    await this.subscribeToEvents(this.sessionId);
                }
                this.resetKeepalive();
            }

            if (type === "session_keepalive") {
                this.resetKeepalive();
            }

            if (type === "session_reconnect") {
                this.reconnectUrl = data.payload.session.reconnect_url;
                this.ws?.close();
                this.connect(this.reconnectUrl || undefined);
            }

            if (type === "notification") {
                const subType = data.payload?.subscription?.type;
                const event = data.payload.event;

                if (subType === "channel.follow") {
                    const userId = event.user_id;
                    const username = event.user_name;
                    let profilePic = "";

                    if (userId) {
                        profilePic = await this.fetchProfilePic(userId);
                    }

                    this.eventBus.publish({
                        type: "follow",
                        data: {
                            username: username,
                            profilePic: profilePic,
                            source: "twitch"
                        }
                    });
                }

                if (subType === "channel.chat.message") {
                    const userId = event.chatter_user_id;
                    const username = event.chatter_user_name;
                    const color = event.chatter_color || "#ff256a";
                    const text = event.message.text;
                    const id = event.message_id;
                    let profilePic = "";

                    if (userId) {
                        profilePic = await this.fetchProfilePic(userId);
                    }

                    this.eventBus.publish({
                        type: "chat",
                        data: {
                            id,
                            text,
                            username,
                            color,
                            profilePic,
                            source: "twitch"
                        }
                    });
                }

                if (subType === "channel.chat.message_delete") {
                    this.eventBus.publish({
                        type: "messageDelete",
                        data: {
                            id: event.message_id,
                            source: "twitch"
                        }
                    });
                }
            }
        };

        this.ws.onclose = () => {
            if (this.keepaliveTimeout) clearTimeout(this.keepaliveTimeout);
            if (this.active) {
                this.connect(this.reconnectUrl || undefined);
            }
        };

        this.ws.onerror = (err) => {
            console.error("[TwitchIntegration] WebSocket error:", err);
            this.ws?.close();
        };
    }
}

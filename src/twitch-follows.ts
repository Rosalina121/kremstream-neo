type FollowEvent = {
    username: string;
    userId: string;
};

type StartOptions = {
    accessToken: string;
    clientId: string;
    broadcasterUserId: string;
    onFollow: (event: FollowEvent) => void;
};

export function startTwitchFollowsWS(opts: StartOptions) {
    let ws: WebSocket | null = null;
    let sessionId: string | null = null;
    let reconnectUrl: string | null = null;
    let keepaliveTimeout: ReturnType<typeof setTimeout> | null = null;

    async function subscribeToFollows(sessionId: string) {
        await fetch("https://api.twitch.tv/helix/eventsub/subscriptions", {
            method: "POST",
            headers: {
                "Client-ID": opts.clientId,
                "Authorization": `Bearer ${opts.accessToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                type: "channel.follow",
                version: "2",
                condition: {
                    broadcaster_user_id: opts.broadcasterUserId,
                    moderator_user_id: opts.broadcasterUserId
                },
                transport: {
                    method: "websocket",
                    session_id: sessionId,
                },
            }),
        });
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

    function connect(url = "wss://eventsub.wss.twitch.tv/ws") {
        ws = new WebSocket(url);

        ws.onopen = () => {
            console.log("[TwitchFollowsWS] Connected to Twitch EventSub WebSocket");
            resetKeepalive();
        };

        ws.onmessage = async (event) => {
            const data = JSON.parse(event.data.toString());
            const type = data.metadata?.message_type;

            if (type === "session_welcome") {
                sessionId = data.payload.session.id;
                await subscribeToFollows(sessionId);
                resetKeepalive();
            }

            if (type === "session_keepalive") {
                resetKeepalive();
            }

            if (type === "session_reconnect") {
                reconnectUrl = data.payload.session.reconnect_url;
                console.log("[TwitchFollowsWS] Reconnect requested, connecting to new URL...");
                ws?.close();
                connect(reconnectUrl!);
            }

            if (type === "notification" &&
                data.payload?.subscription?.type === "channel.follow") {
                const event = data.payload.event;
                opts.onFollow({
                    username: event.user_name,
                    userId: event.user_id,
                });
            }
        };

        ws.onclose = () => {
            console.log("[TwitchFollowsWS] WebSocket closed, reconnecting immediately...");
            if (keepaliveTimeout) clearTimeout(keepaliveTimeout);
            connect(reconnectUrl || undefined);
        };

        ws.onerror = (err) => {
            console.error("[TwitchFollowsWS] WebSocket error:", err);
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

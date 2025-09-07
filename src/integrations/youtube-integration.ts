import { AbstractIntegration } from './base-integration';
import { eventBus } from '../event-bus';
import { loadYoutubeTokens } from '../youtube-oauth';

export class YouTubeIntegration extends AbstractIntegration {
    name = "youtube";
    private accessToken: string = "";
    private liveChatId: string = "";
    private polling = false;
    private nextPageToken: string | undefined = undefined;
    private seenMessageIds = new Set<string>();

    constructor() {
        super({ eventBus });
    }

    async start(): Promise<void> {
        if (this.active) return;

        const tokens = await loadYoutubeTokens();
        if (!tokens) {
            throw new Error("No YouTube tokens available");
        }

        this.accessToken = tokens.access_token;
        const liveChatId = await this.fetchLiveChatId();
        if (!liveChatId) {
            throw new Error("No active YouTube live chat found");
        }

        this.liveChatId = liveChatId;
        this.polling = true;
        this.active = true;

        this.startPolling();
        console.log("YouTube integration started");
    }

    async stop(): Promise<void> {
        if (!this.active) return;

        this.polling = false;
        this.active = false;
        this.seenMessageIds.clear();
        console.log("YouTube integration stopped");
    }

    private async fetchLiveChatId(): Promise<string | null> {
        const res = await fetch("https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&mine=true", {
            headers: {
                Authorization: `Bearer ${this.accessToken}`,
            },
        });
        const data = await res.json();
        console.log(data);
        return data.items?.[0]?.snippet?.liveChatId ?? null;
    }

    private async startPolling() {
        while (this.polling && this.active) {
            try {
                const url = new URL("https://www.googleapis.com/youtube/v3/liveChat/messages");
                url.searchParams.set("liveChatId", this.liveChatId);
                url.searchParams.set("part", "snippet,authorDetails");
                if (this.nextPageToken) {
                    url.searchParams.set("pageToken", this.nextPageToken);
                }

                const res = await fetch(url.toString(), {
                    headers: { Authorization: `Bearer ${this.accessToken}` },
                });

                if (!res.ok) {
                    console.error("[YouTubeIntegration] API error:", res.status, res.statusText);
                    console.log(res);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    continue;
                }

                const data = await res.json();
                this.nextPageToken = data.nextPageToken;

                for (const item of data.items ?? []) {
                    if (item.snippet.type === "textMessageEvent") {
                        if (this.seenMessageIds.has(item.id)) continue;
                        this.seenMessageIds.add(item.id);

                        this.eventBus.publish({
                            type: "chat",
                            data: {
                                id: item.id,
                                text: item.snippet.displayMessage,
                                username: item.authorDetails.displayName,
                                color: "#ff0000", // YouTube red as default
                                profilePic: item.authorDetails.profileImageUrl,
                                source: "youtube"
                            }
                        });
                    }

                    if (item.snippet.type === "messageDeletedEvent") {
                        this.eventBus.publish({
                            type: "messageDelete",
                            data: {
                                id: item.id,
                                source: "youtube"
                            }
                        });
                    }
                }

                const pollInterval = data.pollingIntervalMillis ?? 2000;
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } catch (error) {
                console.error("[YouTubeIntegration] Polling error:", error);
                await new Promise(resolve => setTimeout(resolve, 5000));
            }
        }
    }
}

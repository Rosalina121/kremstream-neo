type YoutubeChatMessageEvent = {
    id: string;
    text: string;
    username: string;
    profilePic: string;
};

type YoutubeMessageDeleteEvent = {
    id: string;
};

type StartOptions = {
    accessToken: string;
    liveChatId: string;
    onChatMessage?: (event: YoutubeChatMessageEvent) => void;
    onMessageDelete?: (event: YoutubeMessageDeleteEvent) => void;
};

async function fetchLiveChatId(accessToken: string): Promise<string | null> {
    // Get the active broadcast's liveChatId
    const res = await fetch("https://www.googleapis.com/youtube/v3/liveBroadcasts?part=snippet&mine=true", {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });
    const data = await res.json();
    // console.log(data)
    return data.items?.[0]?.snippet?.liveChatId ?? null;
}

const serverStartTime = Date.now();

export function startYoutubeChatPolling(opts: StartOptions) {
    let nextPageToken: string | undefined = undefined;
    let polling = true;

    async function poll() {
        while (polling) {
            const url = new URL("https://www.googleapis.com/youtube/v3/liveChat/messages");
            url.searchParams.set("liveChatId", opts.liveChatId);
            url.searchParams.set("part", "snippet,authorDetails");
            if (nextPageToken) url.searchParams.set("pageToken", nextPageToken);

            const res = await fetch(url.toString(), {
                headers: { Authorization: `Bearer ${opts.accessToken}` },
            });
            const data = await res.json();

            nextPageToken = data.nextPageToken;

            for (const item of data.items ?? []) {
                if (opts.onChatMessage && item.snippet.type === "textMessageEvent") {
                    // Only process messages published after server startup
                    const publishedAt = new Date(item.snippet.publishedAt).getTime();
                    if (publishedAt < serverStartTime) continue;

                    // no need for profile pic cache as yt provides a URL in same response
                    opts.onChatMessage({
                        id: item.id,
                        text: item.snippet.displayMessage,
                        username: item.authorDetails.displayName,
                        profilePic: item.authorDetails.profileImageUrl,
                    });
                }
                if (opts.onMessageDelete && item.snippet.type === "messageDeletedEvent") {
                    opts.onMessageDelete({
                        id: item.id
                    })
                }
            }
            // Poll at the interval recommended by YouTube (default 2s)
            await new Promise(res => setTimeout(res, data.pollingIntervalMillis ?? 2000));
        }
    }

    poll();

    return {
        close: () => { polling = false; }
    };
}

export { fetchLiveChatId };

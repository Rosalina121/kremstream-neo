import { Elysia } from "elysia";
import { tokenEvents } from "./token-events";
import { tokenManager } from "./token-manager";

const CLIENT_ID = process.env.YOUTUBE_CLIENT_ID!;
const CLIENT_SECRET = process.env.YOUTUBE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.YOUTUBE_REDIRECT_URI!;
const TOKEN_PATH = "./youtube_tokens.json";

export type YoutubeTokens = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    obtained_at: number;
};

export async function saveYoutubeTokens(tokens: YoutubeTokens) {
    await Bun.write(TOKEN_PATH, JSON.stringify(tokens));
}

export async function refreshYoutubeTokens(tokens: YoutubeTokens): Promise<YoutubeTokens | null> {
    const params = new URLSearchParams({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: "refresh_token",
        refresh_token: tokens.refresh_token,
    });

    const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        body: params,
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.access_token) return null;

    const newTokens: YoutubeTokens = {
        access_token: data.access_token,
        refresh_token: data.refresh_token ?? tokens.refresh_token,
        expires_in: data.expires_in,
        obtained_at: Date.now(),
    };
    await saveYoutubeTokens(newTokens);
    tokenManager.updateTokenState("youtube", newTokens);
    tokenEvents.emit("youtubeTokenReady");
    return newTokens;
}

export async function loadYoutubeTokens(): Promise<YoutubeTokens | null> {
    try {
        const file = Bun.file(TOKEN_PATH);
        if (!(await file.exists())) return null;
        const text = await file.text();
        const tokens: YoutubeTokens = JSON.parse(text);

        const now = Date.now();
        const expiresAt = tokens.obtained_at + (tokens.expires_in * 1000) - 60_000;
        if (now >= expiresAt) {
            const refreshed = await refreshYoutubeTokens(tokens);
            return refreshed;
        }
        return tokens;
    } catch {
        return null;
    }
}

export function registerYoutubeOAuth(app: Elysia) {
    app.get("/auth/youtube", () =>
        new Response(null, {
            status: 302,
            headers: {
                Location:
                    "https://accounts.google.com/o/oauth2/v2/auth?" +
                    new URLSearchParams({
                        client_id: CLIENT_ID,
                        redirect_uri: REDIRECT_URI,
                        response_type: "code",
                        scope: "https://www.googleapis.com/auth/youtube.readonly",
                        access_type: "offline",
                        prompt: "consent",
                    }),
            },
        })
    );

    app.get("/auth/youtube/callback", async ({ query }) => {
        const code = query.code as string;
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: REDIRECT_URI,
        });

        const res = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            body: params,
        });
        const data = await res.json();
        const tokens: YoutubeTokens = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            obtained_at: Date.now(),
        };
        await saveYoutubeTokens(tokens);
        tokenManager.updateTokenState("youtube", tokens);
        tokenEvents.emit("youtubeTokenReady");
        console.log("YouTube OAuth complete! Access token:", tokens.access_token);
        return new Response(null, {
            status: 302,
            headers: { Location: "/" },
        });
    });
}

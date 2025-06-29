import { Elysia } from "elysia";
import { tokenEvents } from "./token-events";

const CLIENT_ID = process.env.TWITCH_CLIENT_ID!;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET!;
const REDIRECT_URI = process.env.TWITCH_REDIRECT_URI!;
const TOKEN_PATH = "./twitch_tokens.json";

export type Tokens = {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    obtained_at: number;
};

export async function saveTokens(tokens: Tokens) {
    await Bun.write(TOKEN_PATH, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<Tokens | null> {
    try {
        const file = Bun.file(TOKEN_PATH);
        if (!(await file.exists())) return null;
        const text = await file.text();
        return JSON.parse(text);
    } catch {
        return null;
    }
}

export function registerTwitchOAuth(app: Elysia) {
    app.get("/auth/twitch", () =>
        new Response(null, {
            status: 302,
            headers: {
                Location:
                    "https://id.twitch.tv/oauth2/authorize?" +
                    new URLSearchParams({
                        client_id: CLIENT_ID,
                        redirect_uri: REDIRECT_URI,
                        response_type: "code",
                        scope: "user:read:email moderator:read:followers",
                    }),
            },
        })
    );

    app.get("/auth/twitch/callback", async ({ query }) => {
        const code = query.code as string;
        const params = new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            code,
            grant_type: "authorization_code",
            redirect_uri: REDIRECT_URI,
        });

        const res = await fetch("https://id.twitch.tv/oauth2/token", {
            method: "POST",
            body: params,
        });
        const data = await res.json();
        console.log(data);
        const tokens: Tokens = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_in: data.expires_in,
            obtained_at: Date.now(),
        };
        await saveTokens(tokens);
        tokenEvents.emit("tokenReady"); // for init modules
        console.log("OAuth complete! Access token:", tokens.access_token);
        return new Response(null, {
            status: 302,
            headers: { Location: "/" },
        });
    });
}

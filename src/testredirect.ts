import { Elysia } from "elysia";

const app = new Elysia();

app.get("/test-redirect", () => {
    return new Response(null, {
        status: 302,
        headers: {
            Location: "https://www.twitch.tv/"
        }
    });
});

app.listen(3030, () => {
    console.log("Listening on http://localhost:3030");
});

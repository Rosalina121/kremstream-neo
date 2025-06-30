# kremstream-neo

My new twitch overlay engine. Heavy work in progress.
Based on: [krem-bun](https://github.com/Rosalina121/krem-bun)

This will work in similar way (same technologies duh), but will be more maintainable

Old project still works, it's just too janky, so decided to start from scratch

# Run

To install:

```bash
bun i
```

(You may have to also run it in /overlays/switch2 etc... dirs as well, they're separate React frontends)

To run:

```bash
bun build:overlays
bun start
```

# Required setup
You'll need to create an app in [Twitch Dev Console](https://dev.twitch.tv/console/apps).

This works via OAuth, so make sure to match the callback uri. Default port is 3000, so callback can be like `http://localhost:3000/auth/callback`.

This, and stuff like secrets and ids are to be stored in a `.env` file. Create one with following props:

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_REDIRECT_URI=http://localhost:3000/auth/callback
TWITCH_USER_ID=your_user_id
```
All are self explanatory. You can find your user_id via a simple API call, or just any website that offers that.

Technically chat can work well without OAuth, or any auth for that matter (see [tmi.js](https://tmijs.com/)), but here we're listening on a websocket that also provides follows and events like message_deleted, that AFAIK can only be listened on with OAuth, so that's why.

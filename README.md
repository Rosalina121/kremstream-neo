# kremstream-neo

My new twitch overlay engine. Heavy work in progress.
Based on: [krem-bun](https://github.com/Rosalina121/krem-bun)

This will work in similar way (same technologies duh), but will be more maintainable

Old project still works, it's just too janky, so decided to start from scratch

# Run

## To install

```bash
bun i
```

(You may have to also run it in /overlays/switch2 etc... dirs as well, they're separate React frontends)

To run:

```bash
bun build:overlays
bun start
```

## Required setup
You'll need to create an app in [Twitch Dev Console](https://dev.twitch.tv/console/apps).

This works via OAuth, so make sure to match the callback uri. Default port is 3000, so callback can be like `http://localhost:3000/auth/callback`.

This, and stuff like secrets and ids are to be stored in a `.env` file. Create one with following props:

```
TWITCH_CLIENT_ID=your_client_id
TWITCH_CLIENT_SECRET=your_client_secret
TWITCH_REDIRECT_URI=http://localhost:3000/auth/callback
TWITCH_USER_ID=your_user_id
OBS_WS_PASSWORD=obs_websocket_password
```
All are self explanatory. You can find your user_id via a simple API call, or just any website that offers that.

Technically chat can work well without OAuth, or any auth for that matter (see [tmi.js](https://tmijs.com/)), but here we're listening on a websocket that also provides follows and events like message_deleted, that AFAIK can only be listened on with OAuth, so that's why.

# Usage
## Server
On the server side of things there's a websocket handling all communications, currently between:
- Twitch API websocket
- Admin views
- Overlays
- Easter eggs

Some flow examples:
- Twitch API -> Server -> Overlays
- Twitch API -> Server -> Easter eggs
- Admin view -> Server -> Overlays

Planned (to bring it up to speed compared to `krem-bun`):
- OBS websocket API
- VNyan websocket API

## Overlays
Overlays are generally a separate, self-contained React apps,
that communicate with the server via a websocket.
Most just receive follows, chats and chat deletes, plus some overlay-specific messages (like a dark mode toggle).

Currently there's a single overlay by default - Switch 2

Following is/will be a breakdown of overlay-specific things, and stuff
that stands out from the general functionality.

### Switch 2
Overlay checks if the incoming messages contain `!L` or `!R` (case-insensitive) and move the cursor between "buttons" on the UI,
just like in the Switch 2 OS UI. Buttons are defined in a simple array, including the icon (which is just from the `react-icons`), so super easy to change.

The camera cutout has a dirty hacky CSS so that the transparency can be a rounded rectangle, yet still have this nice gradient moving border. It's ugly, it's rough, and frankly I'm surprised that OBS browser source handles it well.

## External programs
### OBS
There's a websocket server connected to the OBS' one. You can change scenes and do other stuff straight from the deck view.

## Extras
### OCR
There's a simple draft OCR implementation with `tesseract.js`. It grabs a frame from an OBS source (or scene) and just rawdoggs it and spits out garbage.  
I had hoped to use it to get live stats from Mario Kart for an overlay, but now I think that should be an external project. Leaving the draft in code, who knows, maybe it will come in handy.
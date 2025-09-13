# BLINK v0.1

BLINK is a minimal chat prototype with a Fastify server and static web client.
It features streaming replies, browsing with citations, optional verification,
and encrypted cloud sync for Plus users.

## Quickstart

1. Copy `server/.env.example` to `server/.env` and fill in provider keys.
2. Install and build the server:
   ```bash
   cd server
   npm install
   npm run build
   npm start
   ```
3. Open `web/index.html` in your browser.

## Privacy

Enable **Privacy Mode** to force all requests to the local model and block
network egress. Region is pinned to `AU` and only allow‑listed providers are
used. No model names or quotas are exposed to the client.

## Plans

- **Free** – local-only chat.
- **Plus** – $8/month unlocks online providers, claim verification, and
  end-to-end encrypted cloud sync.

![demo](https://example.com/blink.gif)

Licensed under the [MIT License](LICENSE).

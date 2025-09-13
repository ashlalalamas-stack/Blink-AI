# BLINK v0.1

BLINK is a minimal chat prototype with a Fastify server and static web client.

## Overview

* Chat-first assistant that stays on-device unless online help improves quality.
* Routing order: **oss120b_api → mistral 3.1 → gpt-5 thinking high → local**.
* Allowlist-only providers with region‑pinned egress (AU by default).

### UX

* Single clean conversation with tiny glyphs: **shield** (private), **globe** (online), **check** (verified).
* Settings include **Privacy Mode** and optional **Cloud Sync** for Plus users.

### Capabilities

* Chat, browse with citations, run local Python, parse files (PDF/CSV/Docs), basic vision and image generation.
* Local tier handles summaries, Q&A, OCR, and light coding fully offline.

### Privacy

* Nothing leaves the device unless online help is needed and allowed.
* One-tap purge and no training on user data unless opted in.

### Goal

Beat ChatGPT on everyday speed and reliability while matching breadth—without clutter.

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

### Desktop builds

To produce standalone binaries for macOS and Windows:

```bash
cd server
npm run package
```
The build artifacts will appear in `server/build/`.

### Python code runner

The web client includes a **Run Py** button. Enter Python code in the text box
and click it to execute the snippet locally on the server. Output (stdout and
stderr) is returned as a local response.

## Privacy

Enable **Privacy Mode** in the web client to force all requests to the local
model. When privacy mode is off, the server may contact remote providers but
never shares model names or quotas with the browser. Region is pinned to `AU`.

If `LOCAL_MODEL_URL` is set, the server will automatically download the local
model on first run into `models/` so it can answer offline.

## Plans

- **Free** – local-only.
- **Plus** – $8/month for access to online providers.

Licensed under the [MIT License](LICENSE).

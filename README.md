# BLINK v0.1

BLINK is a minimal chat prototype with a Fastify server and static web client.

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

### Python code runner

The web client includes a **Run Py** button. Enter Python code in the text box
and click it to execute the snippet locally on the server. Output (stdout and
stderr) is returned as a local response.

## Privacy

Enable **Privacy Mode** in the web client to force all requests to the local
model. When privacy mode is off, the server may contact remote providers but
never shares model names or quotas with the browser. Region is pinned to `AU`.

## Plans

- **Free** – local-only.
- **Plus** – $8/month for access to online providers.

Licensed under the [MIT License](LICENSE).

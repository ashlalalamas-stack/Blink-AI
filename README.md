# BLINK

BLINK is an open-source chat client and server prototype that aims to offer a
polished alternative to hosted assistants.

## Features

- Fastify backend with optional remote provider integration
- Lightweight web UI with privacy mode
- Execute Python snippets on the server via **Run Py**
- macOS binary build and automated release workflow

## Getting Started

### Server

1. Copy `server/.env.example` to `server/.env` and supply provider keys.
2. Install dependencies and start the server:

   ```bash
   cd server
   npm install
   npm run build
   npm start
   ```

### Client

Open `web/index.html` in your browser to begin chatting.

### macOS Build

Create a standalone macOS executable with:

```bash
cd server
npm install
npm run build:mac
```

The binary `blink-macos` will be placed in the `server/` directory.

## Releasing

Pushing a tag such as `v1.0.0` runs the workflow defined in
`.github/workflows/release.yml` to build the macOS binary and attach it to a
GitHub release.

## Privacy

Enable **Privacy** in the web client to force all requests through the local
model only. When disabled, the server may contact remote providers but never
shares model names or quotas with the browser; region is pinned to `AU`.

## License

Licensed under the [MIT License](LICENSE).


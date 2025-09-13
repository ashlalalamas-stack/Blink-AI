import Fastify from 'fastify';
import { config } from 'dotenv';
import { routeChat } from './router.js';
import { runPython } from './python.js';
import { ensureLocalModel } from './model.js';

config();
process.env.REGION = process.env.REGION || 'AU';

const app = Fastify();

ensureLocalModel().catch(err => app.log.error({ err }, 'model download failed'));

app.get('/health', async (_req, _res) => {
  return { ok: true, region: process.env.REGION };
});

app.post('/api/chat', async (req, res) => {
  const body = req.body as any;
  const messages = Array.isArray(body?.messages) ? body.messages : [];
  const privacyMode = !!body?.privacyMode;
  const result = await routeChat(messages, privacyMode, req.log);
  return { reply: result.reply, local: result.local, verified: result.verified };
});

app.post('/api/python', async (req, res) => {
  const body = req.body as any;
  const code = typeof body?.code === 'string' ? body.code : '';
  const result = await runPython(code);
  return result;
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 3000;
  app.listen({ port, host: '0.0.0.0' }).catch(err => {
    app.log.error(err);
    process.exit(1);
  });
}

export default app;

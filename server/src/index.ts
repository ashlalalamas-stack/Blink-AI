import Fastify from 'fastify';
import { config } from 'dotenv';
import rateLimit from '@fastify/rate-limit';
import cors from '@fastify/cors';
import { routeChat, Message } from './router.js';
import { browse } from './browse.js';

config();
process.env.REGION = process.env.REGION || 'AU';

const app = Fastify();
await app.register(rateLimit, { max: 5, timeWindow: '1 minute' });
await app.register(cors, { origin: false });

const syncStore = new Map<string, any>();

app.get('/health', async () => {
  return { ok: true, region: process.env.REGION };
});

app.get('/config', async () => ({ plus: process.env.PLUS_ENABLED === 'true' }));

app.post('/api/chat', async (req, res) => {
  const body = req.body as any || {};
  const messages: Message[] = Array.isArray(body.messages) ? body.messages : [];
  const privacyMode = !!body?.privacyMode;
  const offline = !!body?.offline;
  const last = messages[messages.length - 1]?.content || '';
  const needsBrowse = /\b(latest|compare|verify)\b/i.test(last);
  const sources = needsBrowse ? await browse(last, body.maxSources || 3) : [];
  const result = await routeChat(messages, privacyMode || offline, req.log);

  res.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  for (const token of result.reply.split(/\s+/)) {
    if(token) res.raw.write(`data: ${token}\n\n`);
  }
  const donePayload: any = { local: result.local, sources };
  if(process.env.PLUS_ENABLED === 'true' && sources.length >= 2){
    donePayload.verified = true;
    donePayload.citations = sources.slice(0,2);
  } else {
    donePayload.verified = false;
    donePayload.citations = [];
  }
  res.raw.write(`event: done\ndata: ${JSON.stringify(donePayload)}\n\n`);
  res.raw.end();
});

app.post('/api/browse', async (req, res) => {
  const body = req.body as any;
  const q = String(body?.q || '');
  const maxSources = Number(body?.maxSources) || 3;
  const sources = await browse(q, maxSources);
  return { sources };
});

app.post('/api/sync', async (req, res) => {
  if(process.env.PLUS_ENABLED !== 'true') return res.status(403).send({ ok: false });
  const body = req.body as any;
  const id = String(body?.id || 'default');
  const blob = body?.blob;
  syncStore.set(id, blob);
  return { ok: true };
});

if (process.env.NODE_ENV !== 'test') {
  const port = Number(process.env.PORT) || 3000;
  app.listen({ port, host: '0.0.0.0' }).catch(err => {
    app.log.error(err);
    process.exit(1);
  });
}

export default app;

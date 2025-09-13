import { existsSync, createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';

/** Ensure a local model file exists, downloading it if absent. */
export async function ensureLocalModel() {
  const url = process.env.LOCAL_MODEL_URL;
  const dest = process.env.LOCAL_MODEL_PATH || path.join(process.cwd(), 'models', 'local-model.bin');
  if (existsSync(dest) || !url) return;
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`failed to download model: ${res.status}`);
  await pipeline(res.body as any, createWriteStream(dest));
}

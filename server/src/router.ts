import type { FastifyBaseLogger } from 'fastify';

export interface Message { role: string; content: string }

const REGION = process.env.REGION || 'AU';
const ORDER = ['oss120b_api','mistral_3_1','gpt5_thinking_high'] as const;
const ALLOWLIST = new Set([...ORDER, 'local_inf']);

interface Provider {
  id: string;
  baseUrl: string;
  apiKey?: string;
  model: string;
  timeout: number;
  healthy: boolean;
}

function isBlocked(url?: string): boolean {
  return !!url && url.includes('.cn');
}

function providerInfo(id: string): Provider | null {
  if (!ALLOWLIST.has(id)) return null;
  switch(id){
    case 'oss120b_api':
      if(isBlocked(process.env.OSS120B_BASE_URL)) return null;
      return {
        id,
        baseUrl: process.env.OSS120B_BASE_URL!,
        apiKey: process.env.OSS120B_API_KEY!,
        model: process.env.OSS120B_MODEL || 'oss-120b',
        timeout: 10000,
        healthy: true
      };
    case 'mistral_3_1':
      if(isBlocked(process.env.MISTRAL_BASE_URL)) return null;
      return {
        id,
        baseUrl: process.env.MISTRAL_BASE_URL!,
        apiKey: process.env.MISTRAL_API_KEY!,
        model: process.env.MISTRAL_MODEL || 'mistral-3.1',
        timeout: 10000,
        healthy: true
      };
    case 'gpt5_thinking_high':
      if(isBlocked(process.env.GPT5_BASE_URL)) return null;
      return {
        id,
        baseUrl: process.env.GPT5_BASE_URL!,
        apiKey: process.env.GPT5_API_KEY!,
        model: process.env.GPT5_MODEL || 'gpt5-thinking-high',
        timeout: 20000,
        healthy: true
      };
    case 'local_inf':
      return {
        id,
        baseUrl: process.env.LOCAL_BASE_URL!,
        model: process.env.LOCAL_MODEL || 'local-20b',
        timeout: 30000,
        healthy: true
      };
    default:
      return null;
  }
}

let localProvider = providerInfo('local_inf');
if(localProvider){
  try {
    const res = await fetch(localProvider.baseUrl + '/health');
    localProvider.healthy = res.ok;
  } catch {
    localProvider.healthy = false;
  }
}

async function callProvider(p: Provider, messages: Message[], log: FastifyBaseLogger): Promise<{reply: string|null; status:number}> {
  const url = p.baseUrl.replace(/\/v1?$/, '') + '/chat/completions';
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), p.timeout);
  const start = Date.now();
  try {
    const res = await fetch(url, {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(p.apiKey ? { 'Authorization': `Bearer ${p.apiKey}` } : {}),
        'X-Region': REGION
      },
      body: JSON.stringify({ model: p.model, messages })
    });
    const ms = Date.now() - start;
    log.info({ route: p.id, ms });
    if(!res.ok){
      return {reply:null, status: res.status};
    }
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    return {reply: typeof reply === 'string' ? reply : null, status: res.status};
  } catch {
    return {reply:null, status:0};
  } finally {
    clearTimeout(timer);
  }
}

export async function routeChat(messages: Message[], forceLocal: boolean, log: FastifyBaseLogger): Promise<{reply: string; local: boolean}> {
  if(forceLocal){
    if(localProvider && localProvider.healthy){
      const {reply} = await callProvider(localProvider, messages, log);
      return { reply: reply || '', local: true };
    }
    return { reply: '', local: true };
  }

  for(const id of ORDER){
    const p = providerInfo(id);
    if(!p || !p.healthy) continue;
    for(let attempt=0; attempt<2; attempt++){
      const {reply, status} = await callProvider(p, messages, log);
      if(reply) return {reply, local:false};
      if(status >=500 || status ===0){
        p.healthy = false;
        setTimeout(() => { p.healthy = true; }, 30000);
        await new Promise(r => setTimeout(r, Math.random()*100));
        continue;
      }
      if(status >=400 && status <500){
        // misconfig, fall back to local
        break;
      }
    }
  }
  if(localProvider && localProvider.healthy){
    const {reply} = await callProvider(localProvider, messages, log);
    return { reply: reply || '', local: true };
  }
  return { reply: '', local: true };
}

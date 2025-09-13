import type { FastifyBaseLogger } from 'fastify';

interface Message { role: string; content: string }

const REGION = process.env.REGION || 'AU';

const ORDER = ['oss120b_api','mistral_3_1','gpt5_thinking_high'];
const ALLOWLIST = new Set(['oss120b_api','mistral_3_1','gpt5_thinking_high','local_inf']);

interface Provider {
  baseUrl: string;
  apiKey?: string;
  model: string;
}

function isBlocked(url?: string): boolean {
  return !!url && url.includes('.cn');
}

function info(id: string): Provider | null {
  if(!ALLOWLIST.has(id)) return null;
  switch(id){
    case 'oss120b_api':
      if(isBlocked(process.env.OSS120B_BASE_URL)) return null;
      return {
        baseUrl: process.env.OSS120B_BASE_URL!,
        apiKey: process.env.OSS120B_API_KEY!,
        model: process.env.OSS120B_MODEL || 'oss-120b'
      };
    case 'mistral_3_1':
      if(isBlocked(process.env.MISTRAL_BASE_URL)) return null;
      return {
        baseUrl: process.env.MISTRAL_BASE_URL!,
        apiKey: process.env.MISTRAL_API_KEY!,
        model: process.env.MISTRAL_MODEL || 'mistral-3.1'
      };
    case 'gpt5_thinking_high':
      if(isBlocked(process.env.GPT5_BASE_URL)) return null;
      return {
        baseUrl: process.env.GPT5_BASE_URL!,
        apiKey: process.env.GPT5_API_KEY!,
        model: process.env.GPT5_MODEL || 'gpt5-thinking-high'
      };
    case 'local_inf':
      return {
        baseUrl: process.env.LOCAL_BASE_URL!,
        model: process.env.LOCAL_MODEL || 'local-20b'
      };
    default:
      return null;
  }
}

async function callProvider(p: Provider, messages: Message[]): Promise<string | null> {
  try {
    const res = await fetch(p.baseUrl.replace(/\/v1?$/, '') + '/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(p.apiKey ? { 'Authorization': `Bearer ${p.apiKey}` } : {}),
        'X-Region': REGION
      },
      body: JSON.stringify({ model: p.model, messages })
    });
    if(!res.ok) return null;
    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content;
    return typeof reply === 'string' ? reply : null;
  } catch {
    return null;
  }
}

export async function routeChat(messages: Message[], forceLocal: boolean, log: FastifyBaseLogger): Promise<{reply: string; local: boolean; verified: boolean}> {
  if(forceLocal){
    const local = info('local_inf');
    const reply = local ? await callProvider(local, messages) : null;
    return { reply: reply || '', local: true, verified: false };
  }
  for(const id of ORDER){
    const p = info(id);
    if(!p) continue;
    const reply = await callProvider(p, messages);
    if(reply) return {reply, local:false, verified:false};
  }
  const local = info('local_inf');
  const reply = (local ? await callProvider(local, messages) : '') || '';
  return {reply, local:true, verified:false};
}

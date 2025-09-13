import { test } from 'node:test';
import assert from 'node:assert';
import { routeChat } from '../dist/router.js';

const messages = [{ role: 'user', content: 'hi' }];

test('privacy mode forces local and blocks network', async () => {
  let remoteCalled = false;
  const originalFetch = global.fetch;
  global.fetch = async (input: any) => {
    const url = typeof input === 'string' ? input : input.toString();
    if(!url.includes('local')) remoteCalled = true;
    return {
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'hello' } }] })
    } as any;
  };
  const res = await routeChat(messages, true, console as any);
  assert.equal(res.local, true);
  assert.equal(remoteCalled, false);
  global.fetch = originalFetch;
});

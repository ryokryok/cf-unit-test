import { it, expect, describe } from 'vitest';
import { Miniflare } from 'miniflare';

describe('worker test', () => {
  it('Miniflare', async () => {
    const mf = new Miniflare({
      name: 'main',
      modules: true,
      script: `
    export default {
      async fetch(request, env, ctx){
        return new Response('Hello World!');
      },};
    `,
    });

    const res = await mf.dispatchFetch('http://localhost:8787/');
    expect(await res.text()).toBe('Hello World!');
    mf.dispose();
  });
});

describe('storage test', () => {
  it('KV', async () => {
    const mf = new Miniflare({
      name: 'main',
      modules: true,
      script: '',
      kvNamespaces: ['KV'],
    });

    const kv = await mf.getKVNamespace('KV');
    await kv.put('foo', 'bar');
    expect(await kv.get('foo')).toBe('bar');
    mf.dispose();
  });
  it('DB', async () => {
    const mf = new Miniflare({
      name: 'main',
      modules: true,
      script: '',
      d1Databases: ['DB'],
    });

    const d1 = await mf.getD1Database('DB');
    await d1.exec('DROP TABLE IF EXISTS Users;');
    await d1.exec('CREATE TABLE IF NOT EXISTS Users (ID INTEGER PRIMARY KEY, Name TEXT, Email TEXT);');
    await d1.exec(`INSERT INTO Users (ID, Name, Email) VALUES (1, 'Tom', 'tom@example.com');`);
    const { results } = await d1.prepare('SELECT * FROM Users WHERE ID = ?').bind(1).all();
    expect(results).toEqual([
      {
        ID: 1,
        Name: 'Tom',
        Email: 'tom@example.com',
      },
    ]);

    mf.dispose();
  });

  it('R2', async () => {
    const mf = new Miniflare({
      name: 'main',
      modules: true,
      script: '',
      r2Buckets: ['BUCKET'],
    });

    const r2 = await mf.getR2Bucket('BUCKET');
    await r2.put('foo', 'bar');
    const object = await r2.get('foo');
    expect(await object?.text()).toBe('bar');
    mf.dispose();
  });
});

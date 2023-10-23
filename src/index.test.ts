import { it, expect } from 'vitest';
import { Miniflare } from 'miniflare';

it('worker test', async () => {
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
});

it('storage test', async () => {
  const mf = new Miniflare({
    name: 'main',
    modules: true,
    script: `
    export default {
      async fetch(request, env, ctx){
        return new Response('Hello World!');
      },};
    `,
    kvNamespaces: ['KV'],
    d1Databases: ['DB'],
    r2Buckets: ['BUCKET'],
  });

  const kv = await mf.getKVNamespace('KV');
  await kv.put('foo', 'bar');
  expect(await kv.get('foo')).toBe('bar');

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

  const r2 = await mf.getR2Bucket('BUCKET');
  await r2.put('foo', 'bar');
  const object = await r2.get('foo');
  expect(await object?.text()).toBe('bar');
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker from './candidate/worker.mjs';
const html=readFileSync(new URL('./candidate/index.html',import.meta.url),'utf8');
test('all embedded scripts compile; no TEST server or credential namespace',()=>{
 for(const m of html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g))new vm.Script(m[1]);
 assert.ok(!html.includes('franka-family-sync-test.wisniajoker90.workers.dev'));
 assert.ok(!html.includes('family-sync-pilot37'));
 assert.ok(!html.includes('Dodaj fikcyjny punkt'));
 assert.ok(!html.includes('Symuluj brak internetu'));
 assert.ok(html.includes('family-sync-production37'));
 assert.ok(html.includes('hf37prod:learning-transaction'));
});
test('learning content preceding sync panel is unchanged apart from journal namespace',()=>{
 const source=readFileSync(new URL('../../index.html',import.meta.url),'utf8');
 const before=source.split('<!-- Family Sync TEST pilot:')[0];
 assert.ok(html.startsWith(before.replaceAll('hf37:learning-transaction','hf37prod:learning-transaction')));
});
test('inactive backend refuses all data routes even with credentials',async()=>{
 const env={DB:{},SYNC_ENABLED:'false'};
 for(const p of ['/v1/setup','/v1/join','/v1/me','/v1/profiles','/v1/learning','/v1/recover-parent']){
  const r=await worker.fetch(new Request('https://franka-family-sync.wisniajoker90.workers.dev'+p,{headers:{Origin:'https://wisniajoker90.github.io',Authorization:'Bearer '+'a'.repeat(64)}}),env);
  assert.equal(r.status,503);assert.equal((await r.json()).error,'sync_disabled');
 }
});
test('production backend rejects TEST origin and TEST host',async()=>{
 for(const [host,origin] of [['franka-family-sync.wisniajoker90.workers.dev','https://hiszpanski-franka-test.pages.dev'],['franka-family-sync-test.wisniajoker90.workers.dev','https://wisniajoker90.github.io']]){
 const r=await worker.fetch(new Request('https://'+host+'/health',{headers:{Origin:origin}}),{DB:{},SYNC_ENABLED:'true'});assert.equal(r.status,403);assert.equal(r.headers.get('Access-Control-Allow-Origin')==='https://hiszpanski-franka-test.pages.dev',false);
 }
});

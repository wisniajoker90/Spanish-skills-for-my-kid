// Family Sync TEST backend v1. No production origin or automatic data migration.
const HOST = 'franka-family-sync-test.wisniajoker90.workers.dev';
const ORIGIN = 'https://hiszpanski-franka-test.pages.dev';
const VERSION = 'family-sync-test-4';
const LIMIT = 1024 * 1024;
const FAMILY = 'family-test'; // One family per TEST instance; setup cannot overwrite it.
class HttpError extends Error { constructor(status, code) { super(code); this.status = status; } }
const fail = (status, code) => { throw new HttpError(status, code); };
const json = (value, status = 200) => Response.json(value, {status});
const random = (size = 32) => Array.from(crypto.getRandomValues(new Uint8Array(size)), b => b.toString(16).padStart(2, '0')).join('');
const hash = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), b => b.toString(16).padStart(2, '0')).join('');
async function equalSecret(a, b) {
  const x = await hash(a), y = await hash(b); let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return diff === 0;
}
function label(value) {
  if (typeof value !== 'string' || !value.trim() || value.length > 80 || /[\u0000-\u001f]/.test(value)) fail(400, 'invalid_name');
  return value.trim();
}
function snapshot(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || value.schema !== 1 || !value.data || typeof value.data !== 'object' || Array.isArray(value.data)) fail(400, 'invalid_snapshot');
  const result = JSON.stringify(value);
  if (new TextEncoder().encode(result).length > LIMIT - 2048) fail(413, 'snapshot_too_large');
  return result;
}
async function body(request) {
  if (request.headers.get('Content-Type')?.split(';')[0].trim() !== 'application/json') fail(415, 'json_required');
  if (Number(request.headers.get('Content-Length')) > LIMIT) fail(413, 'request_too_large');
  if (!request.body) fail(400, 'body_required');
  const reader = request.body.getReader(), parts = []; let size = 0;
  while (true) {
    const part = await reader.read(); if (part.done) break;
    size += part.value.length;
    if (size > LIMIT) { await reader.cancel(); fail(413, 'request_too_large'); }
    parts.push(part.value);
  }
  const bytes = new Uint8Array(size); let offset = 0;
  for (const part of parts) { bytes.set(part, offset); offset += part.length; }
  try { const value = JSON.parse(new TextDecoder().decode(bytes)); if (!value || typeof value !== 'object' || Array.isArray(value)) fail(400, 'invalid_json'); return value; }
  catch { fail(400, 'invalid_json'); }
}
const statement = (db, sql, ...values) => db.prepare(sql).bind(...values);
async function authenticated(request, db) {
  const token = request.headers.get('Authorization')?.match(/^Bearer ([a-f0-9]{64})$/)?.[1];
  if (!token) fail(401, 'unauthorized');
  const device = await statement(db, 'SELECT id,family_id,name,role FROM devices WHERE token_hash=? AND revoked_at IS NULL', await hash(token)).first();
  if (!device) fail(401, 'unauthorized');
  await statement(db, 'UPDATE devices SET last_seen_at=? WHERE id=?', Date.now(), device.id).run();
  return device;
}
const parent = device => { if (device.role !== 'parent') fail(403, 'parent_required'); };
async function route(request, env) {
  const url = new URL(request.url), path = url.pathname, method = request.method;
  if (url.hostname !== HOST) fail(403, 'test_host_only');
  const origin = request.headers.get('Origin');
  if (origin && origin !== ORIGIN) fail(403, 'origin_not_allowed');
  if (method === 'OPTIONS') return new Response(null, {status: 204});
  const db = env.DB;
  if (!db) fail(503, 'database_unavailable');
  if (path === '/health' && method === 'GET') {
    const check = await db.prepare('SELECT 1 AS connected').first();
    const tables = await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('families','devices','profiles','pairing_codes')").all();
    const ready = check?.connected === 1 && tables.results.length === 4 && typeof env.FAMILY_SETUP_KEY === 'string' && env.FAMILY_SETUP_KEY.length >= 32;
    return json({service: 'franka-family-sync-test', version: VERSION, database: check?.connected === 1 ? 'ok' : 'error', tablesReady: tables.results.length === 4, setupConfigured: typeof env.FAMILY_SETUP_KEY === 'string' && env.FAMILY_SETUP_KEY.length >= 32, backendReady: ready, syncEnabled: false, retrySafePairing: true, learningProfiles: true, versionHistory: true}, ready ? 200 : 503);
  }
  if (path === '/v1/setup' && method === 'POST') {
    if (typeof env.FAMILY_SETUP_KEY !== 'string' || env.FAMILY_SETUP_KEY.length < 32) fail(503, 'setup_unavailable');
    const key = request.headers.get('X-Family-Setup-Key') || '';
    if (key.length > 512 || !await equalSecret(key, env.FAMILY_SETUP_KEY)) fail(401, 'unauthorized');
    const input = await body(request), name = label(input.deviceName), profileName = label(input.profileName);
    // Initial snapshot must be an explicit choice by the parent; never derived from another device.
    const data = snapshot(input.snapshot), token = random(), id = crypto.randomUUID(), profileId = crypto.randomUUID(), now = Date.now();
    if (await statement(db, 'SELECT id FROM families WHERE id=?', FAMILY).first()) fail(409, 'family_already_exists');
    try {
      await db.batch([
        statement(db, 'INSERT INTO families(id,created_at) VALUES(?,?)', FAMILY, now),
        statement(db, "INSERT INTO devices(id,family_id,name,role,token_hash,created_at,last_seen_at) VALUES(?,?,?,'parent',?,?,?)", id, FAMILY, name, await hash(token), now, now),
        statement(db, 'INSERT INTO profiles(id,family_id,name,revision,snapshot_json,updated_at,updated_by_device_id) VALUES(?,?,?,1,?,?,?)', profileId, FAMILY, profileName, data, now, id)
      ]);
    } catch (error) {
      if (await statement(db, 'SELECT id FROM families WHERE id=?', FAMILY).first()) fail(409, 'family_already_exists');
      throw error;
    }
    return json({deviceId: id, familyId: FAMILY, profileId, token, revision: 1}, 201);
  }
  if (path === '/v1/recover-parent' && method === 'POST') {
    if (typeof env.FAMILY_SETUP_KEY !== 'string' || env.FAMILY_SETUP_KEY.length < 32) fail(503, 'setup_unavailable');
    const key = request.headers.get('X-Family-Setup-Key') || '';
    if (key.length > 512 || !await equalSecret(key, env.FAMILY_SETUP_KEY)) fail(401, 'unauthorized');
    const input = await body(request), name = label(input.deviceName);
    // Client persists this random credential BEFORE sending, so a lost response is retryable.
    if (!/^[a-f0-9]{64}$/.test(input.token || '') || !/^[a-f0-9-]{36}$/.test(input.deviceId || '')) fail(400, 'invalid_recovery');
    const tokenHash = await hash(input.token), id = input.deviceId;
    const prior = await statement(db, 'SELECT family_id,role,token_hash,revoked_at FROM devices WHERE id=?', id).first();
    if (prior) {
      if (prior.family_id !== FAMILY || prior.role !== 'parent' || prior.token_hash !== tokenHash || prior.revoked_at !== null) fail(409, 'recovery_expired');
      return json({deviceId: id, token: input.token});
    }
    if (!await statement(db, 'SELECT id FROM families WHERE id=?', FAMILY).first()) fail(404, 'family_not_found');
    const now = Date.now();
    await db.batch([
      statement(db, "UPDATE devices SET revoked_at=? WHERE family_id=? AND role='parent' AND revoked_at IS NULL", now, FAMILY),
      statement(db, 'DELETE FROM pairing_codes WHERE family_id=?', FAMILY),
      statement(db, "INSERT INTO devices(id,family_id,name,role,token_hash,created_at,last_seen_at) VALUES(?,?,?,'parent',?,?,?)", id, FAMILY, name, tokenHash, now, now)
    ]);
    // Profiles and learner devices are untouched. Old parent tokens and pairing codes stop working.
    return json({deviceId: id, token: input.token}, 201);
  }
  if (path === '/v1/join' && method === 'POST') {
    const input = await body(request), name = label(input.deviceName);
    if (typeof input.code !== 'string' || !/^[a-f0-9]{32}$/.test(input.code)) fail(400, 'invalid_pairing_code');
    const retrySafe = input.deviceId !== undefined || input.token !== undefined;
    if (retrySafe && (!/^[a-f0-9-]{36}$/.test(input.deviceId || '') || !/^[a-f0-9]{64}$/.test(input.token || ''))) fail(400, 'invalid_join_attempt');
    const codeHash = await hash(input.code), now = Date.now(), id = retrySafe ? input.deviceId : crypto.randomUUID(), token = retrySafe ? input.token : random();
    const tokenHash = await hash(token);
    async function previousAttempt() {
      const row = await statement(db, 'SELECT family_id,role,token_hash,revoked_at FROM devices WHERE id=?', id).first();
      if (!row) return false;
      // Possession of the persisted random credential permits retry after the code was consumed/expired.
      // It never revives a revoked device or converts a parent to a learner.
      if (row.family_id !== FAMILY || row.role !== 'learner' || row.token_hash !== tokenHash || row.revoked_at !== null) fail(401, 'unauthorized');
      return true;
    }
    if (retrySafe && await previousAttempt()) return json({deviceId: id, token});
    let results;
    try { results = await db.batch([
      statement(db, `INSERT INTO devices(id,family_id,name,role,token_hash,created_at,last_seen_at)
        SELECT ?,p.family_id,?,'learner',?,?,? FROM pairing_codes p JOIN devices d ON d.id=p.created_by_device_id
        WHERE p.code_hash=? AND p.used_at IS NULL AND p.expires_at>? AND d.revoked_at IS NULL AND d.role='parent'`, id, name, tokenHash, now, now, codeHash, now),
      statement(db, 'UPDATE pairing_codes SET used_at=? WHERE code_hash=? AND used_at IS NULL AND EXISTS(SELECT 1 FROM devices WHERE id=?)', now, codeHash, id)
    ]); } catch (error) {
      if (retrySafe && await previousAttempt()) return json({deviceId: id, token});
      throw error;
    }
    if (results[0].meta.changes !== 1) {
      if (retrySafe && await previousAttempt()) return json({deviceId: id, token});
      fail(410, 'pairing_code_invalid_or_expired');
    }
    return json({deviceId: id, token}, 201);
  }
  const device = await authenticated(request, db);
  const learningId = '00000000-0000-4000-8000-000000000037';
  async function ensureHistory() {
    await db.prepare(`CREATE TABLE IF NOT EXISTS profile_versions (
      profile_id TEXT NOT NULL REFERENCES profiles(id), revision INTEGER NOT NULL,
      snapshot_json TEXT NOT NULL, saved_at INTEGER NOT NULL, saved_by_device_id TEXT,
      PRIMARY KEY(profile_id,revision))`).run();
  }
  if (path === '/v1/learning' && method === 'POST') {
    parent(device);
    const input = await body(request), name = label(input.name), data = snapshot(input.snapshot);
    if(input.snapshot.data.kind !== 'learning-v1' || !input.snapshot.data.records || Array.isArray(input.snapshot.data.records)) fail(400,'invalid_learning_profile');
    await ensureHistory();
    const now = Date.now();
    await statement(db, `INSERT OR IGNORE INTO profiles(id,family_id,name,revision,snapshot_json,updated_at,updated_by_device_id)
      SELECT ?,?,?,1,?,?,? WHERE EXISTS(SELECT 1 FROM devices WHERE id=? AND revoked_at IS NULL AND role='parent')`, learningId, device.family_id, name, data, now, device.id, device.id).run();
    const row = await statement(db,'SELECT id,revision FROM profiles WHERE id=? AND family_id=?',learningId,device.family_id).first();
    if(!row) fail(401,'unauthorized');
    return json({profileId:row.id,revision:row.revision});
  }
  const versions = path.match(/^\/v1\/profiles\/([a-f0-9-]{36})\/history(?:\/(\d+))?$/);
  if(versions && method === 'GET') {
    parent(device);
    const own = await statement(db,'SELECT id FROM profiles WHERE id=? AND family_id=?',versions[1],device.family_id).first();
    if(!own) fail(404,'profile_not_found');
    await ensureHistory();
    if(versions[2]) {
      const row = await statement(db,'SELECT revision,snapshot_json,saved_at FROM profile_versions WHERE profile_id=? AND revision=?',versions[1],Number(versions[2])).first();
      if(!row) fail(404,'version_not_found');
      return json({revision:row.revision,savedAt:row.saved_at,snapshot:JSON.parse(row.snapshot_json)});
    }
    const rows = await statement(db,'SELECT revision,saved_at FROM profile_versions WHERE profile_id=? ORDER BY revision DESC LIMIT 50',versions[1]).all();
    return json({versions:rows.results});
  }
  if (path === '/v1/me' && method === 'GET') return json({device});
  if (path === '/v1/pairing' && method === 'POST') {
    parent(device); const now = Date.now(), code = random(16), expiresAt = now + 10 * 60 * 1000;
    await db.batch([
      statement(db, 'DELETE FROM pairing_codes WHERE family_id=? AND (used_at IS NOT NULL OR expires_at<=? OR created_by_device_id=?)', device.family_id, now, device.id),
      statement(db, 'INSERT INTO pairing_codes(code_hash,family_id,created_by_device_id,created_at,expires_at) VALUES(?,?,?,?,?)', await hash(code), device.family_id, device.id, now, expiresAt)
    ]);
    return json({code, expiresAt}, 201);
  }
  if (path === '/v1/devices' && method === 'GET') {
    parent(device);
    const rows = await statement(db, 'SELECT id,name,role,created_at,last_seen_at,revoked_at FROM devices WHERE family_id=? ORDER BY created_at', device.family_id).all();
    return json({devices: rows.results});
  }
  const revoke = path.match(/^\/v1\/devices\/([a-f0-9-]{36})\/revoke$/);
  if (revoke && method === 'POST') {
    parent(device); if (revoke[1] === device.id) fail(409, 'cannot_revoke_current_parent');
    const result = await statement(db, "UPDATE devices SET revoked_at=? WHERE id=? AND family_id=? AND role='learner' AND revoked_at IS NULL", Date.now(), revoke[1], device.family_id).run();
    if (!result.meta.changes) fail(404, 'device_not_found');
    return json({revoked: true});
  }
  if (path === '/v1/profiles' && method === 'GET') {
    const rows = await statement(db, 'SELECT id,name,revision,updated_at FROM profiles WHERE family_id=?', device.family_id).all();
    return json({profiles: rows.results});
  }
  const profile = path.match(/^\/v1\/profiles\/([a-f0-9-]{36})$/);
  if (profile && method === 'GET') {
    const row = await statement(db, 'SELECT id,name,revision,snapshot_json,updated_at FROM profiles WHERE id=? AND family_id=?', profile[1], device.family_id).first();
    if (!row) fail(404, 'profile_not_found');
    const {snapshot_json, ...metadata} = row; return json({...metadata, snapshot: JSON.parse(snapshot_json)});
  }
  if (profile && method === 'PUT') {
    const input = await body(request);
    if (!Number.isSafeInteger(input.baseRevision) || input.baseRevision < 1) fail(400, 'invalid_revision');
    const data = snapshot(input.snapshot), now = Date.now();
    await ensureHistory();
    // Saving the previous version and replacing it are one transaction. A failed backup prevents the write.
    const results = await db.batch([
      statement(db, `INSERT OR IGNORE INTO profile_versions(profile_id,revision,snapshot_json,saved_at,saved_by_device_id)
        SELECT id,revision,snapshot_json,?,? FROM profiles WHERE id=? AND family_id=? AND revision=?
        AND EXISTS(SELECT 1 FROM devices WHERE id=? AND revoked_at IS NULL)`, now, device.id, profile[1], device.family_id, input.baseRevision, device.id),
      statement(db, `UPDATE profiles SET snapshot_json=?,revision=revision+1,updated_at=?,updated_by_device_id=?
      WHERE id=? AND family_id=? AND revision=? AND EXISTS(SELECT 1 FROM devices WHERE id=? AND revoked_at IS NULL)`, data, now, device.id, profile[1], device.family_id, input.baseRevision, device.id)
    ]);
    const result = results[1];
    if (result.meta.changes !== 1) {
      const current = await statement(db, 'SELECT revision FROM profiles WHERE id=? AND family_id=?', profile[1], device.family_id).first();
      if (!current) fail(404, 'profile_not_found');
      return json({error: 'revision_conflict', revision: current.revision}, 409);
    }
    return json({revision: input.baseRevision + 1, updatedAt: now});
  }
  fail(404, 'not_found');
}
export default {
  async fetch(request, env) {
    let response;
    try { response = await route(request, env); }
    catch (error) { response = json({error: error instanceof HttpError ? error.message : 'service_unavailable'}, error instanceof HttpError ? error.status : 503); }
    const headers = new Headers(response.headers);
    headers.set('Cache-Control', 'no-store'); headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('Vary', 'Origin'); headers.set('Referrer-Policy', 'no-referrer');
    if (request.headers.get('Origin') === ORIGIN) {
      headers.set('Access-Control-Allow-Origin', ORIGIN);
      headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
      headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Family-Setup-Key');
    }
    return new Response(response.body, {status: response.status, headers});
  }
};

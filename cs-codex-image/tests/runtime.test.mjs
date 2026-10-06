import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { codexEnvironment, mergeMcpConfig, writeMcpConfig, validateImageSource } from '../scripts/runtime.mjs';

test('image child does not inherit an API key or mutate the caller environment', () => {
  const original = { OPENAI_API_KEY: 'test-only-not-a-key', CODEX_HOME: '/example/auth', PATH: '/example/bin' };
  const clean = codexEnvironment(original);
  assert.equal(clean.OPENAI_API_KEY, undefined);
  assert.equal(clean.CODEX_HOME, original.CODEX_HOME);
  assert.equal(original.OPENAI_API_KEY, 'test-only-not-a-key');
});

test('adding image MCP preserves unrelated settings and other servers', () => {
  const runtime = path.join(os.tmpdir(), 'cs-image-test-runtime');
  const config = { preferences: { theme: 'dark' }, mcpServers: { other: { command: 'existing' } } };
  const server = { command: process.execPath, args: [path.join(runtime, 'server.mjs')] };
  const merged = mergeMcpConfig(config, server, runtime);
  assert.deepEqual(merged.preferences, config.preferences);
  assert.deepEqual(merged.mcpServers.other, config.mcpServers.other);
  assert.equal(config.mcpServers['codex-image'], undefined);
  assert.deepEqual(mergeMcpConfig(merged, server, runtime), merged);
});

test('foreign server and malformed configs are preserved by rejection', () => {
  const config = { mcpServers: { 'codex-image': { command: 'other', args: ['elsewhere.mjs'] } } };
  const before = JSON.stringify(config);
  assert.throws(() => mergeMcpConfig(config, {}, '/example/runtime'), /different/);
  assert.equal(JSON.stringify(config), before);
  assert.throws(() => mergeMcpConfig({ mcpServers: [] }, {}, '/example/runtime'), /object/);
});

test('dry-run writes nothing; updating backs up exact original bytes; identical install is a no-op', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-codex-image-'));
  try {
    const file = path.join(root, 'config.json');
    const runtime = path.join(root, 'runtime');
    const server = { command: process.execPath, args: [path.join(runtime, 'server.mjs')] };
    assert.equal((await writeMcpConfig(file, server, runtime, true)).status, 'would-update');
    assert.equal(fs.existsSync(file), false);
    const original = '{"preferences":{"keep":true},"mcpServers":{"other":{"command":"keep"}}}\n';
    fs.writeFileSync(file, original);
    const updated = await writeMcpConfig(file, server, runtime);
    assert.equal(fs.readFileSync(updated.backup, 'utf8'), original);
    assert.equal(JSON.parse(fs.readFileSync(file, 'utf8')).mcpServers.other.command, 'keep');
    assert.equal((await writeMcpConfig(file, server, runtime)).status, 'unchanged');
    fs.writeFileSync(file, '{invalid json');
    await assert.rejects(writeMcpConfig(file, server, runtime));
    assert.equal(fs.readFileSync(file, 'utf8'), '{invalid json');
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

test('only a fresh file from the completed generation thread counts as output', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cs-image-source-'));
  try {
    fs.mkdirSync(path.join(root, 'current'));
    fs.mkdirSync(path.join(root, 'older'));
    const fresh = path.join(root, 'current', 'fresh.png');
    const old = path.join(root, 'older', 'old.png');
    fs.writeFileSync(fresh, 'fixture'); fs.writeFileSync(old, 'fixture');
    const events = JSON.stringify({ type: 'thread.started', thread_id: 'current' }) + '\n' + JSON.stringify({ type: 'turn.completed' });
    const since = new Date(Date.now() - 1000).toISOString();
    assert.equal(validateImageSource(fresh, root, events, since), fs.realpathSync(fresh));
    assert.throws(() => validateImageSource(old, root, events, since), /this generation thread/);
    fs.utimesSync(fresh, new Date(0), new Date(0));
    assert.throws(() => validateImageSource(fresh, root, events, since), /predates/);
    assert.throws(() => validateImageSource(fresh, root, '', since), /did not complete/);
  } finally { fs.rmSync(root, { recursive: true, force: true }); }
});

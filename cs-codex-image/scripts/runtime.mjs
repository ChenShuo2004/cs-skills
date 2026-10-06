import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

export function codexEnvironment(env = process.env) {
  const clean = { ...env };
  delete clean.OPENAI_API_KEY;
  return clean;
}

export function resolveCodex(env = process.env) {
  const candidates = env.CS_CODEX_BIN ? [env.CS_CODEX_BIN] : [
    '/Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex',
    '/Applications/Codex.app/Contents/Resources/codex',
    path.join(os.homedir(), 'Applications/ChatGPT.app/Contents/Resources/codex-cli/bin/codex'),
    ...(env.PATH || '').split(path.delimiter).filter(Boolean).map(dir => path.join(dir, process.platform === 'win32' ? 'codex.exe' : 'codex')),
  ];
  for (const file of candidates) {
    if (!fs.existsSync(file)) continue;
    try {
      execFileSync(file, ['--version'], { env: codexEnvironment(env), encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'pipe'] });
      return path.resolve(file);
    } catch {}
  }
  throw new Error('No working Codex executable found. Install a current official Codex client or set CS_CODEX_BIN.');
}

export function checkCodex(binary, env = process.env) {
  const options = { env: codexEnvironment(env), encoding: 'utf8', timeout: 15000, stdio: ['ignore', 'pipe', 'pipe'] };
  const version = execFileSync(binary, ['--version'], options).trim();
  const features = execFileSync(binary, ['features', 'list'], options);
  if (!/^image_generation\s/m.test(features)) throw new Error('This Codex version does not expose the image_generation feature. Update the official client.');
  try {
    execFileSync(binary, ['login', 'status'], options);
  } catch {
    throw new Error('Codex login is unavailable. Complete the official Codex login, then run this check again.');
  }
  const authPath = path.join(env.CODEX_HOME || path.join(os.homedir(), '.codex'), 'auth.json');
  // Never print tokens. Explicit API-key auth is outside this skill's scope.
  if (fs.existsSync(authPath)) {
    const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
    if (auth.auth_mode === 'apikey' || (auth.OPENAI_API_KEY && !auth.tokens)) {
      throw new Error('Codex is configured for API-key auth. Sign in with ChatGPT to use the built-in subscription route.');
    }
  }
  return { version, binary, image_generation: true, login_check: 'passed' };
}

export function generationArgs(dir, references = [], model) {
  const args = ['--no-daemon', 'exec', '--ignore-user-config', '--skip-git-repo-check', '--ephemeral',
    '-s', 'read-only', '-c', 'approval_policy="never"',
    '--disable', 'shell_tool', '--disable', 'apps', '--disable', 'plugins',
    '--disable', 'browser_use', '--disable', 'computer_use', '--disable', 'multi_agent',
    '--disable', 'memories', '--disable', 'chronicle', '--enable', 'image_generation',
    '-C', dir, '--json', '--output-schema', path.join(dir, 'response-schema.json'),
    '-o', path.join(dir, 'response.json')];
  if (model) args.push('-m', model);
  for (const file of references) args.push('-i', file);
  args.push('-');
  return args;
}

export function validateImageSource(source, generatedRoot, eventsText, startedAt) {
  const events = eventsText.split('\n').filter(Boolean).map(line => JSON.parse(line));
  const threadId = events.find(event => event.type === 'thread.started')?.thread_id;
  if (!threadId || !events.some(event => event.type === 'turn.completed')) throw new Error('Codex turn did not complete.');
  const threadRoot = path.join(fs.realpathSync(generatedRoot), threadId);
  const actual = fs.realpathSync(source);
  const relative = path.relative(threadRoot, actual);
  if (!relative || relative.startsWith('..' + path.sep) || relative === '..' || path.isAbsolute(relative)) {
    throw new Error('Image did not come from this generation thread.');
  }
  if (fs.statSync(actual).mtimeMs < Date.parse(startedAt)) throw new Error('Image predates this generation job.');
  return actual;
}

export function mergeMcpConfig(config, server, runtimeDir) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('MCP config must be a JSON object.');
  if (config.mcpServers !== undefined && (!config.mcpServers || typeof config.mcpServers !== 'object' || Array.isArray(config.mcpServers))) {
    throw new Error('mcpServers must be an object.');
  }
  const previous = config.mcpServers?.['codex-image'];
  if (previous && !previous.args?.includes(path.join(runtimeDir, 'server.mjs'))) {
    throw new Error('A different codex-image server already exists; it was preserved. Choose the existing server or resolve the name conflict.');
  }
  return { ...config, mcpServers: { ...config.mcpServers, 'codex-image': server } };
}

export async function writeMcpConfig(file, server, runtimeDir, dryRun = false) {
  const before = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : null;
  const config = before === null ? {} : JSON.parse(before);
  const next = mergeMcpConfig(config, server, runtimeDir);
  if (JSON.stringify(config) === JSON.stringify(next)) return { file, status: 'unchanged' };
  if (dryRun) return { file, status: 'would-update' };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const backup = before === null ? null : `${file}.backup-${Date.now()}-${process.pid}`;
  if (backup) fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
  const temporary = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temporary, JSON.stringify(next, null, 2) + '\n', { mode: 0o600 });
  fs.renameSync(temporary, file);
  return { file, status: 'updated', backup };
}

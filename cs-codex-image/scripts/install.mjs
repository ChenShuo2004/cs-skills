#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { resolveCodex, checkCodex, mergeMcpConfig, writeMcpConfig } from './runtime.mjs';

const source = path.dirname(fileURLToPath(import.meta.url));
let target = 'both', dryRun = false, check = false;
const runtimeDir = path.join(os.homedir(), '.local/share/cs-codex-image-mcp');
let model = process.env.CS_CODEX_MODEL;
try {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target') target = args[++i];
    else if (args[i] === '--dry-run') dryRun = true;
    else if (args[i] === '--check') check = true;
    else if (args[i] === '--model') {
      model = args[++i];
      if (!model || model.startsWith('--')) throw new Error('--model requires a model identifier.');
    } else if (args[i] === '--help') {
      console.log('node scripts/install.mjs [--target both|claude-code|claude-desktop] [--dry-run | --check] [--model MODEL]\nInstalls only this image MCP. Requires Node 22+, npm, a current Codex and ChatGPT login. No API key, no model downloads, no test image generation.');
      process.exit(0);
    } else throw new Error('Unknown argument: ' + args[i]);
  }
  if (!['both', 'claude-code', 'claude-desktop'].includes(target)) throw new Error('Invalid --target.');
  if (dryRun && check) throw new Error('--dry-run and --check cannot be combined.');
  if (Number(process.versions.node.split('.')[0]) < 22) throw new Error('Node.js 22+ required.');
  if (target !== 'claude-code' && process.platform !== 'darwin') {
    throw new Error('Desktop configuration is currently supported on macOS. Use --target claude-code on other systems.');
  }
  const binary = resolveCodex();
  const health = checkCodex(binary);
  const env = { CS_CODEX_BIN: binary };
  if (model) env.CS_CODEX_MODEL = model;
  if (process.env.CODEX_HOME) env.CODEX_HOME = process.env.CODEX_HOME;
  if (process.env.CS_IMAGE_DATA_DIR) env.CS_IMAGE_DATA_DIR = process.env.CS_IMAGE_DATA_DIR;
  const server = { command: process.execPath, args: [path.join(runtimeDir, 'server.mjs')], env };
  const files = [];
  if (target !== 'claude-desktop') files.push(path.join(os.homedir(), '.claude.json'));
  if (target !== 'claude-code') files.push(path.join(os.homedir(), 'Library/Application Support/Claude/claude_desktop_config.json'));

  // Validate every destination before changing runtime files or configs.
  for (const file of files) {
    const config = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
    mergeMcpConfig(config, server, runtimeDir);
  }
  if (check) {
    for (const file of files) {
      if (!fs.existsSync(file)) throw new Error('Missing MCP config: ' + file);
      const actual = JSON.parse(fs.readFileSync(file, 'utf8')).mcpServers?.['codex-image'];
      if (!actual?.args?.includes(path.join(runtimeDir, 'server.mjs'))) throw new Error('codex-image is not configured in ' + file);
    }
    const { Client } = await import(pathToFileURL(path.join(runtimeDir, 'node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js')));
    const { StdioClientTransport } = await import(pathToFileURL(path.join(runtimeDir, 'node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js')));
    const configured = JSON.parse(fs.readFileSync(files[0], 'utf8')).mcpServers['codex-image'];
    const client = new Client({ name: 'cs-codex-image-check', version: '1.0.0' });
    try {
      await client.connect(new StdioClientTransport({ command: configured.command, args: configured.args, env: { ...process.env, ...configured.env } }));
      const listed = await client.listTools();
      for (const name of ['generate_image', 'get_image_job', 'read_generated_image']) {
        if (!listed.tools.some(tool => tool.name === name)) throw new Error('Missing tool: ' + name);
      }
      console.log(JSON.stringify({ ...health, mcp: 'connected', tools: listed.tools.map(tool => tool.name), image_generated: false }, null, 2));
    } finally { await client.close(); }
    process.exit(0);
  }
  if (!dryRun) {
    fs.mkdirSync(runtimeDir, { recursive: true });
    for (const name of ['server.mjs', 'runtime.mjs', 'package.json', 'package-lock.json']) {
      const destination = path.join(runtimeDir, name);
      const contents = fs.readFileSync(path.join(source, name));
      if (fs.existsSync(destination) && fs.readFileSync(destination).equals(contents)) continue;
      if (fs.existsSync(destination)) fs.copyFileSync(destination, `${destination}.backup-${Date.now()}`, fs.constants.COPYFILE_EXCL);
      fs.writeFileSync(destination, contents);
    }
    if (process.platform === 'win32') {
      execFileSync(process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', 'npm.cmd ci --ignore-scripts --no-audit --no-fund'], { cwd: runtimeDir, stdio: 'inherit' });
    } else {
      execFileSync('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: runtimeDir, stdio: 'inherit' });
    }
  }
  const changes = [];
  for (const file of files) changes.push(await writeMcpConfig(file, server, runtimeDir, dryRun));
  console.log(JSON.stringify({ ...health, runtime: runtimeDir, changes, dry_run: dryRun, image_generated: false }, null, 2));
  console.log('Open a new Claude Code session. Restart Claude Desktop after its current tasks finish. Then run --check; a real image smoke test is separate.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

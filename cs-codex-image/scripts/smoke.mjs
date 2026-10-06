#!/usr/bin/env node
// Explicit smoke test: consumes one built-in image generation.
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
let prompt, reference;
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--prompt') prompt = args[++i];
  else if (args[i] === '--reference') reference = args[++i];
  else if (args[i] === '--help') {
    console.log('node scripts/smoke.mjs --prompt "Image description" [--reference /absolute/image.png]\nActually generates ONE image using Codex plan limits.');
    process.exit(0);
  } else throw new Error('Unknown argument: ' + args[i]);
}
if (!prompt) throw new Error('An explicit --prompt is required. This test consumes one generation.');
const runtime = path.join(os.homedir(), '.local/share/cs-codex-image-mcp');
const { Client } = await import(pathToFileURL(path.join(runtime, 'node_modules/@modelcontextprotocol/sdk/dist/esm/client/index.js')));
const { StdioClientTransport } = await import(pathToFileURL(path.join(runtime, 'node_modules/@modelcontextprotocol/sdk/dist/esm/client/stdio.js')));
const config = JSON.parse(await fs.readFile(path.join(os.homedir(), '.claude.json'), 'utf8'));
const server = config.mcpServers?.['codex-image'];
if (!server?.args?.includes(path.join(runtime, 'server.mjs'))) throw new Error('Install the Claude Code MCP first.');
const client = new Client({ name: 'cs-codex-image-smoke', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: server.command, args: server.args, env: { ...process.env, ...server.env } }));
try {
  const started = await client.callTool({ name: 'generate_image', arguments: { prompt, reference_images: reference ? [reference] : [] } });
  if (started.isError) throw new Error(started.content[0].text);
  const id = JSON.parse(started.content[0].text).job_id;
  console.log('job_id=' + id);
  for (let i = 0; i < 26; i++) {
    const status = await client.callTool({ name: 'get_image_job', arguments: { job_id: id, wait_seconds: 20 } });
    if (status.isError) throw new Error(status.content[0].text);
    const job = JSON.parse(status.content[0].text);
    console.log('status=' + job.status);
    if (job.status === 'failed') throw new Error(job.error);
    if (job.status === 'completed') {
      const preview = await client.callTool({ name: 'read_generated_image', arguments: { job_id: id } });
      if (preview.isError || !preview.content.some(block => block.type === 'image')) throw new Error('Missing image preview.');
      console.log(JSON.stringify({ job_id: id, backend: job.backend, images: job.images, preview_returned: true }, null, 2));
      break;
    }
    if (i === 25) throw new Error('Still incomplete; inspect the original job, do not resubmit.');
  }
} finally { await client.close(); }

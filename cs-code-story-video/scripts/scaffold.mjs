import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const name = args[0]?.trim();
const outputIndex = args.indexOf('--output');
if (!name || (outputIndex >= 0 && !args[outputIndex + 1])) {
  console.error('Usage: node scripts/scaffold.mjs <project-name> [--output <new-directory>]');
  process.exit(1);
}
const slug = name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '-').replace(/\s+/g, '-').replace(/^[. -]+|[. -]+$/g, '');
if (!slug || slug === '.' || slug === '..') throw new Error('Project name is not a safe directory name.');
const target = path.resolve(outputIndex >= 0 ? args[outputIndex + 1] : path.join(process.cwd(), 'video', slug));
if (fs.existsSync(target) && fs.readdirSync(target).length > 0) throw new Error(`Target already contains files: ${target}. Continue the existing project instead of scaffolding over it.`);

fs.mkdirSync(target, {recursive: true});
fs.cpSync(path.join(skillRoot, 'assets', 'starter'), target, {recursive: true, force: false});
fs.mkdirSync(path.join(target, 'scripts'), {recursive: true});
fs.mkdirSync(path.join(target, 'out'), {recursive: true});
fs.mkdirSync(path.join(target, 'derived'), {recursive: true});
for (const script of ['validate-story.mjs', 'phrases-to-srt.mjs']) {
  fs.copyFileSync(path.join(skillRoot, 'scripts', script), path.join(target, 'scripts', script));
}
const configPath = path.join(target, 'story.json');
const story = JSON.parse(fs.readFileSync(configPath, 'utf8'));
story.title = name;
const characterBytes = fs.readFileSync(path.join(target, 'public', story.character.file));
story.character.sha256 = crypto.createHash('sha256').update(characterBytes).digest('hex');
fs.writeFileSync(configPath, JSON.stringify(story, null, 2) + '\n', 'utf8');
console.log(JSON.stringify({status: 'draft', project: target, next: 'Write the spoken script and original scenes; add final audio before creating frame-accurate shots.'}, null, 2));

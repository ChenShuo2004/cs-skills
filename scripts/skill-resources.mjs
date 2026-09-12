import fs from "node:fs";
import path from "node:path";

// Markdown links form the portable, recursively reachable reference graph.
// Bare code paths can also name runtime outputs and are deliberately not crawled.
export function validateLinkedResources(skillRoot) {
  const root = fs.realpathSync(skillRoot);
  const errors = [];
  const visited = new Set();
  const inside = (file) => {
    const relative = path.relative(root, file);
    return relative === "" || (!relative.startsWith(`..${path.sep}`) && relative !== ".." && !path.isAbsolute(relative));
  };
  function visit(file) {
    if (visited.has(file)) return;
    visited.add(file);
    const content = fs.readFileSync(file, "utf8").replace(/```[^\n]*\n[\s\S]*?```/g, "").replace(/~~~[^\n]*\n[\s\S]*?~~~/g, "");
    for (const match of content.matchAll(/\[[^\]\n]*\]\(([^)\n]+)\)/g)) {
      const target = match[1].trim().replace(/^<|>$/g, "");
      if (/^(?:[a-z][a-z0-9+.-]*:|#)/i.test(target)) continue;
      const location = target.split(/[?#]/)[0];
      let decoded;
      try { decoded = decodeURIComponent(location); }
      catch { errors.push(`${path.relative(root, file)}: invalid link encoding: ${target}`); continue; }
      const candidates = [path.resolve(path.dirname(file), decoded), path.resolve(root, decoded)];
      const found = candidates.find(candidate => inside(candidate) && fs.existsSync(candidate));
      if (!found) { errors.push(`${path.relative(root, file)}: missing or nonportable resource: ${target}`); continue; }
      const real = fs.realpathSync(found);
      if (!inside(real)) { errors.push(`${path.relative(root, file)}: resource escapes skill: ${target}`); continue; }
      if (fs.statSync(real).isFile() && path.extname(real).toLowerCase() === ".md") visit(real);
    }
  }
  visit(path.join(root, "SKILL.md"));
  return { errors, files: [...visited] };
}

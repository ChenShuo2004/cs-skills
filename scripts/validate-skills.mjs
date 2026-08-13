import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fixtureRoot = path.join(root, "tests", "fixtures");
const errors = [];

function readText(relativePath) {
  const absolutePath = path.join(root, relativePath);
  if (!fs.existsSync(absolutePath)) {
    errors.push(`Missing required file: ${relativePath}`);
    return "";
  }
  return fs.readFileSync(absolutePath, "utf8");
}

function readJson(fileName) {
  const relativePath = path.join("tests", "fixtures", fileName);
  const text = readText(relativePath);
  try {
    return JSON.parse(text);
  } catch (error) {
    errors.push(`Invalid JSON in ${relativePath}: ${error.message}`);
    return null;
  }
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  return trimmed;
}

function parseFrontmatter(skillPath, text) {
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    errors.push(`${skillPath}: missing valid YAML frontmatter`);
    return null;
  }

  const lines = match[1].split(/\r?\n/);
  const data = {};
  const keys = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    if (/^\s/.test(line) || line.trim() === "") {
      continue;
    }
    const field = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s*(.*))?$/);
    if (!field) {
      errors.push(`${skillPath}: unsupported frontmatter line: ${line}`);
      continue;
    }

    const [, key, rawValue = ""] = field;
    keys.push(key);
    if (["|", ">", "|-", ">-"].includes(rawValue.trim())) {
      const block = [];
      const fold = rawValue.trim().startsWith(">");
      while (index + 1 < lines.length && /^\s+/.test(lines[index + 1])) {
        index += 1;
        block.push(lines[index].replace(/^\s+/, ""));
      }
      data[key] = (fold ? block.join(" ") : block.join("\n")).trim();
    } else {
      data[key] = parseScalar(rawValue);
    }
  }

  return { data, keys };
}

function parseAgentField(text, fieldName) {
  const match = text.match(new RegExp(`^\\s*${fieldName}:\\s*[\"']?([^\"'\\r\\n]+)`, "m"));
  return match?.[1]?.trim() ?? "";
}

function assertContains(relativePath, text, expected, context = "") {
  if (!text.includes(expected)) {
    errors.push(`${relativePath}: missing required text ${JSON.stringify(expected)}${context ? ` (${context})` : ""}`);
  }
}

function validateResourceReferences(skillName, skillText) {
  const referencePattern = /(?:`|\]\()((?:references|assets|scripts)\/[^`\s)]+)/g;
  for (const match of skillText.matchAll(referencePattern)) {
    const rawPath = match[1].replace(/[.,;:]+$/, "");
    if (rawPath.includes("<") || rawPath.includes(">") || rawPath.includes("..")) {
      continue;
    }
    const relativePath = path.join(skillName, rawPath);
    if (!fs.existsSync(path.join(root, relativePath))) {
      errors.push(`${skillName}/SKILL.md: referenced resource does not exist: ${rawPath}`);
    }
  }
}

function validateUnsafeText(relativePath, text) {
  const machinePathPatterns = [
    /(?:^|[^A-Za-z0-9_])[A-Za-z]:\\(?:Users|home|root|tmp)\\/i,
    /\/(?:Users|home|root)\/[A-Za-z0-9_.-]+/,
  ];
  const secretPattern = /(?:api[_-]?key|access[_-]?token|secret|password)\s*[:=]\s*["']?[A-Za-z0-9_/-]{16,}/i;

  for (const pattern of machinePathPatterns) {
    if (pattern.test(text)) {
      errors.push(`${relativePath}: contains a machine-specific absolute path`);
      break;
    }
  }
  if (secretPattern.test(text)) {
    errors.push(`${relativePath}: appears to contain a real credential`);
  }
}

function validateCoreContracts(coreContracts, registryNames) {
  const expectedChains = new Set(["routing", "engineering-delivery", "chatcut-blueprint", "xiaohuang"]);
  const actualChains = new Set(coreContracts.contracts.map((contract) => contract.name));

  for (const chain of expectedChains) {
    if (!actualChains.has(chain)) {
      errors.push(`core-contracts.json: missing ${chain} contract`);
    }
  }

  for (const contract of coreContracts.contracts) {
    if (!expectedChains.has(contract.name)) {
      errors.push(`core-contracts.json: unexpected contract ${contract.name}`);
    }
    for (const check of contract.checks ?? []) {
      const text = readText(check.path);
      for (const expected of check.contains ?? []) {
        assertContains(check.path, text, expected, contract.name);
      }
      for (const forbidden of check.absent ?? []) {
        if (text.includes(forbidden)) {
          errors.push(`${check.path}: contains forbidden text ${JSON.stringify(forbidden)} (${contract.name})`);
        }
      }
      const skillName = check.path.split("/")[0];
      if (skillName.startsWith("cs-") && !registryNames.has(skillName)) {
        errors.push(`${check.path}: contract references a non-active skill`);
      }
    }
  }
}

function validateRouteCases(routeCases, registryNames) {
  const allowedModes = new Set(["direct", "entrypoint", "unsupported", "sequence"]);
  const seenIds = new Set();

  for (const routeCase of routeCases.cases) {
    if (!routeCase.id || seenIds.has(routeCase.id)) {
      errors.push(`routing-cases.json: case id must be unique: ${routeCase.id ?? "<missing>"}`);
    }
    seenIds.add(routeCase.id);
    if (!routeCase.prompt || !allowedModes.has(routeCase.mode)) {
      errors.push(`routing-cases.json: ${routeCase.id} needs a prompt and valid mode`);
    }
    for (const skillName of routeCase.expectedSkills ?? []) {
      if (!registryNames.has(skillName)) {
        errors.push(`routing-cases.json: ${routeCase.id} references non-active skill ${skillName}`);
      }
    }
    if (routeCase.mode === "unsupported" && (routeCase.expectedSkills ?? []).length > 0) {
      errors.push(`routing-cases.json: unsupported case ${routeCase.id} must not route to an active skill`);
    }
    if (routeCase.mode === "sequence" && (routeCase.expectedSkills ?? []).length < 2) {
      errors.push(`routing-cases.json: sequence case ${routeCase.id} requires at least two ordered skills`);
    }
    for (const evidence of routeCase.evidence ?? []) {
      const text = readText(evidence.path);
      assertContains(evidence.path, text, evidence.contains, routeCase.id);
    }
  }
}

const registry = readJson("skill-registry.json");
const coreContracts = readJson("core-contracts.json");
const routeCases = readJson("routing-cases.json");

if (registry && coreContracts && routeCases) {
  const allowedReleaseLevels = new Set(["contract", "core", "script-regression"]);
  const registryNames = new Set();
  const registryByName = new Map();

  for (const skill of registry.skills ?? []) {
    if (!skill.name || registryNames.has(skill.name)) {
      errors.push(`skill-registry.json: skill names must be unique: ${skill.name ?? "<missing>"}`);
      continue;
    }
    if (!skill.displayName || !allowedReleaseLevels.has(skill.releaseLevel)) {
      errors.push(`skill-registry.json: ${skill.name} needs displayName and a valid releaseLevel`);
    }
    registryNames.add(skill.name);
    registryByName.set(skill.name, skill);
  }

  const activeDirectories = fs
    .readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name.startsWith("cs-") && fs.existsSync(path.join(root, entry.name, "SKILL.md")))
    .map((entry) => entry.name)
    .sort();

  if (activeDirectories.length !== 11) {
    errors.push(`Expected 11 active skills, found ${activeDirectories.length}: ${activeDirectories.join(", ")}`);
  }
  if (activeDirectories.join("|") !== [...registryNames].sort().join("|")) {
    errors.push("skill-registry.json must exactly match active skill directories");
  }

  for (const skillName of activeDirectories) {
    const skillPath = `${skillName}/SKILL.md`;
    const skillText = readText(skillPath);
    const frontmatter = parseFrontmatter(skillPath, skillText);
    const registryItem = registryByName.get(skillName);
    if (!frontmatter || !registryItem) {
      continue;
    }

    const frontmatterKeys = [...frontmatter.keys].sort();
    if (frontmatterKeys.join("|") !== "description|name") {
      errors.push(`${skillPath}: frontmatter must contain only name and description`);
    }
    if (frontmatter.data.name !== skillName) {
      errors.push(`${skillPath}: name must match directory name`);
    }
    if (!/^[a-z0-9-]{1,64}$/.test(frontmatter.data.name ?? "")) {
      errors.push(`${skillPath}: name must be lowercase hyphen-case and no more than 64 characters`);
    }
    const description = frontmatter.data.description ?? "";
    if (!description || description.length > 1024 || /[<>]/.test(description)) {
      errors.push(`${skillPath}: description must be 1-1024 characters and contain no angle brackets`);
    }

    const agentPath = `${skillName}/agents/openai.yaml`;
    const agentText = readText(agentPath);
    const displayName = parseAgentField(agentText, "display_name");
    const shortDescription = parseAgentField(agentText, "short_description");
    const defaultPrompt = parseAgentField(agentText, "default_prompt");
    if (displayName !== registryItem.displayName) {
      errors.push(`${agentPath}: display_name must match skill-registry.json`);
    }
    if (!shortDescription) {
      errors.push(`${agentPath}: short_description is required`);
    }
    if (!defaultPrompt.includes(`$${skillName}`)) {
      errors.push(`${agentPath}: default_prompt must include $${skillName}`);
    }

    validateResourceReferences(skillName, skillText);
    validateUnsafeText(skillPath, skillText);
    validateUnsafeText(agentPath, agentText);
  }

  const readme = readText("README.md");
  const inventory = readText("docs/skill-inventory.md");
  const repositoryPlan = readText("docs/repository-plan.md");
  for (const skillName of registryNames) {
    for (const [documentPath, documentText] of [["README.md", readme], ["docs/skill-inventory.md", inventory], ["docs/repository-plan.md", repositoryPlan]]) {
      assertContains(documentPath, documentText, skillName, "active skill inventory");
    }
  }

  const runSkill = readText("cs-run/SKILL.md");
  const routesSection = runSkill.match(/## Active Routes([\s\S]*?)## Retired Routes/);
  if (!routesSection) {
    errors.push("cs-run/SKILL.md: missing Active Routes section");
  } else {
    const routedSkills = [...routesSection[1].matchAll(/\$([a-z0-9-]+)/g)].map((match) => match[1]);
    if (routedSkills.sort().join("|") !== [...registryNames].sort().join("|")) {
      errors.push("cs-run/SKILL.md: Active Routes must list every active skill exactly once");
    }
  }

  const retiredAliases = ["$auto-cutting-ralph", "$auto-cutting-prd", "$auto-render-video", "li-auto-auto-cutting"];
  for (const skillName of activeDirectories) {
    const skillPath = `${skillName}/SKILL.md`;
    const skillText = readText(skillPath);
    for (const alias of retiredAliases) {
      if (skillText.includes(alias)) {
        errors.push(`${skillPath}: contains retired route alias ${alias}`);
      }
    }
  }

  validateCoreContracts(coreContracts, registryNames);
  validateRouteCases(routeCases, registryNames);
}

if (errors.length > 0) {
  console.error("Skill quality validation failed:\n");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Skill quality validation passed.");

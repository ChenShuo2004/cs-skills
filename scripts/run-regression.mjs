import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function run(command, args, extraEnv = {}) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...process.env, ...extraEnv },
    stdio: "inherit",
    windowsHide: true,
  });

  if (result.error) {
    throw new Error(`Could not run ${command}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`${command} exited with code ${result.status ?? "unknown"}`);
  }
}

function canRun(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "ignore", windowsHide: true });
  return !result.error && result.status === 0;
}

function resolvePython() {
  const configured = process.env.CS_SKILLS_PYTHON;
  if (configured) {
    if (path.isAbsolute(configured) && !fs.existsSync(configured)) {
      throw new Error(`CS_SKILLS_PYTHON does not exist: ${configured}`);
    }
    if (!canRun(configured, ["--version"])) {
      throw new Error(`CS_SKILLS_PYTHON is not an executable Python runtime: ${configured}`);
    }
    return { command: configured, prefix: [] };
  }

  for (const candidate of [
    { command: "python", prefix: [] },
    { command: "python3", prefix: [] },
    { command: "py", prefix: ["-3"] },
  ]) {
    if (canRun(candidate.command, [...candidate.prefix, "--version"])) {
      return candidate;
    }
  }

  throw new Error(
    "Python 3.12+ is required for cs-auto-videl regression tests. Install Python or set CS_SKILLS_PYTHON to its executable path, for example: $env:CS_SKILLS_PYTHON = 'C:\\Python312\\python.exe'",
  );
}

function resolvePowerShell() {
  for (const candidate of ["powershell", "pwsh"]) {
    if (canRun(candidate, ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"])) {
      return candidate;
    }
  }
  throw new Error("PowerShell is required for cs-checkpoint-version regression tests.");
}

try {
  run(process.execPath, ["scripts/validate-skills.mjs"]);

  const python = resolvePython();
  run(
    python.command,
    [...python.prefix, "-m", "unittest", "discover", "-s", "cs-auto-videl/tests", "-p", "test_*.py", "-v"],
    path.isAbsolute(python.command) ? { CS_SKILLS_PYTHON: python.command } : {},
  );

  const powerShell = resolvePowerShell();
  run(powerShell, ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", "cs-checkpoint-version/tests/cs-checkpoint-version.tests.ps1"]);

  console.log("\nAll regression checks passed.");
} catch (error) {
  console.error(`\nRegression failed: ${error.message}`);
  process.exit(1);
}

import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const skillRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const validator = path.join(skillRoot, "scripts", "validate-product-pack.mjs");
const fixtureRoot = path.join(skillRoot, "tests", "fixtures");

function runFixture(name, expectedStatus) {
  const result = spawnSync(process.execPath, [validator, path.join(fixtureRoot, name)], {
    cwd: skillRoot,
    encoding: "utf8",
    windowsHide: true,
  });

  if (result.status !== expectedStatus) {
    throw new Error(
      name + " expected exit " + expectedStatus + ", received " + (result.status ?? "unknown") + "\n" + result.stdout + result.stderr,
    );
  }
}

runFixture("valid-product-pack.json", 0);
runFixture("invalid-product-pack.json", 1);
console.log("Product pack validator regression passed.");

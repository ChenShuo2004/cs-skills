import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { validateLinkedResources } from "../scripts/skill-resources.mjs";

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "cs-resource-test-"));
  t.after(() => {
    const resolved = fs.realpathSync(root);
    assert.equal(path.dirname(resolved), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(resolved).startsWith("cs-resource-test-"));
    fs.rmSync(resolved, { recursive: true, force: true });
  });
  for (const [name, value] of Object.entries(files)) {
    const file = path.join(root, name);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, value);
  }
  return root;
}

test("follows nested relative references, encoded spaces and cycles", t => {
  const root = fixture(t, {
    "SKILL.md": "[guide](references/guide.md) [external](https://example.com)",
    "references/guide.md": "[detail](detail%20one.md) [root](../SKILL.md)",
    "references/detail one.md": "Complete.",
  });
  const result = validateLinkedResources(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.files.length, 3);
});

test("detects a missing second-level resource", t => {
  const root = fixture(t, { "SKILL.md": "[guide](references/guide.md)", "references/guide.md": "[schema](missing.json)" });
  assert.equal(validateLinkedResources(root).errors.length, 1);
});

test("rejects links escaping the independently installed skill", t => {
  const root = fixture(t, { "SKILL.md": "[shared](../other-skill/SKILL.md)" });
  assert.equal(validateLinkedResources(root).errors.length, 1);
});

test("ignores example links in fenced code and local heading anchors", t => {
  const root = fixture(t, { "SKILL.md": "[local](#section)\n```md\n[example](missing.md)\n```\n~~~md\n[example](also-missing.md)\n~~~" });
  assert.deepEqual(validateLinkedResources(root).errors, []);
});

test("reports malformed URI encoding instead of crashing", t => {
  const root = fixture(t, { "SKILL.md": "[bad](references/%ZZ.md)" });
  assert.equal(validateLinkedResources(root).errors.length, 1);
});

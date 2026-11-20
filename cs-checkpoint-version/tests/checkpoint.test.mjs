import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { listCheckpoints, restoreCheckpoint, saveCheckpoint } from "../scripts/checkpoint.mjs";

function git(repo, args) {
  const res = spawnSync("git", ["-C", repo, ...args], { encoding: "utf8", windowsHide: true });
  assert.equal(res.status, 0, `git ${args.join(" ")} failed: ${res.stderr}`);
  return res.stdout;
}

test("save, list, restore, pre-restore protection, and cleanUntracked work cross-platform", () => {
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "cs-checkpoint-node-test-"));
  const repo = path.join(tempRoot, "repo");
  const checkpointRoot = path.join(tempRoot, "checkpoints");

  try {
    fs.mkdirSync(repo, { recursive: true });
    fs.mkdirSync(checkpointRoot, { recursive: true });

    git(repo, ["init"]);
    git(repo, ["config", "user.email", "test@example.invalid"]);
    git(repo, ["config", "user.name", "Checkpoint Test"]);

    fs.writeFileSync(path.join(repo, "tracked.txt"), "base tracked\n", "utf8");
    fs.writeFileSync(path.join(repo, "staged.txt"), "base staged\n", "utf8");
    git(repo, ["add", "tracked.txt", "staged.txt"]);
    git(repo, ["commit", "-m", "base"]);

    fs.writeFileSync(path.join(repo, "tracked.txt"), "dirty tracked\n", "utf8");
    fs.writeFileSync(path.join(repo, "staged.txt"), "checkpoint staged\n", "utf8");
    git(repo, ["add", "staged.txt"]);
    fs.mkdirSync(path.join(repo, "notes"), { recursive: true });
    fs.writeFileSync(path.join(repo, "notes", "untracked.txt"), "checkpoint untracked\n", "utf8");

    const { checkpointPath, metadata } = saveCheckpoint({
      repo,
      slug: "unit-test",
      outputRoot: checkpointRoot,
    });

    assert.equal(metadata.schema_version, 1);
    assert.equal(metadata.untracked_files, 1);
    assert.equal(metadata.untracked_archive, "untracked.zip");
    assert.ok(fs.existsSync(path.join(checkpointPath, "metadata.json")));
    assert.ok(fs.existsSync(path.join(checkpointPath, "staged.patch")));
    assert.ok(fs.existsSync(path.join(checkpointPath, "unstaged.patch")));
    assert.ok(fs.existsSync(path.join(checkpointPath, "untracked.zip")));
    assert.match(fs.readFileSync(path.join(checkpointPath, "status-porcelain.txt"), "utf8"), /M  staged\.txt/);
    assert.match(fs.readFileSync(path.join(checkpointPath, "status-porcelain.txt"), "utf8"), / M tracked\.txt/);
    assert.match(fs.readFileSync(path.join(checkpointPath, "untracked-files.txt"), "utf8"), /notes\/untracked\.txt/);

    const listed = listCheckpoints({ repo, outputRoot: checkpointRoot });
    assert.equal(listed.length, 1);
    assert.equal(listed[0].metadata.slug, "unit-test");

    // Mutate worktree after checkpoint
    fs.writeFileSync(path.join(repo, "tracked.txt"), "after checkpoint\n", "utf8");
    fs.writeFileSync(path.join(repo, "staged.txt"), "after staged\n", "utf8");
    fs.rmSync(path.join(repo, "notes", "untracked.txt"));
    fs.writeFileSync(path.join(repo, "later.txt"), "remove me on clean restore\n", "utf8");

    // Restore without force must fail
    assert.throws(() => restoreCheckpoint({ repo, checkpoint: checkpointPath }), /--force/);

    const restored = restoreCheckpoint({
      repo,
      checkpoint: checkpointPath,
      force: true,
      cleanUntracked: true,
    });

    assert.ok(restored.preRestorePath && fs.existsSync(restored.preRestorePath), "pre-restore snapshot should be created");
    assert.equal(fs.readFileSync(path.join(repo, "tracked.txt"), "utf8"), "dirty tracked\n");
    assert.equal(fs.readFileSync(path.join(repo, "staged.txt"), "utf8"), "checkpoint staged\n");
    assert.equal(fs.readFileSync(path.join(repo, "notes", "untracked.txt"), "utf8"), "checkpoint untracked\n");
    assert.equal(fs.existsSync(path.join(repo, "later.txt")), false);

    assert.match(git(repo, ["diff", "--cached", "--", "staged.txt"]), /checkpoint staged/);
    assert.match(git(repo, ["diff", "--", "tracked.txt"]), /dirty tracked/);
    // Ensure .codex-checkpoints was preserved despite cleanUntracked
    assert.ok(fs.existsSync(path.join(repo, ".codex-checkpoints")));
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
});

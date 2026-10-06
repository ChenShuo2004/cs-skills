"""用小文件与模拟下载验证缓存行为，不访问网络或下载真实权重。"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("cs_models", ROOT / "scripts" / "models.py")
models = importlib.util.module_from_spec(spec)
spec.loader.exec_module(models)


class ModelCacheTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.cache = Path(self.temp.name) / "cache"
        self.content = {"config.json": b'{"model_type":"test"}', "model.bin": b"valid test weights"}
        files = {}
        for name, content in self.content.items():
            kind = "git-sha1" if name.endswith(".json") else "sha256"
            hashed = (f"blob {len(content)}\0".encode() + content) if kind == "git-sha1" else content
            digest = hashlib.sha1(hashed) if kind == "git-sha1" else hashlib.sha256(hashed)
            files[name] = {"size": len(content), "hash_type": kind, "hash": digest.hexdigest()}
        self.model = {"repo_id": "test/model", "revision": "a" * 40, "files": files}
        self.folder = models.snapshot_dir(self.model, self.cache)
        self.calls = []

    def write(self, name, content=None):
        self.folder.mkdir(parents=True, exist_ok=True)
        (self.folder / name).write_bytes(self.content[name] if content is None else content)

    def download(self, **kwargs):
        self.calls.append(kwargs)
        self.assertEqual(kwargs["revision"], "a" * 40)
        self.write(kwargs["filename"])
        return str(self.folder / kwargs["filename"])

    def test_check_missing_cache_is_read_only(self):
        report = models.inspect_model("test", self.model, self.cache)
        self.assertEqual(report["status"], "missing-or-invalid")
        self.assertFalse(self.cache.exists())

    def test_complete_cache_skips_every_download(self):
        for name in self.content:
            self.write(name)
        report = models.download_model("test", self.model, self.cache, downloader=self.download)
        self.assertEqual(report["action"], "reused")
        self.assertEqual(self.calls, [])

    def test_partial_cache_downloads_only_missing_then_reuses(self):
        self.write("config.json")
        report = models.download_model("test", self.model, self.cache, downloader=self.download)
        self.assertEqual(report["downloaded_files"], ["model.bin"])
        self.assertFalse(self.calls[0]["force_download"])
        self.calls.clear()
        self.assertEqual(models.download_model("test", self.model, self.cache, downloader=self.download)["action"], "reused")
        self.assertEqual(self.calls, [])

    def test_same_size_corruption_detected_and_requires_repair(self):
        self.write("config.json")
        self.write("model.bin", b"x" * len(self.content["model.bin"]))
        self.assertEqual(models.inspect_model("test", self.model, self.cache)["problems"]["model.bin"], "hash-mismatch")
        with self.assertRaisesRegex(RuntimeError, "--repair"):
            models.download_model("test", self.model, self.cache, downloader=self.download)
        self.assertEqual(self.calls, [])
        report = models.download_model("test", self.model, self.cache, repair=True, downloader=self.download)
        self.assertEqual(report["status"], "ready")
        self.assertEqual(report["downloaded_files"], ["model.bin"])
        self.assertTrue(self.calls[0]["force_download"])

    def test_empty_truncated_and_lfs_pointer_are_invalid(self):
        for content in [b"", b"short", b"version https://git-lfs.github.com/spec/v1\noid sha256:fake"]:
            with self.subTest(content=content):
                self.write("model.bin", content)
                self.assertEqual(models.file_problem(self.folder / "model.bin", self.model["files"]["model.bin"]), "size-mismatch")

    def test_unfinished_blob_does_not_count_as_snapshot(self):
        self.cache.mkdir()
        (self.cache / "model.bin.incomplete").write_bytes(self.content["model.bin"])
        self.assertEqual(models.inspect_model("test", self.model, self.cache)["problems"]["model.bin"], "missing")

    def test_bad_download_is_not_marked_ready(self):
        def bad(**kwargs):
            self.write(kwargs["filename"], b"bad")
        with self.assertRaisesRegex(RuntimeError, "下载后校验失败"):
            models.download_model("test", self.model, self.cache, downloader=bad)

    def test_network_failure_preserves_completed_files_for_resume(self):
        def failed(**kwargs):
            if kwargs["filename"] == "model.bin":
                raise OSError("secret URL must not leak")
            return self.download(**kwargs)
        with self.assertRaisesRegex(RuntimeError, "保留缓存") as caught:
            models.download_model("test", self.model, self.cache, downloader=failed)
        self.assertNotIn("secret URL", str(caught.exception))
        self.calls.clear()
        report = models.download_model("test", self.model, self.cache, downloader=self.download)
        self.assertEqual(report["downloaded_files"], ["model.bin"])

    def test_existing_external_model_dir_reused(self):
        for name in self.content:
            self.write(name)
        report = models.download_model("test", self.model, self.cache, model_dir=self.folder, downloader=self.download)
        self.assertEqual(report["action"], "reused")
        self.assertEqual(self.calls, [])

    def test_lock_blocks_second_process_and_releases(self):
        source = (
            "import importlib.util, pathlib; "
            f"s=importlib.util.spec_from_file_location('m', {str(ROOT / 'scripts' / 'models.py')!r}); "
            "m=importlib.util.module_from_spec(s); s.loader.exec_module(m); "
            f"c=m.download_lock(pathlib.Path({str(self.cache)!r}), {{'repo_id':'test/model'}}); "
            "c.__enter__(); c.__exit__(None,None,None)"
        )
        with models.download_lock(self.cache, self.model):
            child = subprocess.run([sys.executable, "-c", source], capture_output=True, text=True, encoding="utf-8",
                                   env={**os.environ, "PYTHONUTF8": "1"}, timeout=10)
            self.assertNotEqual(child.returncode, 0)
            self.assertIn("同一模型正在下载", child.stderr)
        child = subprocess.run([sys.executable, "-c", source], capture_output=True, timeout=10)
        self.assertEqual(child.returncode, 0)

    def test_environment_cache_precedence(self):
        with patch.dict(os.environ, {"HF_HUB_CACHE": str(self.cache), "HF_HOME": str(self.cache / "other")}, clear=True):
            self.assertEqual(models.cache_root(), self.cache.resolve())
            self.assertEqual(models.cache_root(self.cache / "explicit"), (self.cache / "explicit").resolve())
        with patch.dict(os.environ, {"HF_HOME": str(self.cache)}, clear=True):
            self.assertEqual(models.cache_root(), (self.cache / "hub").resolve())

    def test_manifest_covers_exactly_active_skills(self):
        manifest = models.load_manifest()
        registry = json.loads((ROOT / "tests/fixtures/skill-registry.json").read_text(encoding="utf-8"))
        self.assertEqual(set(manifest["skills"]), {s["name"] for s in registry["skills"]})

    def test_manifest_rejects_unpinned_and_unsafe_paths(self):
        manifest = models.load_manifest()
        manifest["models"]["whisper-large-v3"]["revision"] = "main"
        file = Path(self.temp.name) / "registry.json"
        file.write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "commit"):
            models.load_manifest(file)
        manifest = models.load_manifest()
        manifest["models"]["whisper-large-v3"]["files"]["../model.bin"] = self.model["files"]["model.bin"]
        file.write_text(json.dumps(manifest), encoding="utf-8")
        with self.assertRaisesRegex(ValueError, "非法文件路径"):
            models.load_manifest(file)


if __name__ == "__main__":
    unittest.main()

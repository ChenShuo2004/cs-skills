#!/usr/bin/env python3
"""按固定版本检查与下载可选模型；check 只读且不联网。"""
import argparse
from contextlib import contextmanager
import hashlib
import json
import os
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "models" / "registry.json"


def load_manifest(path=MANIFEST):
    data = json.loads(Path(path).read_text(encoding="utf-8"))
    if data.get("schema_version") != 1:
        raise ValueError("不支持的模型清单版本")
    for model_id, model in data["models"].items():
        if not re.fullmatch(r"[\w.-]+/[\w.-]+", model["repo_id"]):
            raise ValueError(f"无效的模型仓库：{model_id}")
        if not re.fullmatch(r"[0-9a-f]{40}", model["revision"]):
            raise ValueError(f"模型必须固定到 commit：{model_id}")
        for name, info in model["files"].items():
            if "\\" in name or name.startswith("/") or any(p in ("..", ".", "") for p in name.split("/")):
                raise ValueError(f"非法文件路径：{name}")
            algorithm = info["hash_type"]
            length = {"sha256": 64, "git-sha1": 40}.get(algorithm)
            if not length or not re.fullmatch(f"[0-9a-f]{{{length}}}", info["hash"]) or info["size"] <= 0:
                raise ValueError(f"缺少有效校验信息：{model_id}/{name}")
    for name, profile in data["profiles"].items():
        if not profile or any(m not in data["models"] for m in profile):
            raise ValueError(f"无效模型组合：{name}")
    for skill in data["skills"].values():
        if any(p not in data["profiles"] for p in skill["optional_profiles"]):
            raise ValueError("技能引用了未知模型组合")
    return data


def cache_root(explicit=None):
    if explicit:
        return Path(explicit).expanduser().resolve()
    configured = os.environ.get("HF_HUB_CACHE") or os.environ.get("HUGGINGFACE_HUB_CACHE")
    if configured:
        return Path(configured).expanduser().resolve()
    hf_home = os.environ.get("HF_HOME")
    if not hf_home:
        hf_home = str(Path(os.environ.get("XDG_CACHE_HOME", str(Path.home() / ".cache"))) / "huggingface")
    return (Path(hf_home).expanduser() / "hub").resolve()


def snapshot_dir(model, cache, model_dir=None):
    if model_dir:
        return Path(model_dir).expanduser().resolve()
    return cache / ("models--" + model["repo_id"].replace("/", "--")) / "snapshots" / model["revision"]


def file_problem(file_path, info):
    if not file_path.is_file():
        return "missing"
    if file_path.stat().st_size != info["size"]:
        return "size-mismatch"
    digest = hashlib.sha256() if info["hash_type"] == "sha256" else hashlib.sha1()
    if info["hash_type"] == "git-sha1":
        digest.update(f"blob {info['size']}\0".encode())
    with file_path.open("rb") as stream:
        for block in iter(lambda: stream.read(4 * 1024 * 1024), b""):
            digest.update(block)
    return None if digest.hexdigest() == info["hash"] else "hash-mismatch"


def inspect_model(model_id, model, cache, model_dir=None):
    folder = snapshot_dir(model, cache, model_dir)
    problems = {}
    for name, info in model["files"].items():
        problem = file_problem(folder / name, info)
        if problem:
            problems[name] = problem
    return {"model": model_id, "repo_id": model["repo_id"], "revision": model["revision"],
            "status": "ready" if not problems else "missing-or-invalid", "path": str(folder), "problems": problems}


@contextmanager
def download_lock(cache, model):
    """同一缓存、同一模型互斥；退出自动释放，保留空锁文件。"""
    lock_dir = cache / ".cs-skills-locks"
    lock_dir.mkdir(parents=True, exist_ok=True)
    lock_path = lock_dir / (model["repo_id"].replace("/", "--") + ".lock")
    with lock_path.open("a+b") as lock:
        lock.seek(0, 2)
        if lock.tell() == 0:
            lock.write(b"0")
            lock.flush()
        lock.seek(0)
        try:
            if os.name == "nt":
                import msvcrt
                msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
            else:
                import fcntl
                fcntl.flock(lock.fileno(), fcntl.LOCK_EX | fcntl.LOCK_NB)
        except OSError as error:
            raise RuntimeError("同一模型正在下载，请等该进程结束后重试") from error
        try:
            yield
        finally:
            lock.seek(0)
            if os.name == "nt":
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(lock.fileno(), fcntl.LOCK_UN)


def download_model(model_id, model, cache, model_dir=None, repair=False, downloader=None):
    # check 不会创建锁文件；download 在锁内重新检查，防止并发重复下载。
    lock_root = Path(model_dir).expanduser().resolve() if model_dir else cache
    with download_lock(lock_root, model):
        report = inspect_model(model_id, model, cache, model_dir)
        if report["status"] == "ready":
            return {**report, "action": "reused", "downloaded_files": []}
        invalid = [n for n, reason in report["problems"].items() if reason != "missing"]
        if invalid and not repair:
            raise RuntimeError(f"{model_id} 有损坏或版本不符的文件：{', '.join(invalid)}。核对后使用 --repair；不会自动覆盖。")
        if downloader is None:
            try:
                from huggingface_hub import hf_hub_download
            except ImportError as error:
                raise RuntimeError("下载需要 huggingface_hub；请在目标 Python 环境安装 models/requirements.txt") from error
            downloader = hf_hub_download
        downloaded = []
        for name, reason in report["problems"].items():
            kwargs = {"repo_id": model["repo_id"], "filename": name, "revision": model["revision"],
                      "cache_dir": str(cache), "force_download": reason != "missing"}
            if model_dir:
                kwargs["local_dir"] = str(Path(model_dir).expanduser().resolve())
            try:
                downloader(**kwargs)
            except Exception as error:
                raise RuntimeError(f"下载 {model_id}/{name} 失败 ({type(error).__name__})；保留缓存，可重试续下。") from error
            problem = file_problem(Path(report["path"]) / name, model["files"][name])
            if problem:
                raise RuntimeError(f"下载后校验失败：{model_id}/{name} ({problem})；保留缓存，未标为完成")
            downloaded.append(name)
        return {**inspect_model(model_id, model, cache, model_dir), "action": "downloaded", "downloaded_files": downloaded}


def select_models(args, manifest):
    selected = list(args.model or [])
    for profile in args.profile or []:
        if profile not in manifest["profiles"]:
            raise ValueError(f"未知模型组合：{profile}")
        selected.extend(manifest["profiles"][profile])
    if args.all:
        selected.extend(manifest["models"])
    selected = list(dict.fromkeys(selected))
    if not selected:
        raise ValueError("请指定 --model、--profile 或 --all；不会默认下载所有模型")
    if any(m not in manifest["models"] for m in selected):
        raise ValueError("未知模型 ID；用 list 查看清单")
    if args.model_dir and len(selected) != 1:
        raise ValueError("--model-dir 只支持一个 --model")
    return selected


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("command", choices=["list", "check", "download"])
    parser.add_argument("--model", action="append", help="模型 ID，可重复")
    parser.add_argument("--profile", action="append", help="模型组合，可重复")
    parser.add_argument("--all", action="store_true", help="显式选择全部可选模型")
    parser.add_argument("--cache-dir", help="HF Hub 缓存根目录")
    parser.add_argument("--model-dir", help="单个模型已有目录，按固定版本校验")
    parser.add_argument("--repair", action="store_true", help="允许重下校验失败的文件")
    args = parser.parse_args(argv)
    try:
        manifest = load_manifest()
        if args.command == "list":
            print(json.dumps(manifest, ensure_ascii=False, indent=2))
            return 0
        selected = select_models(args, manifest)
        reports = []
        cache = cache_root(args.cache_dir)
        for model_id in selected:
            model = manifest["models"][model_id]
            if args.command == "check":
                result = inspect_model(model_id, model, cache, args.model_dir)
            else:
                result = download_model(model_id, model, cache, args.model_dir, args.repair)
            reports.append(result)
        print(json.dumps(reports, ensure_ascii=False, indent=2))
        return 0 if all(r["status"] == "ready" for r in reports) else 1
    except (ValueError, KeyError, OSError, RuntimeError) as error:
        # 第三方异常可能带认证请求详情，不直接输出；只输出本脚本的安全诊断。
        print(f"模型检查失败：{error}", file=sys.stderr)
        return 2
    except Exception as error:
        print(f"模型下载失败 ({type(error).__name__})；请检查网络、磁盘或 HF 配置，缓存已保留。", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())

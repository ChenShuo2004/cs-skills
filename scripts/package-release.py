#!/usr/bin/env python3
"""生成仅含注册技能与可复用工具的安装包，并记录所有文件 SHA-256。"""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
SKIP = {"node_modules", "__pycache__", ".git", "output", ".cache"}


def build(output):
    registry = json.loads((ROOT / "tests/fixtures/skill-registry.json").read_text(encoding="utf-8"))
    names = [s["name"] for s in registry["skills"]]
    paths = []
    for directory in names + ["scripts", "models", "tests", "docs"]:
        for file in (ROOT / directory).rglob("*"):
            if not file.is_file() or any(p in SKIP for p in file.relative_to(ROOT).parts):
                continue
            if file.name.startswith(".env") or file.suffix in {".pyc", ".bin", ".safetensors", ".ckpt", ".pth", ".pt", ".msgpack"}:
                continue
            if file.is_symlink():
                raise ValueError(f"不打包软链接：{file.relative_to(ROOT)}")
            paths.append(file)
    for name in ["README.md", "README.en.md", "CHANGELOG.md", "LICENSE", "CONTRIBUTORS.md", "AGENTS.md"]:
        if (ROOT / name).is_file():
            paths.append(ROOT / name)
    # README 引用的实际首页图与演示：保留对应远端素材，不纳入私人工作区。
    for name in ["assets/chenshuo-skills-cover.png", "assets/cs-skills-pipeline.svg",
                 "assets/demos/readme-optimization/poster.jpg", "assets/demos/readme-optimization/demo-v2.mp4",
                 "assets/demos/readme-optimization/VO.md", "assets/demos/cs-github-push-demo.mp4",
                 "assets/demos/cs-github-push-poster.jpg", "assets/demos/cs-github-push-script.md"]:
        if (ROOT / name).is_file():
            paths.append(ROOT / name)
    hashes = {f.relative_to(ROOT).as_posix(): hashlib.sha256(f.read_bytes()).hexdigest() for f in sorted(set(paths))}
    manifest = {"version": registry["version"], "skills": names, "files": hashes}
    output = Path(output).resolve()
    output.mkdir(parents=True, exist_ok=True)
    package = output / f"cs-skills-v{registry['version']}.zip"
    prefix = f"cs-skills-v{registry['version']}/"
    with zipfile.ZipFile(package, "w", zipfile.ZIP_DEFLATED) as archive:
        for relative in hashes:
            archive.write(ROOT / relative, prefix + relative)
        archive.writestr(prefix + "INSTALL-MANIFEST.json", json.dumps(manifest, ensure_ascii=False, indent=2))
    with zipfile.ZipFile(package) as archive:
        if archive.testzip():
            raise ValueError("安装包 CRC 检查失败")
        for relative, expected in hashes.items():
            if hashlib.sha256(archive.read(prefix + relative)).hexdigest() != expected:
                raise ValueError(f"安装包文件不一致：{relative}")
    checksum = output / "SHA256SUMS.txt"
    checksum.write_text(f"{hashlib.sha256(package.read_bytes()).hexdigest()}  {package.name}\n", encoding="utf-8")
    print(json.dumps({"package": str(package), "checksum": str(checksum), "version": registry["version"],
                      "registered_skills": len(names), "files": len(hashes)}, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", default="dist")
    build(parser.parse_args().output)

"""定位整理后的资料，同时兼容旧目录与用户已存在的配置文件。"""
from pathlib import Path

RESOURCE_DIRS = {'rules', 'references', 'profiles', 'schemas'}


def resource_path(root, relative):
    root, relative = Path(root), Path(relative)
    legacy = root / relative
    return legacy if legacy.exists() else root / 'resources' / relative


def profile_path(profile, root):
    path, root = Path(profile), Path(root)
    if path.exists():
        return path
    if path.is_absolute():
        try:
            relative = path.resolve().relative_to(root.resolve())
        except ValueError:
            return path
    else:
        relative = path
    if relative.parts and relative.parts[0] in RESOURCE_DIRS and '..' not in relative.parts:
        return resource_path(root, relative)
    return path

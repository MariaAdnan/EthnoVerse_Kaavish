"""Pure validation helpers shared by the Modal worker and its unit tests."""

from __future__ import annotations

import re
from pathlib import Path
from urllib.parse import urlparse
from uuid import UUID
from zipfile import ZipInfo

OBJECT_NAME_PATTERN = re.compile(r"^[A-Za-z0-9][A-Za-z0-9_-]{0,79}$")
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}
MAX_ARCHIVE_ENTRIES = 500
MAX_IMAGE_BYTES = 50 * 1024 * 1024
MAX_EXTRACTED_BYTES = 2 * 1024 * 1024 * 1024
MAX_COMPRESSION_RATIO = 200


def validate_uuid(value: str, label: str) -> str:
    try:
        return str(UUID(str(value)))
    except (TypeError, ValueError, AttributeError) as error:
        raise ValueError(f"{label} must be a valid UUID") from error


def validate_object_name(value: str) -> str:
    if not isinstance(value, str) or not OBJECT_NAME_PATTERN.fullmatch(value):
        raise ValueError(
            "Object name must be 1-80 letters, numbers, hyphens, or underscores"
        )
    return value


def validate_source_url(value: str, allowed_hosts: set[str]) -> str:
    parsed = urlparse(str(value))
    if parsed.scheme != "https" or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Image ZIP URL must be an HTTPS URL without embedded credentials")
    hostname = parsed.hostname.casefold()
    if hostname not in {host.casefold() for host in allowed_hosts}:
        raise ValueError("Image ZIP URL host is not approved")
    return parsed.geturl()


def validated_image_members(infos: list[ZipInfo]) -> list[ZipInfo]:
    if len(infos) > MAX_ARCHIVE_ENTRIES:
        raise ValueError(f"ZIP contains more than {MAX_ARCHIVE_ENTRIES} entries")

    selected: list[ZipInfo] = []
    names: set[str] = set()
    extracted_bytes = 0
    for info in infos:
        member = info.filename
        if info.is_dir() or "__MACOSX" in member or member.startswith("."):
            continue
        filename = Path(member).name
        if not filename or Path(filename).suffix.casefold() not in IMAGE_SUFFIXES:
            continue
        normalized = filename.casefold()
        if normalized in names:
            raise ValueError(f"ZIP contains duplicate flattened filename: {filename}")
        names.add(normalized)
        if info.file_size <= 0 or info.file_size > MAX_IMAGE_BYTES:
            raise ValueError(f"Image entry has an invalid size: {filename}")
        compressed = max(info.compress_size, 1)
        if info.file_size / compressed > MAX_COMPRESSION_RATIO:
            raise ValueError(f"Image entry has a suspicious compression ratio: {filename}")
        extracted_bytes += info.file_size
        if extracted_bytes > MAX_EXTRACTED_BYTES:
            raise ValueError("ZIP expands beyond the allowed size")
        selected.append(info)
    return selected


def model_path(storage_root: Path, object_name: str) -> Path:
    return storage_root / validate_object_name(object_name) / "point_cloud.ply"

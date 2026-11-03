"""Convert JPEG photos under an image root to size-capped WebP files.

For every ``.jpg``/``.jpeg`` file (any case) found recursively under the root:

1. Apply EXIF orientation and convert to RGB.
2. Downscale (LANCZOS) to a max edge of 1600 px, or 1200 px for the two
   portraits (``susans-headshot``, ``susie-pic``).
3. Encode WebP in memory at quality 80, method 6. If the result exceeds
   400 KB, re-encode at quality 72; if still too large, shrink the max edge
   by 0.85 and retry at quality 72 until it fits or the edge reaches 900 px.
4. Write ``<slug>.webp`` next to the source (lowercase, non-alphanumeric
   runs replaced by ``-``; ``-2``, ``-3``... appended on collision), then
   delete the source only after the write succeeded.

Each conversion is merged into ``scripts/image-manifest.json`` as
``{"old", "new", "w", "h", "bytes"}`` with repo-relative, forward-slash
paths. Re-running is idempotent: no JPEGs remain and the manifest is kept.

Usage (from the repo root; requires Pillow)::

    python scripts/optimize_images.py [root=assets/images]
"""

from __future__ import annotations

import argparse
import io
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

from PIL import Image, ImageOps

REPO_ROOT = Path(__file__).resolve().parents[1]
MANIFEST_PATH = REPO_ROOT / "scripts" / "image-manifest.json"

JPEG_SUFFIXES = {".jpg", ".jpeg"}
PORTRAIT_STEMS = {"susans-headshot", "susie-pic"}
DEFAULT_MAX_EDGE = 1600
PORTRAIT_MAX_EDGE = 1200
MIN_FALLBACK_EDGE = 900
EDGE_SHRINK = 0.85
PRIMARY_QUALITY = 80
FALLBACK_QUALITY = 72
WEBP_METHOD = 6
MAX_BYTES = 400 * 1024


@dataclass(frozen=True)
class ManifestEntry:
    """One source-to-WebP conversion record."""

    old: str
    new: str
    w: int
    h: int
    bytes: int


@dataclass(frozen=True)
class EncodeResult:
    """Encoded WebP bytes plus the settings that produced them."""

    data: bytes
    width: int
    height: int
    quality: int
    fallback: bool


def slugify(stem: str) -> str:
    """Lowercase ``stem`` and collapse every non-[a-z0-9] run into ``-``."""
    return re.sub(r"[^a-z0-9]+", "-", stem.lower()).strip("-")


def rel(path: Path) -> str:
    """Return ``path`` relative to the repo root with forward slashes."""
    return path.resolve().relative_to(REPO_ROOT).as_posix()


def total_bytes(root: Path) -> int:
    """Sum the sizes of all files under ``root``."""
    return sum(p.stat().st_size for p in root.rglob("*") if p.is_file())


def find_jpegs(root: Path) -> list[Path]:
    """Return JPEG files under ``root`` (case-insensitive suffix), sorted."""
    return sorted(
        p for p in root.rglob("*") if p.is_file() and p.suffix.lower() in JPEG_SUFFIXES
    )


def fit(image: Image.Image, max_edge: int) -> Image.Image:
    """Downscale ``image`` so its longest edge is at most ``max_edge``."""
    if max(image.size) <= max_edge:
        return image
    scale = max_edge / max(image.size)
    size = (max(1, round(image.width * scale)), max(1, round(image.height * scale)))
    return image.resize(size, Image.Resampling.LANCZOS)


def encode_webp(image: Image.Image, quality: int) -> bytes:
    """Encode ``image`` as WebP in memory."""
    buffer = io.BytesIO()
    image.save(buffer, format="WEBP", quality=quality, method=WEBP_METHOD)
    return buffer.getvalue()


def encode_with_fallback(image: Image.Image, max_edge: int) -> EncodeResult:
    """Encode at q80; fall back to q72 and then shrinking edges until <= 400 KB."""
    resized = fit(image, max_edge)
    data = encode_webp(resized, PRIMARY_QUALITY)
    if len(data) <= MAX_BYTES:
        return EncodeResult(data, resized.width, resized.height, PRIMARY_QUALITY, False)

    edge = max_edge
    while True:
        data = encode_webp(resized, FALLBACK_QUALITY)
        if len(data) <= MAX_BYTES or edge <= MIN_FALLBACK_EDGE:
            return EncodeResult(data, resized.width, resized.height, FALLBACK_QUALITY, True)
        edge = max(MIN_FALLBACK_EDGE, int(edge * EDGE_SHRINK))
        resized = fit(image, edge)


def target_path(source: Path, used: set[Path]) -> Path:
    """Pick a unique ``<slug>.webp`` path beside ``source``.

    A name counts as taken if this run already produced it or a file of that
    name already exists on disk, so nothing is silently overwritten.
    """
    base = slugify(source.stem) or "image"
    candidate = source.with_name(f"{base}.webp")
    n = 2
    while candidate in used or candidate.exists():
        candidate = source.with_name(f"{base}-{n}.webp")
        n += 1
    return candidate


def convert(source: Path, used: set[Path]) -> tuple[ManifestEntry, EncodeResult]:
    """Convert one JPEG to WebP, write it, then delete the source."""
    with Image.open(source) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
    max_edge = PORTRAIT_MAX_EDGE if slugify(source.stem) in PORTRAIT_STEMS else DEFAULT_MAX_EDGE
    result = encode_with_fallback(image, max_edge)

    target = target_path(source, used)
    target.write_bytes(result.data)
    if target.stat().st_size != len(result.data):
        raise OSError(f"Incomplete write: {target}")
    used.add(target)
    source.unlink()

    entry = ManifestEntry(rel(source), rel(target), result.width, result.height, len(result.data))
    return entry, result


def load_manifest() -> dict[str, dict[str, object]]:
    """Load the existing manifest keyed by ``old`` path, or an empty mapping."""
    if not MANIFEST_PATH.exists():
        return {}
    entries = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
    return {str(e["old"]): e for e in entries}


def save_manifest(entries: dict[str, dict[str, object]]) -> None:
    """Write manifest entries sorted by ``old`` path."""
    MANIFEST_PATH.parent.mkdir(parents=True, exist_ok=True)
    ordered = [entries[k] for k in sorted(entries)]
    MANIFEST_PATH.write_text(json.dumps(ordered, indent=2) + "\n", encoding="utf-8")


def parse_args(argv: list[str] | None = None) -> argparse.Namespace:
    """Parse command-line arguments."""
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument(
        "root",
        nargs="?",
        default="assets/images",
        type=Path,
        help="image root to scan recursively (default: assets/images)",
    )
    return parser.parse_args(argv)


def main(argv: list[str] | None = None) -> int:
    """Run the conversion and print before/after totals."""
    root: Path = parse_args(argv).root.resolve()
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        return 1

    before = total_bytes(root)
    manifest = load_manifest()
    used: set[Path] = set()
    sources = find_jpegs(root)

    for source in sources:
        entry, result = convert(source, used)
        manifest[entry.old] = asdict(entry)
        note = f" (fallback q{result.quality})" if result.fallback else ""
        warn = " WARNING: still over 400 KB" if entry.bytes > MAX_BYTES else ""
        print(f"{entry.old} -> {entry.new} {entry.w}x{entry.h} {entry.bytes / 1024:.0f} KB{note}{warn}")

    save_manifest(manifest)
    after = total_bytes(root)
    print(f"Converted {len(sources)} file(s); manifest has {len(manifest)} entries.")
    print(f"Total before: {before / 1024 / 1024:.2f} MB ({before} bytes)")
    print(f"Total after:  {after / 1024 / 1024:.2f} MB ({after} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Stage Rockstar's official GTA VI posters for the GitHub Pages build.

Screen JPGs are lightweight and always attempted. For detailed map zoom,
download Rockstar's original print-ready ZIP and convert its 5775×7900 JPEG
to compressed WebP. The much larger image is fetched by the browser ONLY
when a visitor zooms in on the standalone Leonida Map page.

Any network or conversion failure is nonfatal. The screen poster remains
usable and users can follow the official Rockstar printable download link.
"""
from __future__ import annotations

from io import BytesIO
from pathlib import Path
import sys
import time
import urllib.request
import zipfile

POSTERS = (
    ("cover-art.jpg", "https://leonidainteractive.com/img/media/Cover_Art_Poster.jpg"),
    ("leonida-map.jpg", "https://leonidainteractive.com/img/media/Leonida_Map_Poster.jpg"),
)
PRINT_URL = "https://media-rockstargames-com.akamaized.net/VI/downloads/artwork_wallpapers/Leonida_Map_Poster_Printable.zip"
DETAIL_NAME = "leonida-map-detail.webp"
MAX_SCREEN_BYTES = 12 * 1024 * 1024
MAX_PRINT_ZIP_BYTES = 80 * 1024 * 1024


def retrieve(url: str, limit: int, timeout: int) -> tuple[bytes, str]:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "ViceCityHub/4.2 (+https://www.rockstargames.com/VI/media)"},
    )
    with urllib.request.urlopen(request, timeout=timeout) as response:
        content_type = response.headers.get("Content-Type", "").lower()
        data = response.read(limit + 1)
    if not data or len(data) > limit:
        raise ValueError("Source is empty or too large")
    return data, content_type


def stage_screens(target: Path) -> int:
    count = 0
    for filename, url in POSTERS:
        for attempt in range(2):
            try:
                data, content_type = retrieve(url, MAX_SCREEN_BYTES, 30)
                if "image/jpeg" not in content_type and "image/jpg" not in content_type:
                    raise ValueError(f"Unexpected content type: {content_type}")
                if len(data) < 20 * 1024 or not data.startswith(b"\xff\xd8\xff"):
                    raise ValueError("Not a valid screen JPEG")
                (target / filename).write_bytes(data)
                print(f"Poster staged: {filename} ({len(data):,} bytes)")
                count += 1
                break
            except Exception as exc:
                if attempt == 1:
                    print(f"Poster mirror unavailable: {filename}: {exc}", file=sys.stderr)
                else:
                    time.sleep(1)
    print(f"Poster result: {count}/{len(POSTERS)} screen copies staged")
    return count


def stage_print_detail(target: Path) -> bool:
    try:
        from PIL import Image
    except ImportError:
        print("HD map skipped: Pillow is not installed", file=sys.stderr)
        return False
    for attempt in range(2):
        try:
            data, content_type = retrieve(PRINT_URL, MAX_PRINT_ZIP_BYTES, 75)
            if not data.startswith(b"PK\x03\x04"):
                raise ValueError(f"Not a ZIP archive ({content_type})")
            with zipfile.ZipFile(BytesIO(data)) as archive:
                matches = [
                    item for item in archive.infolist()
                    if not item.is_dir()
                    and item.filename.lower().endswith((".jpg", ".jpeg"))
                    and 1024 * 1024 < item.file_size < 100 * 1024 * 1024
                ]
                if len(matches) != 1:
                    raise ValueError("Expected one printable JPEG in Rockstar's ZIP")
                with archive.open(matches[0]) as raw:
                    source = Image.open(raw)
                    width, height = source.size
                    if width < 5000 or height < 7000 or width > 10000 or height > 10000:
                        raise ValueError(f"Unexpected map dimensions {width}×{height}")
                    poster = source.convert("RGB")
            dest = target / DETAIL_NAME
            poster.save(dest, format="WEBP", quality=84, method=4)
            size = dest.stat().st_size
            if size < 200 * 1024:
                dest.unlink(missing_ok=True)
                raise ValueError("Encoded map is unexpectedly small")
            print(f"HD map staged: {dest.name} {width}x{height} ({size:,} bytes)")
            return True
        except Exception as exc:
            if attempt == 1:
                print(f"HD map unavailable; standard map still works: {exc}", file=sys.stderr)
            else:
                time.sleep(2)
    return False


def main(destination: str) -> int:
    target = Path(destination) / "assets" / "posters"
    target.mkdir(parents=True, exist_ok=True)
    stage_screens(target)
    stage_print_detail(target)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else "dist"))

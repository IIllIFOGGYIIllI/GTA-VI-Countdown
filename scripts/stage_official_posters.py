#!/usr/bin/env python3
"""Stage the two Rockstar GTA VI posters used by Vice City Hub.

The user selected the official cover-art poster and the official Leonida map.
The screen-sized copies are available at stable public media mirror URLs.
If the mirrors are offline, do not block the entire Pages release: the
website has a direct-source fallback and an official Rockstar media link.
No optional story/media collection is fetched by this script.
"""
from __future__ import annotations

import sys
import time
import urllib.request
from pathlib import Path

POSTERS = (
    ("cover-art.jpg", "https://leonidainteractive.com/img/media/Cover_Art_Poster.jpg"),
    ("leonida-map.jpg", "https://leonidainteractive.com/img/media/Leonida_Map_Poster.jpg"),
)
MAX_BYTES = 12 * 1024 * 1024
MIN_BYTES = 20 * 1024


def fetch_image(url: str) -> bytes:
    request = urllib.request.Request(
        url,
        headers={"User-Agent": "ViceCityHub/4.1 (+https://www.rockstargames.com/VI/media)"},
    )
    with urllib.request.urlopen(request, timeout=25) as response:
        content_type = response.headers.get("Content-Type", "").lower()
        if "image/jpeg" not in content_type and "image/jpg" not in content_type:
            raise ValueError("Unexpected content type: " + content_type)
        data = response.read(MAX_BYTES + 1)
    if not MIN_BYTES < len(data) <= MAX_BYTES or not data.startswith(b"\xff\xd8\xff"):
        raise ValueError("Source was not a valid-size JPEG")
    return data


def main(destination: str) -> int:
    target = Path(destination) / "assets" / "posters"
    target.mkdir(parents=True, exist_ok=True)
    count = 0
    for filename, url in POSTERS:
        for attempt in range(2):
            try:
                content = fetch_image(url)
                (target / filename).write_bytes(content)
                print(f"Poster staged: {filename} ({len(content):,} bytes)")
                count += 1
                break
            except Exception as exc:
                if attempt == 1:
                    print(f"Poster mirror unavailable: {filename}: {exc}", file=sys.stderr)
                else:
                    time.sleep(1)
    print(f"Poster result: {count}/{len(POSTERS)} copies staged; site fallback remains enabled")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1] if len(sys.argv) > 1 else "dist"))

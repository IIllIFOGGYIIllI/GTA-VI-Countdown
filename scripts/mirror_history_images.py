#!/usr/bin/env python3
"""Bundle verified classic Vice City images at Pages publish time.

Rationale: third-party image hosts often restrict or break hotlinks on mobile.
The finished website serves classic images as local GitHub Pages assets instead.
Official GTA VI visuals remain opt-in and are never downloaded by this job.
"""
from __future__ import annotations

import concurrent.futures
import hashlib
import json
import re
import sys
import time
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urlsplit
from urllib.request import Request, urlopen

STATIC_HOSTS = {
    "www.gtabase.com", "gtwfilesie-thumb.grandtheftwiki.com",
    "gtwfilesie.grandtheftwiki.com", "www.gtavision.com",
    "media-rockstargames-com.akamaized.net", "upload.wikimedia.org",
}
IMAGE_EXT = {".png", ".webp", ".jpg", ".jpeg"}
# The tokenizer deliberately collects full /image.jpg/800px-image.jpg wiki URLs.
TOKEN = re.compile(r'''https://[^"'<>\\s]+''', re.I)
MAX_BYTES = 12 * 1024 * 1024

def is_image(url: str) -> bool:
    parts = urlsplit(url)
    return parts.hostname in STATIC_HOSTS and Path(parts.path).suffix.lower() in IMAGE_EXT

def collect(source: str) -> list[str]:
    return sorted({m.group().rstrip("),.;") for m in TOKEN.finditer(source)
                   if is_image(m.group().rstrip("),.;"))})

def content_kind(data: bytes) -> str | None:
    if data.startswith(b"\xff\xd8\xff"): return "jpeg"
    if data.startswith(b"\x89PNG\r\n\x1a\n"): return "png"
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP": return "webp"
    if data.startswith((b"GIF87a", b"GIF89a")): return "gif"
    return None

def destination(root: Path, url: str) -> Path:
    parsed = urlsplit(url)
    name = unquote(Path(parsed.path).name)
    name = re.sub(r"[^A-Za-z0-9._-]", "_", name)
    if len(name) > 140: name = name[:112] + Path(name).suffix
    ident = hashlib.sha256(url.encode("utf-8")).hexdigest()[:12]
    return root / "assets" / "history" / ident / name

def download(entry: tuple[str, Path]) -> tuple[str, Path, int, str]:
    url, target = entry
    origin = urlsplit(url)
    headers = {
        "User-Agent": "Mozilla/5.0 (compatible; ViceCityCountdownArchive/1.0)",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": f"{origin.scheme}://{origin.hostname}/",
    }
    failures = []
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers=headers), timeout=22) as response:
                data = response.read(MAX_BYTES + 1)
                kind = content_kind(data)
                if len(data) > MAX_BYTES or len(data) < 250 or not kind:
                    raise ValueError(f"not an image / invalid size ({len(data)} bytes)")
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(data)
                return url, target, len(data), kind
        except (HTTPError, URLError, OSError, ValueError) as exc:
            failures.append(str(exc)[:130])
            if attempt != 2: time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"Unable to archive {url}: {'; '.join(failures)}")

def main() -> int:
    if len(sys.argv) != 2: raise SystemExit("Usage: mirror_history_images.py DIST_DIRECTORY")
    dist = Path(sys.argv[1]).resolve()
    html_path = dist / "vice-city-history.html"
    script_path = dist / "assets" / "vice-city-history.js"
    html, script = html_path.read_text("utf-8"), script_path.read_text("utf-8")
    urls = sorted(set(collect(html) + collect(script)))
    if len(urls) < 40:
        raise RuntimeError(f"Only found {len(urls)} archive images; expected >40. Refusing partial publication.")
    print(f"Mirroring {len(urls)} archived game images for direct first-party delivery", flush=True)
    targets = [(url, destination(dist, url)) for url in urls]
    complete, errors = [], []
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:
        futures = {pool.submit(download, entry): entry[0] for entry in targets}
        for future in concurrent.futures.as_completed(futures):
            try:
                result = future.result()
                complete.append(result)
                print(f"OK {result[3]} {result[2]:>8}B {result[0]}", flush=True)
            except Exception as exc:
                errors.append(str(exc))
                print(f"FAILED {exc}", file=sys.stderr, flush=True)
    if errors:
        print(f"{len(errors)} of {len(urls)} images could not be mirrored. "
              "Keeping previous live version rather than publishing broken image links.", file=sys.stderr)
        return 1
    for url, target, _, _ in complete:
        rel = "./" + target.relative_to(dist).as_posix()
        html = html.replace(url, rel)
        script = script.replace(url, rel)
    html_path.write_text(html, encoding="utf-8")
    script_path.write_text(script, encoding="utf-8")
    # Verify that none of the classic remote image URLs remain in the built page.
    unresolved = collect(html) + collect(script)
    if unresolved: raise RuntimeError(f"Unmirrored archive URLs: {unresolved}")
    manifest = {target.relative_to(dist).as_posix(): {
        "bytes": size, "mime": kind, "source": url
    } for url, target, size, kind in complete}
    manifest_path = dist / "assets" / "history" / "image-sources.json"
    manifest_path.parent.mkdir(parents=True, exist_ok=True)
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", "utf-8")
    total = sum(x[2] for x in complete)
    print(f"PASS {len(complete)} real locally served images; {total / 1024 / 1024:.1f} MiB total; "
          "GTA VI media kept opt-in and external.", flush=True)
    return 0

if __name__ == "__main__":
    sys.exit(main())

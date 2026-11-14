#!/usr/bin/env python3
"""Check Rockstar Newswire and open spoiler-safe *review* issues.

NO PUBLICATION IS PERFORMED BY THIS SCRIPT.
Uses only the Python standard library and GitHub Actions' GITHUB_TOKEN.
"""
from __future__ import annotations

import json
import os
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

GRAPH = "https://graph.rockstargames.com/"
REPO = os.environ.get("GITHUB_REPOSITORY", "")
TOKEN = os.environ.get("GITHUB_TOKEN", "")
API = "https://api.github.com"
LABEL = "news-review"
NOW = datetime.now(timezone.utc)

# Deliberately narrow. Potential gameplay / character / story content is not queued.
LOGISTICS = re.compile(
    r"\b(pre[\s-]?load|release date|release time|launch date|"
    r"launch time|pre[\s-]?order|available now|storefront|"
    r"download|patch notes|support|platform|edition|"
    r"server status|maintenance|accessibility)\b", re.I
)
BLOCKED = re.compile(
    r"\b(trailer|gameplay|story|plot|ending|mission|character|"
    r"leak|map reveal|footage|easter egg|spoiler|soundtrack|"
    r"radio stations|gallery|screenshots|preview)\b", re.I
)
START = NOW - timedelta(days=21)
QUERY = """
query ViceCityNewswire {
  posts(locale:"en_us", limit:75) {
    results { id title url created primary_tags { name } }
  }
}
"""


def request(url: str, *, method: str = "GET", payload=None, auth=False):
    body = json.dumps(payload).encode("utf-8") if payload is not None else None
    headers = {
        "Accept": "application/vnd.github+json" if auth else "application/json",
        "User-Agent": "ViceCityCountdown-NewswireCheck/2.0",
    }
    if body is not None:
        headers["Content-Type"] = "application/json"
    if auth:
        headers["Authorization"] = "Bearer " + TOKEN
        headers["X-GitHub-Api-Version"] = "2022-11-28"
    req = urllib.request.Request(url, method=method, data=body, headers=headers)
    with urllib.request.urlopen(req, timeout=25) as res:
        return json.load(res)


def recent(value):
    if not value:
        return False
    value = str(value).strip()
    for fmt in ("%m/%d/%y, %I:%M %p", "%m/%d/%Y, %I:%M %p", "%Y-%m-%dT%H:%M:%S%z", "%Y-%m-%d"):
        try:
            dt = datetime.strptime(value, fmt)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return START <= dt <= NOW + timedelta(days=1)
        except ValueError:
            pass
    return False  # fail closed rather than queue old or unverified dates


def safe_url(raw: str):
    if not isinstance(raw, str):
        return None
    if raw.startswith("/"):
        raw = "https://www.rockstargames.com" + raw
    p = urllib.parse.urlparse(raw)
    if p.scheme != "https" or p.hostname != "www.rockstargames.com":
        return None
    if not p.path.startswith("/newswire/article/"):
        return None
    return p._replace(query="", fragment="", params="").geturl()


def fetch_newswire():
    # Rockstar's Newswire is driven by its public GraphQL API (not an RSS feed).
    params = urllib.parse.urlencode({"query": QUERY})
    errors = []
    for method in ("GET", "POST"):
        try:
            if method == "GET":
                data = request(GRAPH + "?" + params)
            else:
                data = request(GRAPH, method="POST", payload={"query": QUERY})
            if data.get("errors"):
                raise ValueError("Rockstar GraphQL returned errors")
            return data["data"]["posts"]["results"]
        except Exception as exc:
            errors.append(f"{method}: {type(exc).__name__}: {exc}")
    raise RuntimeError("Could not read Rockstar's official feed. " + " | ".join(errors))


def issue_inventory():
    markers = set()
    for page in range(1, 8):
        url = API + f"/repos/{REPO}/issues?state=all&per_page=100&page={page}"
        items = request(url, auth=True)
        for item in items:
            if "pull_request" in item:
                continue
            found = re.search(r"<!--\s*rockstar-newswire-id:(\d+)\s*-->", item.get("body") or "")
            if found:
                markers.add(found.group(1))
        if len(items) < 100:
            break
    return markers


def ensure_label():
    try:
        request(API + f"/repos/{REPO}/labels/{LABEL}", auth=True)
    except urllib.error.HTTPError as exc:
        if exc.code != 404:
            raise
        request(API + f"/repos/{REPO}/labels", method="POST", auth=True,
                payload={"name": LABEL, "color": "f17ba9",
                         "description": "Official Rockstar article awaiting editorial, spoiler-safe approval"})


def run():
    if not TOKEN or not REPO:
        raise RuntimeError("Requires GITHUB_TOKEN and GITHUB_REPOSITORY")
    feed = fetch_newswire()
    approved = json.loads(Path("data/news.json").read_text(encoding="utf-8"))
    known_urls = {str(x.get("url", "")).rstrip("/") for x in approved.get("articles", [])}
    known_ids = issue_inventory()
    candidates = []
    for post in feed:
        if not isinstance(post, dict) or not str(post.get("id", "")).isdigit():
            continue
        title = str(post.get("title") or "")
        tag_names = [str(t.get("name", "")) for t in (post.get("primary_tags") or []) if isinstance(t, dict)]
        if not (re.search(r"grand theft auto vi|gta vi|gta 6", title, re.I)
                or any("grand theft auto vi" in tag.lower() for tag in tag_names)):
            continue
        if not recent(post.get("created")) or not LOGISTICS.search(title) or BLOCKED.search(title):
            continue
        link = safe_url(post.get("url"))
        if not link or link.rstrip("/") in known_urls or str(post["id"]) in known_ids:
            continue
        candidates.append({"id": str(post["id"]), "url": link, "created": str(post["created"])})
    if not candidates:
        print("No new safe-to-review official logistics announcements.")
        return
    ensure_label()
    for post in candidates[:4]:
        body = (
            f"<!-- rockstar-newswire-id:{post['id']} -->\n"
            "## Manual spoiler-safe review required\n\n"
            "This issue was created automatically from **Rockstar Games Newswire**. "
            "**The article has NOT been published on the website.**\n\n"
            f"- Official source: {post['url']}\n"
            f"- Newswire ID: {post['id']}\n"
            f"- Source date: {post['created']}\n\n"
            "Before publishing, read the source and create an **original, spoiler-free** headline "
            "and factual summary. Exclude story details, characters, trailers, mission content, "
            "gameplay information, images, and rumors.\n\n"
            "If safe and relevant, run **Actions → Publish reviewed news** as a repository maintainer, "
            "using this issue number and an approved headline and summary. "
            "Otherwise close this issue. Do not paste story details in comments.\n"
        )
        request(API + f"/repos/{REPO}/issues", method="POST", auth=True,
                payload={"title": "Official Newswire item awaiting spoiler-safe review · " + post["id"],
                         "body": body, "labels": [LABEL]})
        print("Created review issue for verified Rockstar post ID:", post["id"])
    if len(candidates) > 4:
        print("More candidates remain; the next scheduled check will pick them up.")


if __name__ == "__main__":
    try:
        run()
    except Exception as error:
        print("Newswire check failed without modifying website content:", error, file=sys.stderr)
        sys.exit(1)

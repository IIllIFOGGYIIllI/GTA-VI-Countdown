#!/usr/bin/env python3
"""Manually approved, spoiler-safe news publisher.

This script runs ONLY via workflow_dispatch by an authorized GitHub maintainer.
It validates an auto-discovered issue before modifying data/news.json.
"""
from __future__ import annotations

import json
import os
import re
import subprocess
import sys
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

API = "https://api.github.com"
REPO = os.getenv("GITHUB_REPOSITORY", "")
TOKEN = os.getenv("GITHUB_TOKEN", "")
PATH = Path("data/news.json")
BANNED = re.compile(r"\b(spoiler|leak|ending|story|plot|mission|character|"
                    r"twist|gameplay|trailer|datamine|footage|secret|"
                    r"character name|easter egg)\b", re.I)


def api(method, path, payload=None):
    body = None if payload is None else json.dumps(payload).encode()
    headers = {"Accept": "application/vnd.github+json",
               "Authorization": "Bearer " + TOKEN,
               "X-GitHub-Api-Version": "2022-11-28",
               "User-Agent": "ViceCityCountdown-Editor/2.0"}
    if body is not None:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(API + path, headers=headers, data=body, method=method)
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.load(r) if r.status != 204 else {}


def setting(name):
    return os.getenv("EDITOR_" + name.upper(), "").strip()


def git(*cmd):
    subprocess.run(["git", *cmd], check=True)


def main():
    if not TOKEN or not REPO:
        raise ValueError("Requires GITHUB_TOKEN and GITHUB_REPOSITORY")
    raw_number = setting("issue")
    if not raw_number.isdecimal():
        raise ValueError("Enter a valid review issue number")
    issue_number = int(raw_number)
    if issue_number <= 0:
        raise ValueError("Invalid issue number")
    headline, summary = setting("headline"), setting("summary")
    category, tag, publication_date = setting("category"), setting("tag"), setting("date")
    if category not in ("launch", "preload", "updates"):
        raise ValueError("Invalid category")
    if not (12 <= len(headline) <= 110 and 25 <= len(summary) <= 290):
        raise ValueError("Headline (12-110 chars) or summary (25-290 chars) invalid")
    if "\n" in headline or "\n" in summary:
        raise ValueError("Headline and summary must be single-line plain text")
    if BANNED.search(headline) or BANNED.search(summary):
        raise ValueError("Potentially spoiler-sensitive language detected; edit manually")
    if not (2 <= len(tag) <= 26 and re.fullmatch(r"[A-Za-z0-9 /-]+", tag)):
        raise ValueError("Tag must be short plain text")
    try:
        issued_date = datetime.strptime(publication_date, "%Y-%m-%d").date()
    except ValueError as exc:
        raise ValueError("Date must be YYYY-MM-DD") from exc
    today = datetime.now(timezone.utc).date()
    if issued_date > today or issued_date.year < 2025:
        raise ValueError("Source date out of range")
    issue = api("GET", f"/repos/{REPO}/issues/{issue_number}")
    if "pull_request" in issue or issue.get("state") != "open":
        raise ValueError("Requires an open news review issue")
    if not any(label.get("name") == "news-review" for label in issue.get("labels", [])):
        raise ValueError("Issue does not have the review label")
    body = issue.get("body") or ""
    marker = re.search(r"<!-- rockstar-newswire-id:(\d+) -->", body)
    url_match = re.search(r"^- Official source: (https://\S+)$", body, re.M)
    if not marker or not url_match:
        raise ValueError("Issue is missing verified Newswire metadata")
    url = url_match.group(1)
    parsed = urllib.parse.urlparse(url)
    if (parsed.scheme != "https" or parsed.hostname != "www.rockstargames.com"
            or not parsed.path.startswith("/newswire/article/")):
        raise ValueError("Only original Rockstar Newswire links are permitted")
    doc = json.loads(PATH.read_text(encoding="utf-8"))
    articles = doc.get("articles")
    if not isinstance(articles, list):
        raise ValueError("Invalid news file schema")
    if any(x.get("url") == url for x in articles):
        raise ValueError("Official source is already published")
    approved = {
        "id": "newswire-" + marker.group(1),
        "category": category,
        "tag": tag.upper(),
        "date": str(issued_date),
        "title": headline,
        "summary": summary,
        "url": url,
    }
    articles.insert(0, approved)
    articles.sort(key=lambda item: item.get("date", ""), reverse=True)
    doc["reviewedAt"] = datetime.now(timezone.utc).isoformat(timespec="seconds")
    PATH.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    git("config", "user.name", "github-actions[bot]")
    git("config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
    git("add", str(PATH))
    git("commit", "-m", f"Publish spoiler-safe approved GTA VI news #{issue_number}")
    git("push")
    # Close only if the content was successfully pushed.
    api("PATCH", f"/repos/{REPO}/issues/{issue_number}",
        {"state": "closed", "state_reason": "completed"})
    print(f"Published editorially approved news item from review #{issue_number}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print("Nothing was intentionally published:", exc, file=sys.stderr)
        sys.exit(1)

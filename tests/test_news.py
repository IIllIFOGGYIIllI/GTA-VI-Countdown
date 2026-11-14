"""Offline tests for the spoiler-safe Newswire intake.

Run: python3 -m unittest discover -s tests -p 'test_news.py' -v
No Rockstar or GitHub network calls are made.
"""
import importlib.util
import json
import os
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("vice_news_check", ROOT / "scripts" / "check_news.py")
news = importlib.util.module_from_spec(spec)
spec.loader.exec_module(news)


class NewsIntakeTests(unittest.TestCase):
    def test_accepts_current_official_logistics(self):
        with patch.object(news, "NOW", datetime(2026, 11, 15, tzinfo=timezone.utc)), patch.object(
            news, "START", datetime(2026, 10, 25, tzinfo=timezone.utc)
        ):
            self.assertTrue(news.recent("11/3/26, 1:00 PM"))
            self.assertTrue(news.recent("2026-11-10T10:00:00Z"))
            self.assertFalse(news.recent("09/2/26, 1:00 PM"))
        self.assertIsNotNone(news.LOGISTICS.search("Grand Theft Auto VI Pre-Load Begins November 10"))
        self.assertIsNone(news.BLOCKED.search("Grand Theft Auto VI Pre-Load Begins November 10"))

    def test_rejects_spoiler_topics(self):
        for title in (
            "Grand Theft Auto VI launch trailer",
            "Grand Theft Auto VI gameplay preview",
            "Grand Theft Auto VI story ending",
            "Grand Theft Auto VI character screenshots",
        ):
            with self.subTest(title=title):
                self.assertIsNotNone(news.BLOCKED.search(title))

    def test_only_rockstar_article_links(self):
        self.assertEqual(
            news.safe_url("/newswire/article/abc123/example"),
            "https://www.rockstargames.com/newswire/article/abc123/example",
        )
        self.assertIsNone(news.safe_url("https://evil.example/newswire/article/test"))
        self.assertIsNone(news.safe_url("https://www.rockstargames.com.evil.example/newswire/article/test"))
        self.assertIsNone(news.safe_url("javascript:alert(1)"))
        self.assertIsNone(news.safe_url("https://www.rockstargames.com/VI/media/screenshots"))

    def test_graphql_fallback_is_read_only(self):
        calls = []
        def fake_request(url, **kwargs):
            calls.append((url, kwargs.get("method", "GET")))
            if len(calls) <= 2:
                return {"errors": [{"message": "GraphQL field changed"}]}
            return {"data": {"posts": {"results": [{"id": "123", "title": "Grand Theft Auto VI Pre-Load Begins November 10", "url": "/newswire/article/example/test", "created": "11/3/26, 1:00 PM"}]}}}
        with patch.object(news, "request", side_effect=fake_request):
            data = news.fetch_newswire()
        self.assertEqual(len(data), 1)
        self.assertEqual(len(calls), 3)
        self.assertTrue(all(method in ("GET", "POST") for _, method in calls))

    def test_review_only_never_publishes(self):
        sample = {
            "id": 12345,
            "title": "Grand Theft Auto VI Pre-Load Begins November 10",
            "url": "/newswire/article/abc123/example",
            "created": news.NOW.strftime("%m/%d/%y, %I:%M %p"),
            "primary_tags": [{"name": "Grand Theft Auto VI"}],
        }
        with tempfile.TemporaryDirectory() as directory:
            before = os.getcwd()
            try:
                os.chdir(directory)
                Path("data").mkdir()
                original = json.dumps({"articles": []})
                Path("data/news.json").write_text(original, encoding="utf-8")
                calls = []
                def fake_request(url, **kwargs):
                    calls.append((url, kwargs))
                    return {"number": 14}
                with patch.object(news, "TOKEN", "test-token"), patch.object(
                    news, "REPO", "example/vice"
                ), patch.object(news, "fetch_newswire", return_value=[sample, sample]), patch.object(
                    news, "issue_inventory", return_value=set()
                ), patch.object(news, "ensure_label"), patch.object(
                    news, "request", side_effect=fake_request
                ):
                    news.run()
                self.assertEqual(len(calls), 1, "Duplicate source IDs must not create duplicate issues")
                self.assertTrue(calls[0][0].endswith("/issues"))
                self.assertIn("news-review", calls[0][1]["payload"]["labels"])
                self.assertNotIn("Grand Theft Auto VI Pre-Load Begins", calls[0][1]["payload"]["title"])
                self.assertEqual(Path("data/news.json").read_text(encoding="utf-8"), original)
            finally:
                os.chdir(before)


if __name__ == "__main__":
    unittest.main()

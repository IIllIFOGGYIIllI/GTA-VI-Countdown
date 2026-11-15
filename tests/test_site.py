"""Static smoke checks for the mobile site and approved-news contract."""
import json
import unittest
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[]
        self.mobile_tabs=[]
        self.headings=[]
        self.in_heading=None
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if attrs.get('id'):
            self.ids.append(attrs['id'])
        if tag=='a' and 'mobile-tab-link' in attrs.get('class','').split():
            self.mobile_tabs.append((attrs.get('href'),attrs.get('data-section')))
        if tag in ('h1','h2','h3','h4','h5','h6'):
            self.in_heading=tag
            self.headings.append('')
    def handle_endtag(self,tag):
        if tag==self.in_heading:
            self.in_heading=None
    def handle_data(self,data):
        if self.in_heading:
            self.headings[-1]+=data

class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html=(ROOT/'index.html').read_text(encoding='utf-8')
        cls.parser=SiteParser()
        cls.parser.feed(cls.html)
    def test_expected_sections_and_controls(self):
        for id_ in ('main','countdown','countdown-panel','timezone','days','hours',
                    'minutes','seconds','news','news-grid','media','gallery-browser',
                    'gallery-modal','app','check-updates','faq','launch-state',
                    'launch-hub','launch-hub-title','count-grid','count-progress',
                    'launch-elapsed','launch-region-name','hero-primary-action'):
            self.assertIn(id_,self.parser.ids)
        self.assertEqual(len(self.parser.ids),len(set(self.parser.ids)),'Duplicate HTML IDs found')
    def test_mobile_tab_links_are_valid(self):
        expected={'countdown','news','media','app'}
        self.assertEqual(len(self.parser.mobile_tabs),4)
        for href,section in self.parser.mobile_tabs:
            self.assertIn(section,expected)
            self.assertEqual(href,'#'+section)
            self.assertIn(section,self.parser.ids)
    def test_no_decorative_heading_periods(self):
        for heading in self.parser.headings:
            self.assertFalse(heading.strip().endswith('.'),heading)
    def test_approved_news_only(self):
        data=json.loads((ROOT/'data/news.json').read_text(encoding='utf-8'))
        self.assertTrue(data['articles'])
        for item in data['articles']:
            self.assertIn(item['category'],{'launch','preload','updates'})
            self.assertTrue(item['url'].startswith(('https://www.rockstargames.com/','https://support.rockstargames.com/')))
    def test_gallery_and_offline_mobile_styles(self):
        gallery=json.loads((ROOT/'data/screenshots.json').read_text(encoding='utf-8'))
        self.assertEqual(len(gallery['items']),138)
        mobile=(ROOT/'assets/mobile-experience.css').read_text(encoding='utf-8')
        self.assertIn('.mobile-tabbar',mobile)
        self.assertIn('.hero-copy{display:contents}',mobile)
        worker=(ROOT/'sw.js').read_text(encoding='utf-8')
        self.assertIn("mobile-experience.css?v=2.3.0",worker)
        self.assertIn("launch-mode.css?v=2.4.0",worker)
        self.assertIn("launch-week.css?v=2.5.0",worker)
        self.assertIn("launch-week-core.js?v=2.5.0",worker)
        self.assertIn("launch-week.js?v=2.8.0",worker)
        self.assertIn("vice-city-countdown-v16",worker)
        self.assertIn("preview/vendor/GrandFireworks.min.js?v=1.11.1",worker)
        self.assertIn("cinematic-launch.css?v=2.7.2",worker)
        self.assertIn("cinematic-launch.js?v=2.7.1",worker)

    def test_official_guide_requires_opt_in(self):
        self.assertIn('id="guide-content" hidden',self.html)
        self.assertIn('id="guide-toggle"',self.html)
        self.assertIn('id="guide-hide"',self.html)
        self.assertIn('id="guide-grid"',self.html)
        self.assertIn('id="guide-search"',self.html)
        self.assertIn("official-guide.css?v=2.8.0",self.html)
        self.assertIn("official-guide.js?v=2.9.0",self.html)
        guide=json.loads((ROOT/'data/official-guide.json').read_text(encoding='utf-8'))
        self.assertEqual(len(guide['items']),19)
        self.assertEqual(len({x['id'] for x in guide['items']}),19)
        self.assertEqual(set(x['category'] for x in guide['items']),{'story','characters','places','world'})
        for entry in guide['items']:
            self.assertTrue(entry['source'].startswith('https://www.rockstargames.com/'))
        news=json.loads((ROOT/'data/news.json').read_text(encoding='utf-8'))
        self.assertEqual(len(news['articles']),11)
        worker=(ROOT/'sw.js').read_text(encoding='utf-8')
        self.assertNotIn("'./data/official-guide.json?v=2.9.0'",worker.split('];',1)[0],
                         'Spoiler archive must not pre-cache before the visitor reveals it')
        self.assertIn('official-guide.css?v=2.8.0',worker)
        self.assertIn('official-guide.js?v=2.9.0',worker)
        self.assertIn('editorial-images.css?v=2.9.0',worker)
        self.assertIn('app.js?v=2.9.0',worker)

    def test_editorial_artwork_uses_verified_rockstar_screenshots(self):
        images=json.loads((ROOT/'data/screenshots.json').read_text(encoding='utf-8'))
        catalogue={x['image']:x for x in images['items']}
        news=json.loads((ROOT/'data/news.json').read_text(encoding='utf-8'))
        guide=json.loads((ROOT/'data/official-guide.json').read_text(encoding='utf-8'))
        self.assertEqual(len(news['articles']),11)
        self.assertEqual(len(guide['items']),19)
        all_urls=[]
        for item in news['articles']:
            image=item['image'].split('?')[0]
            self.assertIn(image,catalogue)
            self.assertEqual(catalogue[image]['category'],'Vice City',
                             'Public Newswire must use neutral scenic thumbnails')
            self.assertIn('imageAlt',item)
            all_urls.append(image)
        for item in guide['items']:
            image=item['image'].split('?')[0]
            self.assertIn(image,catalogue)
            self.assertTrue(item['imageAlt'].startswith('Official Rockstar Games'))
            all_urls.append(image)
        self.assertEqual(len(all_urls),len(set(all_urls)),
                         'Prefer distinct images for distinct cards')
        js=(ROOT/'app.js').read_text(encoding='utf-8')
        info=(ROOT/'assets/official-guide.js').read_text(encoding='utf-8')
        self.assertIn('syncNewsImages',js)
        self.assertIn('newsSpoilersLocked',js)
        self.assertIn("img.loading='lazy'",info)
        self.assertIn('officialScreenshot',info)
        self.assertIn('editorial-images.css?v=2.9.0',self.html)

    def test_launch_panel_starts_hidden_and_is_spoiler_free(self):
        self.assertIn('id="launch-state" hidden',self.html)
        self.assertIn('id="launch-hub" hidden',self.html)
        self.assertIn("GTA VI HAS LAUNCHED",self.html)
        self.assertNotIn("autoplay",self.html.split('id="launch-hub"')[1].split('</section>')[0])
        css=(ROOT/'assets/launch-mode.css').read_text(encoding='utf-8')
        self.assertIn('#launch-hub[hidden]',css)
        self.assertIn('#count-grid[hidden]',css)
        app=(ROOT/'app.js').read_text(encoding='utf-8')
        self.assertIn('updateLaunchMode(launched)',app)
        self.assertIn("currentLaunchMode=null",app)
        self.assertIn("now>=release",app)


    def test_launch_kit_controls_and_privacy(self):
        for id_ in (
            "launch-kit", "launch-eve-banner", "launch-eve-title", "launch-eve-detail",
            "kit-check-items", "kit-check-count", "kit-check-progress",
            "kit-clear-checklist", "kit-download-card", "kit-copy-share",
            "kit-calendar", "kit-platform", "kit-motion", "kit-sounds",
            "kit-strict", "kit-reset-settings", "kit-settings-status"
        ):
            self.assertIn(id_,self.parser.ids)
        assert "Launch kit" in self.html
        js=(ROOT/'assets/launch-week.js').read_text(encoding='utf-8')
        self.assertIn("sounds:false",js)
        self.assertIn("strict:false",js)
        self.assertIn("window.ViceCountdown", (ROOT/'app.js').read_text(encoding='utf-8'))
        self.assertIn("settings.strict",js)
        self.assertIn("media-toggle",js)
        privacy=(ROOT/'privacy.html').read_text(encoding='utf-8')
        self.assertIn("launch checklist",privacy.lower())


if __name__=='__main__':
    unittest.main()

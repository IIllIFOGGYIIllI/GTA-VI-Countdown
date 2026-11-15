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
        self.assertIn("vice-city-countdown-v8",worker)

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


if __name__=='__main__':
    unittest.main()

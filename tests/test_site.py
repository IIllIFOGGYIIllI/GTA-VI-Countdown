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
                    'gallery-modal','app','check-updates','faq'):
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

if __name__=='__main__':
    unittest.main()

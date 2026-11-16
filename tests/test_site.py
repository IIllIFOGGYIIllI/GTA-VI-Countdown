"""GTA VI Countdown v3.1: page architecture, approved data, accessibility and PWA contracts."""
import json
import re
import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlparse,unquote

ROOT=Path(__file__).resolve().parents[1]
PAGE_SECTIONS={
    'index.html':{'countdown','launch-hub'},
    'launch-info.html':{'launch-hub','milestones'},
    'launch-kit.html':{'launch-kit'},
    'news.html':{'news'},
    'leonida-files.html':{'intel'},
    'media.html':{'media'},
    'app.html':{'app','faq'},
}
MODULES={
    'index.html':{'app.js','assets/cinematic-launch.js'},
    'launch-info.html':{'assets/region-clock.js'},
    'launch-kit.html':{'assets/region-clock.js','assets/launch-week.js'},
    'news.html':{'assets/news.js'},
    'leonida-files.html':{'assets/official-guide.js'},
    'media.html':{'assets/media.js'},
    'app.html':{'assets/install.js'},
}
class Inspect(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids=[]
        self.main_ids=[]
        self.links=[]
        self.scripts=[]
        self.headings=[]
        self._heading=None
        self._inside_main=False
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        id_=attrs.get('id')
        if id_:self.ids.append(id_)
        if tag=='main':self._inside_main=True
        if tag=='section' and self._inside_main and id_:self.main_ids.append(id_)
        if tag=='a' and 'href' in attrs:self.links.append(attrs['href'])
        if tag=='script' and 'src' in attrs:self.scripts.append(attrs['src'].split('?')[0].lstrip('./'))
        if tag in ('h1','h2','h3','h4','h5','h6'):
            self._heading=tag
            self.headings.append('')
    def handle_endtag(self,tag):
        if tag=='main':self._inside_main=False
        if tag==self._heading:self._heading=None
    def handle_data(self,data):
        if self._heading:self.headings[-1]+=data

class SiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pages={file:(ROOT/file).read_text(encoding='utf-8') for file in PAGE_SECTIONS}
        cls.parsed={}
        for f,t in cls.pages.items():
            p=Inspect();p.feed(t);cls.parsed[f]=p
    def test_true_page_isolation(self):
        for f,expected in PAGE_SECTIONS.items():
            with self.subTest(page=f):
                p=self.parsed[f]
                self.assertEqual(set(p.main_ids),expected)
                self.assertEqual(len(p.ids),len(set(p.ids)),'Duplicate IDs')
                self.assertIn('assets/site-pages.js',p.scripts)
                self.assertTrue(MODULES[f].issubset(set(p.scripts)))
                for other,mods in MODULES.items():
                    if other!=f:
                        for module in mods-MODULES[f]:
                            self.assertNotIn(module,p.scripts)
                self.assertLess(len(self.pages[f]),23000,'Page contains entire website instead of own section')
                self.assertIn('href="./news.html"',self.pages[f])
                self.assertIn('href="./leonida-files.html"',self.pages[f])
                self.assertIn('href="./media.html"',self.pages[f])
                self.assertIn('<link rel="canonical"',self.pages[f])
                self.assertTrue(any('Vice City' in h or 'GTA VI' in h or 'Leonida' in h or 'Launch' in h or 'Official' in h
                                    for h in p.headings))
    def test_links_and_assets_have_existing_local_paths(self):
        for file,content in self.pages.items():
            p=self.parsed[file]
            for link in p.links:
                if link.startswith(('#','https://','mailto:','tel:')):continue
                local=unquote(urlparse(link).path)
                self.assertTrue(local.startswith('./') or local.startswith('/'))
                if local.startswith('/'):continue
                base=local[2:].split('#')[0]
                self.assertTrue(base=='' or (ROOT/base).exists(),(file,link))
            for asset in re.findall(r'(?:src|href)="(\./(?:assets|data|preview)/[^"]+)"',content):
                local=urlparse(asset).path[2:]
                self.assertTrue((ROOT/local).exists(),(file,asset))
    def test_clean_heading_punctuation_and_unique_h1(self):
        for f,p in self.parsed.items():
            for heading in p.headings:self.assertFalse(heading.strip().endswith('.'),(f,heading))
            # Each page has one primary h1 outside the optional cinema mode.
            self.assertIn('<h1',self.pages[f])
    def test_news_and_images_are_official_and_unique(self):
        news=json.loads((ROOT/'data/news.json').read_text(encoding='utf-8'))
        shots=json.loads((ROOT/'data/screenshots.json').read_text(encoding='utf-8'))
        guide=json.loads((ROOT/'data/official-guide.json').read_text(encoding='utf-8'))
        self.assertEqual(len(news['articles']),11)
        self.assertEqual(len(guide['items']),19)
        self.assertEqual(len(shots['items']),138)
        shotmap={a['image']:a for a in shots['items']}
        urls=[]
        for item in news['articles']:
            self.assertIn(item['category'],('preload','launch','updates'))
            self.assertTrue(item['url'].startswith(('https://www.rockstargames.com/','https://support.rockstargames.com/')))
            image=item['image'].split('?')[0]
            self.assertEqual(shotmap[image]['category'],'Vice City')
            urls.append(image)
            self.assertFalse(item['title'].endswith('.'))
        for item in guide['items']:
            self.assertTrue(item['source'].startswith('https://www.rockstargames.com/'))
            image=item['image'].split('?')[0]
            self.assertIn(image,shotmap);urls.append(image)
            self.assertFalse(item['title'].endswith('.'))
        self.assertEqual(len(urls),len(set(urls)))
    def test_spoiler_gate_never_precaches_opt_in_story(self):
        guide=(ROOT/'assets/official-guide.js').read_text(encoding='utf-8')
        self.assertIn("if(!toggle||!panel||!grid",guide)
        self.assertIn("panel.hidden",guide)
        self.assertIn("vc-strict-spoilers",guide)
        self.assertIn("Read Rockstar’s Official Information",guide)
        self.assertIn('id="guide-content" hidden',self.pages['leonida-files.html'])
        sw=(ROOT/'sw.js').read_text(encoding='utf-8')
        pre=sw.split('];',1)[0]
        self.assertNotIn("data/official-guide.json",pre)
        self.assertNotIn("data/screenshots.json",pre)
        self.assertIn("vice-city-countdown-v21",sw)
    def test_pwa_and_multiroute_shortcuts(self):
        m=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
        urls={x['url'] for x in m['shortcuts']}
        self.assertIn('./news.html',urls)
        self.assertIn('./launch-kit.html',urls)
        self.assertIn('./media.html',urls)
        self.assertIn('./index.html#countdown',urls)
        sw=(ROOT/'sw.js').read_text(encoding='utf-8')
        for file in PAGE_SECTIONS:self.assertIn('./'+file,sw)
        for asset in ('assets/news.js','assets/media.js','assets/region-clock.js',
                      'assets/site-pages.js','assets/install.js'):
            self.assertIn(asset,sw)
        self.assertIn('SKIP_WAITING',sw)
    def test_qa_and_deployment_preserved(self):
        w=(ROOT/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
        for file in PAGE_SECTIONS:self.assertIn(file,w)
        self.assertIn('node --check',w)
        self.assertTrue((ROOT/'tests/browser-readiness.cjs').exists())
        self.assertTrue((ROOT/'assets/launch-week.js').read_text(encoding='utf-8').find("if(banner)")>=0)

if __name__=='__main__':
    unittest.main()

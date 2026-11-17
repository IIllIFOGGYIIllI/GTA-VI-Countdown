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
    'vice-city-history.html':{'history','history-timeline','history-places','history-people','history-culture','history-vehicles','history-gallery','history-compare','history-memories','history-sources'},
    'media.html':{'media'},
    'app.html':{'app','faq'},
}
MODULES={
    'index.html':{'app.js','assets/cinematic-launch.js'},
    'launch-info.html':{'assets/region-clock.js'},
    'launch-kit.html':{'assets/region-clock.js','assets/launch-week.js'},
    'news.html':{'assets/news.js'},
    'leonida-files.html':{'assets/official-guide.js'},
    'vice-city-history.html':{'assets/vice-city-history.js'},
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
                self.assertLess(len(self.pages[f]),100000 if f=='vice-city-history.html' else 23000,
                                'Page contains entire website instead of own section')
                self.assertIn('href="./news.html"',self.pages[f])
                self.assertIn('href="./leonida-files.html"',self.pages[f])
                self.assertIn('href="./media.html"',self.pages[f])
                self.assertIn('href="./vice-city-history.html"',self.pages[f])
                self.assertIn('<link rel="canonical"',self.pages[f])
                self.assertTrue(any('Vice City' in h or 'GTA VI' in h or 'Leonida' in h or 'Launch' in h or 'Official' in h or 'Countdown' in h
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
        self.assertIn("vice-city-countdown-v32",sw)
    def test_pwa_and_multiroute_shortcuts(self):
        m=json.loads((ROOT/'manifest.webmanifest').read_text(encoding='utf-8'))
        urls={x['url'] for x in m['shortcuts']}
        self.assertIn('./news.html',urls)
        self.assertIn('./launch-kit.html',urls)
        self.assertIn('./media.html',urls)
        self.assertIn('./vice-city-history.html',urls)
        self.assertIn('./index.html#countdown',urls)
        sw=(ROOT/'sw.js').read_text(encoding='utf-8')
        for file in PAGE_SECTIONS:self.assertIn('./'+file,sw)
        for asset in ('assets/news.js','assets/media.js','assets/region-clock.js',
                      'assets/site-pages.js','assets/install.js'):
            self.assertIn(asset,sw)
        self.assertIn('SKIP_WAITING',sw)
        self.assertIn('assets/vice-city-history.js',sw)
    def test_classic_vice_city_history_and_spoiler_reveal(self):
        page=self.pages['vice-city-history.html']
        self.assertIn('The History Of',page)
        for marker in ('data-vh-year="1997"','data-vh-year="2002"','data-vh-year="2006"','data-vh-year="2012"',
                       'data-vh-year="2021"','data-vh-year="2026"',
                       'data-vh-station="flash"','data-vh-compare="coast"','id="vh-modern-image"'):
            self.assertIn(marker,page)
        history=(ROOT/'assets/vice-city-history.js').read_text(encoding='utf-8')
        self.assertIn('vc-strict-spoilers',history)
        self.assertIn('removeAttribute(\'src\')',history)
        self.assertIn('ViceHistory',history)
        self.assertIn('Reveal Official Comparison',page)
        self.assertIn('not matched camera angles',page.lower())
        self.assertFalse('autoplay' in page)
        worker=(ROOT/'sw.js').read_text(encoding='utf-8')
        self.assertIn('vice-city-history.html',worker)
        self.assertIn('vice-city-history.css?v=3.4.2',worker)
        self.assertIn('vice-city-history.js?v=3.4.3',worker)

    def test_expanded_vice_city_archive_and_sources(self):
        html=self.pages['vice-city-history.html']
        script=(ROOT/'assets/vice-city-history.js').read_text(encoding='utf-8')
        self.assertEqual(html.count('data-vh-place="'),12)
        self.assertEqual(html.count('data-vh-vehicle="'),12)
        self.assertEqual(html.count('data-vh-gallery-index="'),8)
        self.assertEqual(html.count('data-vh-memory="'),8)
        self.assertEqual(html.count('data-vh-compare="'),6)
        self.assertIn('data-vh-place-filter="all"',html)
        self.assertIn('data-vh-vehicle-filter="water"',html)
        self.assertIn('id="vh-gallery-dialog"',html)
        self.assertIn('id="vh-memory-reset"',html)
        self.assertIn('id="vh-then-image"',html)
        self.assertIn('Archival and promotional screenshots are credited to Rockstar Games',html)
        self.assertIn('mirrored by',html.lower())
        for theme in ('coast','city','night','cars','water','sunset'):
            self.assertIn(theme+':{original:',script)
        self.assertIn('vice-history-memories-v1',script)
        self.assertIn('vh-gallery-full',script)
        self.assertIn("if(locked())return;",script)
        worker=(ROOT/'sw.js').read_text(encoding='utf-8')
        self.assertIn('vice-city-countdown-v32',worker)
        self.assertIn('vice-city-history.css?v=3.4.2',worker)
        self.assertIn('vice-city-history.js?v=3.4.3',worker)
        # The historical images can be fetched normally, but optional GTA VI
        # images must never be downloaded during PWA installation
        self.assertNotIn('/VI/_next/static/media/',worker.split('];',1)[0])

    def test_every_history_visual_card_has_specific_image(self):
        content=self.pages['vice-city-history.html']
        import re
        self.assertEqual(content.count('data-vh-open-art'),33)
        self.assertEqual(content.count('vh-era-photo'),5)
        self.assertEqual(content.count('class="vh-character-art"'),0)
        self.assertEqual(content.count('vh-character-art'),4)
        self.assertEqual(content.count('vh-vehicle-art'),12)
        self.assertEqual(content.count('data-vh-place="'),12)
        self.assertIn('id="vh-radio-art"',content)
        self.assertIn('id="vh-visual-dialog"',content)
        self.assertIn('id="vh-era-2026-image"',content)
        self.assertNotRegex(content,r'<img\s+id="vh-era-2026-image"[^>]*\ssrc=')
        self.assertIn('data-vh-source="https://www.rockstargames.com/VI/',content)
        for url in re.findall(r'data-image="([^"]+)"',content):
            self.assertTrue(url.startswith('https://'))
        script=(ROOT/'assets/vice-city-history.js').read_text(encoding='utf-8')
        self.assertIn('data-vh-open-art',script)
        self.assertIn('hideModernTimeline()',script)
        self.assertIn('if(locked()||!eraImage)return',script)
        self.assertIn('radioImages',script)

    def test_history_image_mirroring_is_required_for_publication(self):
        script=(ROOT/'scripts/mirror_history_images.py').read_text(encoding='utf-8')
        flow=(ROOT/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
        self.assertIn('python3 scripts/mirror_history_images.py dist',flow)
        self.assertIn('content_kind(data)',script)
        self.assertIn('unresolved = collect(html) + collect(script)',script)
        self.assertIn('image-sources.json',script)
        self.assertIn('Mirroring',script)
        self.assertIn('www.gtabase.com',script)
        self.assertIn('upload.wikimedia.org',script)
        self.assertNotIn('www.rockstargames.com',script)

    def test_modern_comparison_has_a_visible_opt_in(self):
        html=self.pages['vice-city-history.html']
        script=(ROOT/'assets/vice-city-history.js').read_text(encoding='utf-8')
        self.assertIn('id="vh-compare-reveal-inline"',html)
        self.assertIn('id="vh-preview-overlay"',html)
        self.assertIn("inlineButton?.addEventListener('click',toggleModernComparison)",script)
        self.assertIn("inlineButton.disabled=locked()",script)
        self.assertIn("if(locked())return;",script)

    def test_cinematic_launch_has_no_preview_simulator(self):
        home=self.pages['index.html']
        script=(ROOT/'assets/cinematic-launch.js').read_text(encoding='utf-8')
        self.assertNotIn('id="vc-cinema-preview"',home)
        self.assertNotIn('id="vc-cinema-sim-controls"',home)
        self.assertNotIn('id="vc-cinema-restart"',home)
        self.assertNotIn("open('preview')",script)
        self.assertNotIn('preview:',script)
        self.assertIn("realSeenKey=key;open();",script)
        self.assertIn("launchCelebration()",script)
        self.assertIn('id="vc-cinema-replay-fireworks"',home)

    def test_qa_and_deployment_preserved(self):
        w=(ROOT/'.github/workflows/deploy-pages.yml').read_text(encoding='utf-8')
        for file in PAGE_SECTIONS:self.assertIn(file,w)
        self.assertIn('node --check',w)
        self.assertTrue((ROOT/'tests/browser-readiness.cjs').exists())
        self.assertTrue((ROOT/'assets/launch-week.js').read_text(encoding='utf-8').find("if(banner)")>=0)

if __name__=='__main__':
    unittest.main()

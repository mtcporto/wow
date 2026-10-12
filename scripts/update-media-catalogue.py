"""Refresh public WoW media metadata; no API credentials are needed."""
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.parse import urlparse
import json

class GalleryParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.items = {}
        self.item = None
        self.heading = False
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        href = attrs.get('href', '')
        if tag == 'a' and href.startswith('/media/') and attrs.get('slot') == 'gallery-items':
            self.item = {'path': href, 'title': '', 'image': ''}
        if self.item and tag == 'blz-image':
            image = attrs.get('src', '')
            if urlparse(image).hostname in ('blz-contentstack-images.akamaized.net', 'bnetcmsus-a.akamaihd.net'):
                self.item['image'] = image
        if self.item and tag == 'div' and attrs.get('slot') == 'heading':
            self.heading = True
    def handle_data(self, value):
        if self.item and self.heading:
            self.item['title'] += value
    def handle_endtag(self, tag):
        if tag == 'div':
            self.heading = False
        if tag == 'a' and self.item:
            kind = self.item['path'].split('/')[2]
            if kind in ('video', 'comic', 'short-story', 'book', 'audio') and self.item['title'].strip():
                self.items[self.item['path']] = {**self.item, 'type': kind, 'title': self.item['title'].strip()}
            self.item = None

def gallery(locale):
    url = 'https://worldofwarcraft.blizzard.com/' + locale + '/media'
    with urlopen(Request(url, headers={'User-Agent': 'AzerothExplorer/1.0'}), timeout=30) as response:
        html = response.read().decode('utf-8')
    parser = GalleryParser()
    parser.feed(html)
    if not parser.items:
        raise RuntimeError('Official media gallery returned no entries; previous catalogue was preserved.')
    return parser.items

english = gallery('en-us')
try:
    portuguese = gallery('pt-br')
except Exception:
    portuguese = {}
    print('Portuguese gallery unavailable; preserving English titles as fallback.')
items = []
for path, item in english.items():
    localized = portuguese.get(path)
    items.append({'path': path, 'type': item['type'], 'image': item['image'],
                  'titles': {'en_US': item['title'], **({'pt_BR': localized['title']} if localized else {})},
                  'locales': ['en-us'] + (['pt-br'] if localized else [])})
destination = Path(__file__).resolve().parent.parent / 'data/media.json'
temporary = destination.with_suffix('.json.tmp')
temporary.write_text(json.dumps({'updatedAt': datetime.now(timezone.utc).isoformat(),
                                'source': 'https://worldofwarcraft.blizzard.com/en-us/media',
                                'items': items}, ensure_ascii=False, separators=(',', ':')) + '\n')
temporary.replace(destination)
print(f'Official media catalogue saved: {len(items)} entries, {sum("pt_BR" in i["titles"] for i in items)} localized titles.')

"""Build the static website from src. Run with: python build.py"""
from html import escape
import json
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / 'src'
OUTPUT = ROOT / 'dist'
SCRIPT_ORDER = ('shared', 'lessons', 'quiz', 'spelling', 'matching-game', 'voice-studio', 'agent-tools')


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def render(template, **values):
    """Replace named placeholders without interpreting HTML or JS braces."""
    text = (SOURCE / 'templates' / template).read_text(encoding='utf-8')

    def replace(match):
        key = match[1]
        if key not in values:
            raise ValueError(f'Missing {{{{{key}}}}} in {template}')
        return str(values[key])

    return re.sub(r'\{\{([a-z_]+)\}\}', replace, text)


def load_lessons(site):
    lessons = {}
    used_ids = set()
    for topic in site['topics']:
        slug = topic['slug']
        if not re.fullmatch(r'[a-z0-9-]+', slug):
            raise ValueError(f'Invalid topic slug: {slug}')
        path = SOURCE / 'content' / 'lessons' / f'{slug}.json'
        if not path.exists():
            continue
        lesson = read_json(path)
        for item in lesson['items']:
            for field in ('id', 'text', 'label', 'note'):
                if not isinstance(item.get(field), str):
                    raise ValueError(f'{path.name}: item needs a string {field}')
            if item['id'] in used_ids:
                raise ValueError(f'Duplicate lesson ID: {item["id"]}')
            used_ids.add(item['id'])
        if not lesson['items']:
            raise ValueError(f'{path.name}: lesson must contain items')
        lessons[slug] = lesson
    # Item detail pages are lessons too, so search, playback and Voice Studio
    # work on their examples without a separate JavaScript implementation.
    for parent_slug, lesson in list(lessons.items()):
        for item in lesson['items']:
            detail = item.get('detail')
            if not detail:
                continue
            slug = detail['slug']
            if not re.fullmatch(r'[a-z0-9-]+', slug) or slug in lessons or slug in site['pages']:
                raise ValueError(f'Invalid or duplicate detail page slug: {slug}')
            if not detail['items']:
                raise ValueError(f'{slug}: detail page must contain examples')
            for example in detail['items']:
                for field in ('id', 'text', 'label', 'note'):
                    if not isinstance(example.get(field), str):
                        raise ValueError(f'{slug}: example needs a string {field}')
                if example['id'] in used_ids:
                    raise ValueError(f'Duplicate lesson ID: {example["id"]}')
                used_ids.add(example['id'])
            lessons[slug] = {**detail, 'parent': parent_slug, 'glyph': item['text'], 'label': item['label']}
    return lessons


def navigation(topics, current):
    links = []
    for topic in [{'slug': 'index', 'title': 'Home'}, *topics]:
        slug = topic['slug']
        active = ' aria-current="page"' if slug == current else ''
        links.append(f'      <a href="{slug}.html" data-nav="{slug}"{active}>{escape(topic["title"])}</a>')
    return '\n'.join(links)


def topic_cards(topics):
    return '\n'.join(
        render('topic-card.html', slug=topic['slug'], title=escape(topic['title']),
               search=escape(topic['title'].lower(), quote=True),
               description=escape(topic['description']), glyph=escape(topic['glyph']),
               position=f'{index:02}', total=f'{len(topics):02}')
        for index, topic in enumerate(topics, 1)
    )


def build():
    site = read_json(SOURCE / 'content' / 'site.json')
    lessons = load_lessons(site)
    OUTPUT.mkdir(exist_ok=True)
    pages = dict(site['pages'])
    pages.update({slug: lesson['title'] for slug, lesson in lessons.items()})
    for slug, title in pages.items():
        if not re.fullmatch(r'[a-z0-9-]+', slug):
            raise ValueError(f'Invalid page slug: {slug}')
        extra = SOURCE / 'templates' / 'pages' / f'{slug}.html'
        if slug in lessons:
            lesson = lessons[slug]
            if 'parent' in lesson:
                body = render('consonant-detail.html', title=escape(title), intro=escape(lesson['intro']),
                              glyph=escape(lesson['glyph']), parent_slug=lesson['parent'],
                              parent_title=escape(lessons[lesson['parent']]['title']),
                              eyebrow={'medial-clusters': 'MEDIAL CLUSTER', 'vowels': 'VOWEL'}.get(lesson['parent'], 'FINAL CONSONANT'),
                              reading_tip={
                                  'medial-clusters': 'Read the initial consonant and medial together, then add the vowel. The Roman labels guide the sounds; these examples focus on spelling.',
                                  'vowels': 'Read the initial letter together with the vowel signs. The Roman labels guide the sounds; these examples focus on spelling.'
                              }.get(lesson['parent'], 'Read each syllable from the initial letter to the final consonant. The Roman labels guide the sounds; these examples focus on spelling.'))
            else:
                body = render('lesson.html', title=escape(title), intro=lesson['intro'],
                              extra=extra.read_text(encoding='utf-8') if extra.exists() else '')
        else:
            body = render(f'pages/{slug}.html', topic_cards=topic_cards(site['topics']))
        html = render('layout.html', slug=slug, title=escape(title), body=body,
                      site_name=escape(site['name']), wordmark=escape(site['wordmark']),
                      description=escape(site['description'], quote=True),
                      navigation=navigation(site['topics'], lessons.get(slug, {}).get('parent', slug)))
        (OUTPUT / f'{slug}.html').write_text(html, encoding='utf-8')

    data = {slug: lesson['items'] for slug, lesson in lessons.items()}
    (OUTPUT / 'lessons.js').write_text(
        '// Generated from src/content/lessons/. Edit source JSON, then rebuild.\n'
        'window.SHAN_LESSONS = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n'
        'window.SHAN_SPELLING_CONFIG = ' + json.dumps(read_json(SOURCE / 'content' / 'spelling.json'), ensure_ascii=False) + ';\n', encoding='utf-8')
    scripts = []
    for name in SCRIPT_ORDER:
        path = SOURCE / 'assets' / 'js' / f'{name}.js'
        scripts.append(f'// --- src/{path.relative_to(SOURCE).as_posix()} ---\n' + path.read_text(encoding='utf-8'))
    (OUTPUT / 'app.js').write_text('\n\n'.join(scripts), encoding='utf-8')
    for name in ('styles.css', 'favicon.svg'):
        shutil.copyfile(SOURCE / 'assets' / name, OUTPUT / name)
    # Published recordings belong to the teacher; never replace them on rebuild.
    voices = OUTPUT / 'voices.js'
    if not voices.exists():
        voices.write_text('window.SHAN_VOICES = {};\n', encoding='utf-8')
    print(f'Built {len(pages)} pages and {len(lessons)} lessons in {OUTPUT}')


if __name__ == '__main__':
    build()

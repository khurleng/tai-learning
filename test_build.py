"""Regression checks for rebuild safety and the editable-source workflow."""
from contextlib import redirect_stdout
from io import StringIO
from pathlib import Path
import json
import shutil
import tempfile
import unittest
from unittest.mock import patch

import build


class BuildTests(unittest.TestCase):
    def test_rebuild_preserves_recordings_and_is_reproducible(self):
        with tempfile.TemporaryDirectory() as folder:
            output = Path(folder)
            recordings = b'// Teacher recordings\nwindow.SHAN_VOICES={"alphabet-0":"data:audio/wav;base64,YQ=="};\n'
            (output / 'voices.js').write_bytes(recordings)
            with patch.object(build, 'OUTPUT', output), redirect_stdout(StringIO()):
                build.build()
                first = {path.name: path.read_bytes() for path in output.iterdir()}
                build.build()
                second = {path.name: path.read_bytes() for path in output.iterdir()}
            self.assertEqual(first, second)
            self.assertEqual((output / 'voices.js').read_bytes(), recordings)
            html = (output / 'final-consonants.html').read_text(encoding='utf-8')
            self.assertIn('data-nav="final-consonants" aria-current="page"', html)
            self.assertNotIn('{{', html)
            self.assertEqual(len(list(output.glob('*.html'))), 25)
            for slug in ('final-m', 'final-n', 'final-ng', 'final-p', 'final-t', 'final-k', 'final-ny', 'final-ai', 'final-w'):
                detail = (output / f'{slug}.html').read_text(encoding='utf-8')
                self.assertIn('Syllable examples', detail)
                parent = 'vowels' if slug == 'final-ai' else 'final-consonants'
                self.assertIn(f'href="{parent}.html"', detail)
                self.assertIn(f'data-nav="{parent}" aria-current="page"', detail)
                self.assertNotIn('{{', detail)

    def test_new_lesson_appears_without_new_page_template(self):
        with tempfile.TemporaryDirectory() as folder:
            source = Path(folder) / 'src'
            output = Path(folder) / 'dist'
            shutil.copytree(build.SOURCE, source)
            site_path = source / 'content/site.json'
            site = build.read_json(site_path)
            site['topics'].append({'slug': 'new-lesson', 'title': 'New Lesson', 'description': 'Try it', 'glyph': 'ၵ'})
            site_path.write_text(json.dumps(site), encoding='utf-8')
            lesson = {'title': 'New Lesson', 'intro': 'New introduction', 'items': [
                {'id': 'new-lesson-0', 'text': 'ၵ', 'label': 'ka', 'note': 'Example'}
            ]}
            (source / 'content/lessons/new-lesson.json').write_text(json.dumps(lesson), encoding='utf-8')
            with patch.object(build, 'OUTPUT', output), patch.object(build, 'SOURCE', source), redirect_stdout(StringIO()):
                build.build()
            self.assertTrue((output / 'new-lesson.html').exists())
            self.assertIn('new-lesson.html', (output / 'index.html').read_text(encoding='utf-8'))
            self.assertTrue((output / 'voices.js').exists())


if __name__ == '__main__':
    unittest.main()

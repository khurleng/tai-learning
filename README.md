# Tai Learning — Shan Language Learning

A static HTML/CSS/JavaScript website. No database, backend, account, or build dependency is required.

## Open and host

Open `dist/index.html` in a browser. Upload the **contents** of `dist/` to your website's public folder. Keep all files together. The homepage is `index.html`.

For microphone recording, serve the folder over HTTPS or localhost. Uploading prepared recordings and normal playback work without microphone access.

## Publish on GitHub Pages

Use this project folder (the one containing `build.py`, `src/`, `dist/` and `.github/`) as your repository root.

1. Use the GitHub repository `khurleng/tai-learning`. A public repository can use GitHub Pages on the free plan.
2. Upload or push the project, including `.github/workflows/pages.yml`, to the `main` branch. Keep `dist/voices.js` in the repository so published recordings are included.
3. In the repository, open **Settings → Pages**, then set **Source** to **GitHub Actions**.
4. Open **Actions → Deploy Tai Learning → Run workflow**. Future pushes to `main` rebuild, test and publish automatically.
5. When deployment succeeds, open the website link in **Settings → Pages**: `https://khurleng.github.io/tai-learning/`.

The workflow builds from source and publishes only `dist/`. Links are relative, so the repository subpath works without configuration. Voice Studio works over the live HTTPS address; recordings stay as browser drafts until you export and commit the updated `dist/voices.js`. Other visitors see published recordings after deployment.

Official instructions: [GitHub Pages custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Add your own human voice

1. Open `dist/voice-studio.html` in your browser.
2. Choose a lesson and click **Add file** beside each matching letter, vowel, tone, digit, or expression. Or click **Record**.
3. Use **Listen** to check each clip.
4. Click **Save voices.js**. Your audio is embedded in the downloaded JavaScript file as data URLs.
5. Replace the project's `dist/voices.js` with that downloaded file.
6. Upload the updated website files (or replace just `voices.js` on your existing server). If you hear old clips, refresh without cache.

The public pages play only this published file. No computer-generated voice is used. Your own recordings have not been supplied with this starter. Missing recordings are labeled. Draft recordings in Voice Studio are local to the browser and can be lost; always export the file.

Visitors cannot modify server files. The studio is a local editing tool, not an authenticated admin panel. You may omit `voice-studio.html` when uploading the public site and keep it on your computer.

`voices.js` contains your audio, so website visitors can download it, like any public website sound. Do not put private recordings in it.

## Pages

- `index.html`: topic selection and search
- `alphabet.html`: 19 common consonants
- `vowels.html`: 12 vowel entries, including clickable vowel combinations
- `final-consonants.html`: eight final consonant and vowel-ending entries, search and audio controls
- `final-m.html`, `final-n.html`, `final-ng.html`, `final-p.html`, `final-t.html`, `final-k.html`: letter details and syllable examples
- `final-ny.html`: final glide spelling examples
- `final-ai.html`, `vowel-aue.html`: vowel combination examples linked from Vowels
- `final-w.html`: ဝ် vowel endings with five spelling examples
- `medial-clusters.html`: clickable medial -w-, -y- and -r- signs; examples on `medial-wa.html`, `medial-ya.html` and `medial-ra.html`
- `tone.html`: six tone patterns
- `number.html`: digits and number conversion
- `practicing.html`: How to Spell syllable practice and ten-question character rounds
- `conversation.html`: greeting, gratitude, and a short exchange
- `drag-and-drop.html`: five-letter matching game; supports dragging, tapping and keyboard
- `voice-studio.html`: upload, microphone, preview, import and export
- `sources.html`: content references and font/audio notes

## Customize

Edit files in `src/`, then run `python build.py` from this folder. Python's standard library is enough; no packages or Node build tools are required. The command also works from another directory when given the path to `build.py`.

| What to edit | Source file |
| --- | --- |
| Letters, vowels, labels and notes | `src/content/lessons/<topic>.json` |
| Homepage cards and navigation order | `src/content/site.json` → `topics` |
| Site name and wordmark | `src/content/site.json` |
| Shared header, footer, fonts and script links | `src/templates/layout.html` |
| Shared lesson layout and controls | `src/templates/lesson.html` |
| Homepage topic card layout | `src/templates/topic-card.html` |
| Homepage, quiz, game, studio and references markup | `src/templates/pages/<page>.html` |
| Colors, sizes, spacing and responsive layout | `src/assets/styles.css` |
| Lesson search, cards and playback controls | `src/assets/js/lessons.js` |
| Shared helpers, menu and audio playback | `src/assets/js/shared.js` |
| Quiz behavior | `src/assets/js/quiz.js` |
| Matching game behavior | `src/assets/js/matching-game.js` |
| Teacher recordings and audio import/export | `src/assets/js/voice-studio.js` |
| Optional browser-agent tools | `src/assets/js/agent-tools.js` |

`dist/` is the generated website to open or upload. Rebuilding replaces its HTML, styles, lesson data and app code. **It preserves `dist/voices.js`**, including your published recordings; only a missing voices file is initialized. Export recordings from Voice Studio into that file as before.

### How to Spell recordings

Practicing includes random syllables using all alphabet letters, open and closed vowel spellings, six final consonants and tone marks. Edit `src/content/spelling.json` to change the spelling sets. The activity includes answer checking, reveal, filters and a recordings-only mode. Checked endings use four marked tones. Exercises practise spelling and are not a vocabulary list.

In Voice Studio, choose **How To Spell**, search for a complete syllable such as `မိူၼ်ႈ`, and use **Add file** or **Record** for its pronunciation. Each syllable has a stable recording ID derived from its Unicode characters. Save `voices.js` and replace `dist/voices.js` to publish the audio. The studio shows 40 matching recordings per page. Existing recordings are preserved on rebuild.

For final-consonant practice, choose **Final consonants only** under Ending. The parts group the vowel and ending together, for example `သ + ိူၼ် + ႈ = သိူၼ်ႈ`. Voice Studio has a **How to Spell — Final Consonants** section for recording these syllables; it shares the same recordings as How To Spell.

### Edit a lesson

Each lesson JSON contains `title`, `intro`, and an `items` array. Each item has `id`, `text`, `label`, and `note`. Keep existing IDs unchanged so recordings continue to match. IDs must be unique across all lessons. The build reports invalid or duplicate IDs. The introduction supports HTML, such as a `<span lang="shn">` around Shan text; item text and labels render as plain text.

For Final Consonants, edit `src/content/lessons/final-consonants.json`, save, then run:

```powershell
python build.py
```

Each final consonant item has a `detail` object containing its page `slug`, `title`, `intro`, and example `items`. Edit these to change the individual consonant pages. Existing letter IDs stay the same; examples have their own recording IDs. The build creates the detail pages automatically using `src/templates/consonant-detail.html` and includes the examples in Voice Studio. Letters and “View examples” links open those pages.

### Add a lesson page

1. Create `src/content/lessons/your-topic.json` using an existing lesson as an example. Give every item a new ID.
2. Add its `slug`, `title`, `description`, and `glyph` to `topics` in `src/content/site.json`. The slug must match the JSON filename, without `.json`.
3. Run `python build.py`. The page, homepage card, navigation link, and Voice Studio lesson are generated automatically.

Optional extra content below the lesson cards goes in `src/templates/pages/your-topic.html`. To add a custom page instead, create its page template and add its slug and title to `site.json` → `pages`. Add it to `topics` if it should appear in navigation and on the homepage.

Templates use `{{name}}` placeholders supplied by `build.py`. Feature scripts share helpers and are combined into `dist/app.js` in the explicit `SCRIPT_ORDER` in the build script. Add new script files to that list when needed. The site keeps classic scripts so opening `dist/index.html` directly still works.

All Shan text uses Panglong/Shan when installed and Padauk from Google Fonts as the web fallback. The Google font needs internet; a system font is the fallback.

### Verify changes

```powershell
python test_build.py
node verify.cjs
```

The build tests check recording preservation, reproducible output and adding a lesson. The JavaScript checks cover lesson filtering, quiz scoring, matching and audio mapping validation. Open `dist/index.html` to review the result, then upload the contents of `dist/`.

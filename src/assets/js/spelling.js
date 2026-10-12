// Stable syllable IDs let the teacher record every generated spelling exercise.
const spellingConfig = window.SHAN_SPELLING_CONFIG;
const spellingItems = [];
function spellingId(text) {
  return 'spell-' + Array.from(text, c => c.codePointAt(0).toString(16)).join('-');
}
if (spellingConfig) {
  for (const initial of lessons.alphabet) {
    for (const final of ['', ...spellingConfig.finals]) {
      const vowels = final ? spellingConfig.closedVowels : spellingConfig.openVowels;
      const tones = ['ပ်', 'တ်', 'ၵ်'].includes(final) ? spellingConfig.checkedTones : spellingConfig.tones;
      for (const vowel of vowels) for (const tone of tones) {
        const text = initial.text + vowel + final + tone;
        spellingItems.push({id: spellingId(text), text, initial: initial.text, vowel, final, tone,
          label: [initial.text, final ? vowel + final : vowel, tone || '(no tone mark)'].join(' + '),
          note: 'How to Spell: record the complete syllable.'});
      }
    }
  }
  lessons['how-to-spell'] = spellingItems;
}
let currentSpelling = null;
function spellingOption(select, value, label) {
  const option = document.createElement('option');
  option.value = value;
  option.textContent = label;
  select.append(option);
}
function updateSpellingVowels() {
  const selected = $('spellVowel').value;
  const ending = $('spellFinal').value;
  const vowels = ending === 'all' ? [...new Set([...spellingConfig.openVowels, ...spellingConfig.closedVowels])]
    : ending ? spellingConfig.closedVowels : spellingConfig.openVowels;
  $('spellVowel').replaceChildren();
  spellingOption($('spellVowel'), 'all', 'Random vowel');
  for (const vowel of vowels) spellingOption($('spellVowel'), vowel, vowel || 'Inherent a (no sign)');
  $('spellVowel').value = vowels.includes(selected) ? selected : 'all';
  const tone = $('spellTone').value;
  const tones = ['ပ်', 'တ်', 'ၵ်'].includes(ending) ? spellingConfig.checkedTones : spellingConfig.tones;
  $('spellTone').replaceChildren();
  spellingOption($('spellTone'), 'all', 'Random tone');
  for (const mark of tones) spellingOption($('spellTone'), mark, mark || 'No tone mark');
  $('spellTone').value = tones.includes(tone) ? tone : 'all';
}
function showSpelling(item) {
  stopAudio();
  currentSpelling = item;
  $('spellAnswer').value = '';
  $('spellFeedback').textContent = '';
  $('spellResult').hidden = true;
  $('spellReveal').disabled = !item;
  $('spellListen').disabled = !item || !voices[item.id];
  $('spellParts').replaceChildren();
  if (!item) {
    $('spellAudioState').textContent = 'No syllables match these choices. Change a filter or turn off recordings only.';
    return;
  }
  const parts = [['Alphabet', item.initial],
    [item.final ? 'Vowel + final consonant' : 'Vowel', item.vowel + item.final]];
  parts.push(['Tone', item.tone || 'No mark']);
  for (const [label, text] of parts) {
    if ($('spellParts').children.length) {
      const plus = document.createElement('span');
      plus.className = 'spelling-plus'; plus.textContent = '+';
      $('spellParts').append(plus);
    }
    const part = document.createElement('div'); part.className = 'spelling-part';
    const name = document.createElement('span'); name.textContent = label;
    const glyph = document.createElement('span'); glyph.className = 'shan'; glyph.lang = 'shn'; glyph.textContent = text;
    part.append(name, glyph); $('spellParts').append(part);
  }
  $('spellSyllable').textContent = item.text;
  $('spellReading').textContent = item.label + ' = ' + item.text;
  $('spellAudioState').textContent = voices[item.id] ? 'Teacher recording available.'
    : 'Recording not added yet. Add this syllable in Voice Studio → ' + (item.final ? 'How to Spell — Final Consonants.' : 'How to Spell.');
}
function nextSpelling() {
  const pool = spellingItems.filter(item =>
    (!$('spellInitial').value || item.initial === $('spellInitial').value) &&
    ($('spellFinal').value === 'all' || ($('spellFinal').value === 'finals' ? Boolean(item.final) : item.final === $('spellFinal').value)) &&
    ($('spellVowel').value === 'all' || item.vowel === $('spellVowel').value) &&
    ($('spellTone').value === 'all' || item.tone === $('spellTone').value) &&
    (!$('spellRecorded').checked || voices[item.id]));
  const alternatives = pool.filter(item => item !== currentSpelling);
  const choices = alternatives.length ? alternatives : pool;
  showSpelling(choices[Math.floor(Math.random() * choices.length)] || null);
}
function spellingExample(text, ending = 'all') {
  const item = spellingItems.find(item => item.text === text);
  $('spellRecorded').checked = false;
  $('spellInitial').value = '';
  $('spellFinal').value = ending;
  updateSpellingVowels();
  $('spellVowel').value = 'all';
  $('spellTone').value = 'all';
  showSpelling(item);
}
if (page === 'practicing' && spellingConfig) {
  for (const initial of lessons.alphabet) spellingOption($('spellInitial'), initial.text, initial.text + ' · ' + initial.label);
  for (const final of spellingConfig.finals) spellingOption($('spellFinal'), final, final);
  updateSpellingVowels();
  for (const id of ['spellInitial', 'spellVowel', 'spellTone', 'spellRecorded']) $(id).onchange = nextSpelling;
  $('spellFinal').onchange = () => { updateSpellingVowels(); nextSpelling(); };
  $('spellNext').onclick = nextSpelling;
  $('spellReveal').onclick = () => { if (currentSpelling) $('spellResult').hidden = false; };
  $('spellListen').onclick = () => { if (currentSpelling) playClip(currentSpelling.id); };
  $('spellStop').onclick = () => { stopAudio(); status('Playback stopped.'); };
  $('spellForm').onsubmit = event => {
    event.preventDefault();
    if (!currentSpelling) return;
    const answer = $('spellAnswer').value.trim().normalize('NFC');
    if (!answer) { $('spellFeedback').textContent = 'Type the joined syllable, or choose Show syllable.'; return; }
    const correct = answer === currentSpelling.text.normalize('NFC');
    $('spellFeedback').textContent = correct ? 'Correct! Read it aloud and listen to check.' : 'Try again. Join the parts in the order shown, or choose Show syllable.';
    if (correct) $('spellResult').hidden = false;
  };
  $('spellExampleKi').onclick = () => spellingExample('ၵီႈ');
  $('spellExampleMoe').onclick = () => spellingExample('မိူၼ်ႈ', 'finals');
  $('spellExampleSoe').onclick = () => spellingExample('သိူၼ်ႈ', 'finals');
  spellingExample('ၵီႈ');
}

// --- src/assets/js/shared.js ---
// Shared DOM helpers, navigation and audio playback used by every feature.
'use strict';

const $ = id => document.getElementById(id);
const page = document.body.dataset.page;
const lessons = window.SHAN_LESSONS;
const voices = window.SHAN_VOICES || {};
const status = message => { $('status').textContent = message; };

const speaker = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="m11 5-5 4H3v6h3l5 4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';

function button(label, onClick, style = 'secondary') {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = style;
  element.textContent = label;
  element.onclick = onClick;
  return element;
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const nav = document.querySelector(`[data-nav="${page}"]`);
if (nav) nav.setAttribute('aria-current', 'page');
document.querySelector('.menu-button').onclick = event => {
  const open = $('navigation').classList.toggle('open');
  event.currentTarget.setAttribute('aria-expanded', String(open));
};

let audio = null;
let audioFinish = null;
let playToken = 0;

function stopAudio() {
  playToken++;
  if (audio) {
    audio.pause();
    audio = null;
  }
  if (audioFinish) {
    audioFinish();
    audioFinish = null;
  }
  document.querySelectorAll('.playing').forEach(card => card.classList.remove('playing'));
}

function playClip(id, data = voices) {
  stopAudio();
  if (!data[id]) {
    status('No human recording has been added for this sound yet.');
    return Promise.resolve(false);
  }
  return new Promise(resolve => {
    const card = document.querySelector(`[data-clip="${id}"]`);
    card?.classList.add('playing');
    let done = false;
    const finish = ok => {
      if (done) return;
      done = true;
      card?.classList.remove('playing');
      audioFinish = null;
      resolve(ok);
    };
    audioFinish = () => finish(false);
    audio = new Audio(data[id]);
    audio.onended = () => finish(true);
    audio.onerror = () => {
      status('This sound could not play. Please check the audio file.');
      finish(false);
    };
    status('');
    audio.play().catch(() => {
      status('Playback could not start. Tap a sound button to try again.');
      finish(false);
    });
  });
}

window.addEventListener('pagehide', stopAudio);


// --- src/assets/js/lessons.js ---
// Homepage filtering and shared lesson cards, search and playback controls.
if (page === 'index') {
  $('topicSearch').oninput = () => {
    const query = $('topicSearch').value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('[data-topic]').forEach(card => {
      card.hidden = !card.dataset.topic.includes(query);
      if (!card.hidden) visible++;
    });
    $('noTopics').hidden = visible > 0;
  };
}

function renderLesson() {
  const query = $('lessonSearch').value.trim().toLowerCase();
  const items = lessons[page].filter(item =>
    (item.text + ' ' + item.label + ' ' + item.note).toLowerCase().includes(query)
  );
  $('lessonGrid').replaceChildren();

  for (const item of items) {
    const card = document.createElement('article');
    card.className = 'lesson-card';
    card.dataset.clip = item.id;

    const glyph = document.createElement(item.detail ? 'a' : 'div');
    glyph.className = 'shan glyph';
    glyph.lang = 'shn';
    glyph.textContent = item.text;
    if (item.detail) {
      glyph.href = item.detail.slug + '.html';
      glyph.className += ' lesson-glyph-link';
      glyph.setAttribute('aria-label', 'View examples for ' + item.label);
    }

    const note = document.createElement('p');
    note.className = 'note';
    note.textContent = item.note;

    const bottom = document.createElement('div');
    bottom.className = 'card-bottom';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = item.label;
    const listen = button('', () => playClip(item.id), 'sound');
    listen.innerHTML = speaker;
    listen.setAttribute('aria-label', 'Listen to ' + item.label);
    bottom.append(label, listen);

    const state = document.createElement('span');
    state.className = 'audio-state';
    state.textContent = voices[item.id] ? 'Human recording' : 'Recording not added';
    card.append(glyph, bottom, note, state);
    if (item.detail) {
      const more = document.createElement('a');
      more.href = item.detail.slug + '.html';
      more.className = 'lesson-detail-link';
      more.textContent = 'View examples →';
      more.setAttribute('aria-label', 'View examples for ' + item.label);
      card.append(more);
    }
    $('lessonGrid').append(card);
  }

  if (!items.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No matching items.';
    $('lessonGrid').append(empty);
  }
  return items;
}

if (lessons[page]) {
  renderLesson();
  $('lessonSearch').oninput = () => { stopAudio(); renderLesson(); };
  $('stopAudio').onclick = () => { stopAudio(); status('Playback stopped.'); };
  $('listenAll').onclick = async () => {
    stopAudio();
    const ids = renderLesson().map(item => item.id).filter(id => voices[id]);
    if (!ids.length) {
      status('No human recordings are available in this lesson yet.');
      return;
    }
    const listen = $('listenAll');
    listen.disabled = true;
    try {
      for (const id of ids) {
        const token = playToken + 1;
        await playClip(id);
        await new Promise(resolve => setTimeout(resolve, 300));
        if (token !== playToken) break;
      }
    } finally {
      listen.disabled = false;
    }
  };
}

if (page === 'number') {
  $('numberInput').oninput = () => {
    const input = $('numberInput').value;
    if (!/^\d{1,4}$/.test(input)) {
      $('numberResult').textContent = 'Enter 0–9999';
      return;
    }
    $('numberResult').textContent = [...input].map(char => '႐႑႒႓႔႕႖႗႘႙'[Number(char)]).join('');
  };
}

if (page === 'conversation') {
  $('revealMeaning').onclick = () => {
    $('meaning').hidden = !$('meaning').hidden;
    $('revealMeaning').textContent = $('meaning').hidden ? 'Show meaning' : 'Hide meaning';
  };
}


// --- src/assets/js/quiz.js ---
// Ten-question practice rounds and quiz scoring.
let quizItems=[],question=0,score=0,answered=false;
function startQuiz() {
  quizItems=shuffle(lessons[$('quizTopic').value]);
  while(quizItems.length<10)quizItems.push(...shuffle(lessons[$('quizTopic').value]));
  quizItems=quizItems.slice(0,10);
  question=0;
  score=0;
  showQuestion()
}
function answerQuiz(label) {
  if(answered||question>=10)throw Error('No active unanswered question');
  answered=true;
  const item=quizItems[question],correct=label===item.label;
  if(correct)score++;
  for(const b of $('quizOptions').children) {
    b.disabled=true;
    if(b.textContent===item.label)b.classList.add('correct');
    else if(b.textContent===label)b.classList.add('incorrect')
  }
  $('quizFeedback').textContent=correct?'Correct!':`The answer is ${item.label}.`;
  $('nextQuestion').hidden=false;
  $('nextQuestion').textContent=question===9?'See result':'Next question';
  return  {
    correct,score,question:question+1
  }
}
function showQuestion() {
  answered=false;
  $('quizFeedback').textContent='';
  $('nextQuestion').hidden=true;
  $('quizBar').value=question;
  $('quizProgress').textContent=`Question ${question+1} / 10`;
  $('quizGlyph').textContent=quizItems[question].text;
  $('quizOptions').replaceChildren();
  const correct=quizItems[question],pool=lessons[$('quizTopic').value];
  const choices=shuffle([correct,...shuffle(pool.filter(x=>x.label!==correct.label)).slice(0,3)]);
  for(const x of choices)$('quizOptions').append(button(x.label,()=>answerQuiz(x.label),'option'))
}
if(page==='practicing') {
  $('quizTopic').onchange=startQuiz;
  $('restartQuiz').onclick=startQuiz;
  $('nextQuestion').onclick=()=> {
    question++;
    if(question===10) {
      $('quizBar').value=10;
      $('quizProgress').textContent='Round complete';
      $('quizGlyph').textContent=score+'/10';
      $('quizOptions').replaceChildren();
      $('quizFeedback').textContent='Nice practice. Try another round when you’re ready.';
      $('nextQuestion').hidden=true
    } else showQuestion()
  };
  startQuiz()
}


// --- src/assets/js/spelling.js ---
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


// --- src/assets/js/matching-game.js ---
// Letter matching game with drag, tap and keyboard controls.
let round=[],selected=null,matched=new Set();
function matchLetter(id,target) {
  if(matched.has(target))return  {
    matched:false
  };
  const item=round.find(x=>x.id===id);
  if(!item)throw Error('Select a letter from this round');
  if(id!==target) {
    $('gameFeedback').textContent='Try another sound. Your selected letter is still ready.';
    return  {
      matched:false
    }
  }
  matched.add(id);
  const letter=$('gameLetters').querySelector(`[data-id="${id}"]`),dest=$('gameTargets').querySelector(`[data-id="${id}"]`);
  letter.disabled=true;
  letter.setAttribute('aria-pressed','false');
  dest.disabled=true;
  dest.classList.add('matched');
  dest.textContent=item.text+' · '+item.label;
  dest.classList.add('shan');
  dest.lang='shn';
  selected=null;
  $('gameScore').textContent=`${matched.size} / 5 matched`;
  $('gameFeedback').textContent=matched.size===5?'All matched! Try a new round.':'Correct match. Choose the next letter.';
  return  {
    matched:true,count:matched.size
  }
}
function newGame() {
  round=shuffle(lessons.alphabet).slice(0,5);
  selected=null;
  matched=new Set();
  $('gameLetters').replaceChildren();
  $('gameTargets').replaceChildren();
  $('gameScore').textContent='0 / 5 matched';
  $('gameFeedback').textContent='Select a letter to begin.';
  for(const x of round) {
    const b=button(x.text,()=> {
      selected=x.id;
      for(const el of $('gameLetters').children)el.setAttribute('aria-pressed',String(el===b));
      $('gameFeedback').textContent='Now select its matching sound.'
    },'game-letter shan');
    b.lang='shn';
    b.dataset.id=x.id;
    b.draggable=true;
    b.setAttribute('aria-pressed','false');
    b.setAttribute('aria-label','Select letter '+x.text);
    b.ondragstart=e=> {
      selected=x.id;
      e.dataTransfer.setData('text/plain',x.id)
    };
    $('gameLetters').append(b)
  }
  for(const x of shuffle(round)) {
    const b=button(x.label,()=> {
      if(selected)matchLetter(selected,x.id);
      else $('gameFeedback').textContent='Select a letter first.'
    },'game-target');
    b.dataset.id=x.id;
    b.ondragover=e=> {
      e.preventDefault();
      b.classList.add('over')
    };
    b.ondragleave=()=>b.classList.remove('over');
    b.ondrop=e=> {
      e.preventDefault();
      b.classList.remove('over');
      const id=e.dataTransfer.getData('text/plain');
      if(round.some(x=>x.id===id))matchLetter(id,x.id)
    };
    $('gameTargets').append(b)
  }
}
if(page==='drag-and-drop') {
  $('newGame').onclick=newGame;
  newGame()
}


// --- src/assets/js/voice-studio.js ---
// Teacher audio uploads, microphone recordings, import and export.
function saveDownload(content,name,type) {
  const url=URL.createObjectURL(new Blob([content], {
    type
  })),a=document.createElement('a');
  a.href=url;
  a.download=name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),30000)
}
let draft= {
  ...voices
},pendingClip=null,recording=null,stream=null,recordTimer=null,recordCancelled=false,recordStarting=false;
const allItems=Object.values(lessons).flat(),validIds=new Set(allItems.map(x=>x.id));
function validateVoices(obj) {
  if(!obj||typeof obj!=='object'||Array.isArray(obj))throw Error('Expected an audio mapping');
  for(const [id,value] of Object.entries(obj)) {
    if(!validIds.has(id)||typeof value!=='string'||!/^data:audio\/[a-z0-9.+-]+(?:;[a-z0-9=.+-]+)*;base64,[A-Za-z0-9+/]*={0,2}$/i.test(value))throw Error('Invalid audio mapping')
  }
  return obj
}
function persistDraft() {
  try {
    localStorage.setItem('tai-voice-draft',JSON.stringify(draft))
  } catch(e) {
    status('Your sound is ready. Browser storage is unavailable or full; save voices.js before closing this page.')
  }
}
function saveClip(id,blob) {
  if(blob.size>5*1024*1024) {
    status('Choose a short audio clip below 5 MB.');
    return
  }
  const reader=new FileReader();
  reader.onload=()=> {
    draft[id]=reader.result;
    status('Sound added. Save voices.js to keep your recordings as a file.');
    persistDraft();
    renderStudio()
  };
  reader.onerror=()=>status('This audio file could not be read.');
  reader.readAsDataURL(blob)
}
let studioOffset = 0;
const studioPageSize = 40;
function renderStudio() {
  $('studioGrid').replaceChildren();
  $('clipCount').textContent=Object.keys(draft).length+' / '+allItems.length+' recordings';
  const query = $('studioSearch').value.trim().toLowerCase();
  const studioItems = $('studioTopic').value === 'how-to-spell-finals'
    ? spellingItems.filter(item => item.final) : lessons[$('studioTopic').value];
  const matches = studioItems.filter(item =>
    (item.text + ' ' + item.label).toLowerCase().includes(query));
  studioOffset = Math.min(studioOffset, Math.max(0, Math.ceil(matches.length / studioPageSize) - 1) * studioPageSize);
  $('studioPrevious').disabled = studioOffset === 0;
  $('studioNext').disabled = studioOffset + studioPageSize >= matches.length;
  $('studioPage').textContent = matches.length ? `${studioOffset + 1}–${Math.min(studioOffset + studioPageSize, matches.length)} of ${matches.length}` : 'No matching syllables';
  for(const item of matches.slice(studioOffset, studioOffset + studioPageSize)) {
    const row=document.createElement('article');
    row.className='studio-row';
    row.dataset.clip=item.id;
    const glyph=document.createElement('span');
    glyph.className='studio-glyph shan';
    glyph.lang='shn';
    glyph.textContent=item.text;
    const label=document.createElement('span');
    label.className='studio-label';
    label.textContent=item.label+(draft[item.id]?' · Ready':' · No audio');
    row.append(glyph,label,button('Add file',()=> {
      pendingClip=item.id;
      $('clipFile').value='';
      $('clipFile').click()
    }),button('Record',()=>recordClip(item)));
    if(draft[item.id])row.append(button('Listen',()=>playClip(item.id,draft)),button('Download',()=> {
      const value=draft[item.id],mime=value.slice(5,value.indexOf(';')),ext=( {
        'audio/mpeg':'mp3','audio/wav':'wav','audio/x-wav':'wav','audio/mp4':'m4a','audio/ogg':'ogg','audio/webm':'webm','audio/aac':'aac','audio/flac':'flac'
      })[mime]||'audio';
      const bytes=Uint8Array.from(atob(value.split(',')[1]),c=>c.charCodeAt(0));
      saveDownload(bytes,item.id+'.'+ext,mime)
    }));
    $('studioGrid').append(row)
  }
}
function closeRecorder() {
  clearTimeout(recordTimer);
  stream?.getTracks().forEach(t=>t.stop());
  stream=null;
  recording=null;
  recordStarting=false;
  $('recordDialog').close()
}
async function recordClip(item) {
  if(recording||recordStarting)return;
  stopAudio();
  if(!navigator.mediaDevices?.getUserMedia||!window.MediaRecorder) {
    status('Microphone recording requires a supported browser on HTTPS or localhost. You can still use Add file.');
    return
  }
  recordStarting=true;
  recordCancelled=false;
  $('recordTitle').textContent='Record '+item.label;
  $('recordMessage').textContent='Allow microphone access to begin.';
  $('finishRecord').disabled=true;
  $('recordDialog').showModal();
  try {
    const granted=await navigator.mediaDevices.getUserMedia( {
      audio:true
    });
    if(recordCancelled) {
      granted.getTracks().forEach(t=>t.stop());
      recordStarting=false;
      return
    }
    stream=granted;
    const mime=['audio/webm;codecs=opus','audio/mp4','audio/ogg;codecs=opus'].find(x=>MediaRecorder.isTypeSupported(x));
    const rec=new MediaRecorder(stream,mime? {
      mimeType:mime
    }: {
    });
    recording=rec;
    recordStarting=false;
    const chunks=[];
    rec.ondataavailable=e=> {
      if(e.data.size)chunks.push(e.data)
    };
    rec.onstop=()=> {
      const blob=new Blob(chunks, {
        type:rec.mimeType||chunks[0]?.type||'audio/webm'
      });
      closeRecorder();
      if(!recordCancelled&&blob.size)saveClip(item.id,blob)
    };
    rec.onerror=()=> {
      recordCancelled=true;
      closeRecorder();
      status('Recording failed. Try adding an audio file instead.')
    };
    rec.start();
    $('recordMessage').textContent='Recording… say the sound. Maximum 30 seconds.';
    $('finishRecord').disabled=false;
    recordTimer=setTimeout(()=> {
      if(rec.state==='recording')rec.stop()
    },30000)
  } catch(e) {
    closeRecorder();
    status('Microphone access was unavailable. Allow it in your browser settings or use Add file.')
  }
}
if(page==='voice-studio') {
  try {
    draft= {
      ...validateVoices(JSON.parse(localStorage.getItem('tai-voice-draft')||'{}')),...voices
    }
  } catch(e) {
  }
  for(const topic of Object.keys(lessons)) {
    const o=document.createElement('option');
    o.value=topic;
    o.textContent = topic.split('-').map(word => word[0].toUpperCase() + word.slice(1)).join(' ');
    $('studioTopic').append(o)
  }
  spellingOption($('studioTopic'), 'how-to-spell-finals', 'How to Spell — Final Consonants');
  $('studioTopic').onchange=()=> {
    stopAudio();
    studioOffset = 0;
    $('studioSearch').value = '';
    renderStudio()
  };
  $('studioSearch').oninput = () => { studioOffset = 0; renderStudio(); };
  $('studioPrevious').onclick = () => { studioOffset = Math.max(0, studioOffset - studioPageSize); renderStudio(); };
  $('studioNext').onclick = () => { studioOffset += studioPageSize; renderStudio(); };
  $('clipFile').onchange=()=> {
    const file=$('clipFile').files[0];
    if(!file||!pendingClip)return;
    if(file.type&&!file.type.startsWith('audio/')) {
      status('Please choose an audio file.');
      return
    }
    saveClip(pendingClip,file)
  };
  $('exportVoices').onclick=()=> {
    saveDownload('window.SHAN_VOICES='+JSON.stringify(draft)+';\n','voices.js','text/javascript');
    status('Download requested. Replace dist/voices.js with this file, then upload your website folder.')
  };
  $('importVoices').onclick=()=> {
    $('voiceFile').value='';
    $('voiceFile').click()
  };
  $('voiceFile').onchange=async()=> {
    const f=$('voiceFile').files[0];
    if(!f)return;
    if(f.size>150*1024*1024) {
      status('This audio collection is too large to import.');
      return
    }
    try {
      const text=await f.text();
      const json=text.trim().replace(/^window\.SHAN_VOICES\s*=\s*/,'').replace(/;\s*$/,'');
      const imported=validateVoices(JSON.parse(json));
      draft= {
        ...draft,...imported
      };
      persistDraft();
      renderStudio();
      status('Saved recordings imported.')
    } catch(e) {
      status('Could not import. Choose a voices.js file exported by this studio.')
    }
  };
  $('finishRecord').onclick=()=> {
    if(recording?.state==='recording') {
      $('finishRecord').disabled=true;
      recording.stop()
    }
  };
  const cancel=()=> {
    recordCancelled=true;
    if(recording?.state==='recording')recording.stop();
    else $('recordDialog').close()
  };
  $('cancelRecord').onclick=cancel;
  $('recordDialog').oncancel=e=> {
    e.preventDefault();
    cancel()
  };
  renderStudio();
  window.addEventListener('pagehide',()=> {
    clearTimeout(recordTimer);
    stream?.getTracks().forEach(t=>t.stop())
  })
}


// --- src/assets/js/agent-tools.js ---
// Optional browser-agent integrations for the quiz and matching game.
// Optional browser-agent interface; regular controls work without this API.
if(document.modelContext?.registerTool) {
  const lifecycle=new AbortController();
  const register=tool=> {
    try {
      Promise.resolve(document.modelContext.registerTool(tool, {
        signal:lifecycle.signal
      })).catch(()=> {
      })
    } catch(e) {
    }
  };
  if(page==='practicing')register( {
    name:'answer_shan_quiz',description:'Answer the visible Shan quiz question with one of its visible labels.',inputSchema: {
      type:'object',properties: {
        label: {
          type:'string'
        }
      },required:['label'],additionalProperties:false
    },annotations: {
      readOnlyHint:false
    },execute(input) {
      if(!input||typeof input.label!=='string'||![...$('quizOptions').children].some(b=>b.textContent===input.label))throw Error('Choose a visible answer label');
      return answerQuiz(input.label)
    }
  });
  if(page==='drag-and-drop')register( {
    name:'match_shan_letter',description:'Match a letter in the current round to its target sound.',inputSchema: {
      type:'object',properties: {
        letterId: {
          type:'string'
        },targetId: {
          type:'string'
        }
      },required:['letterId','targetId'],additionalProperties:false
    },annotations: {
      readOnlyHint:false
    },execute(input) {
      if(!input||!round.some(x=>x.id===input.letterId)||!round.some(x=>x.id===input.targetId))throw Error('Use IDs from the current round');
      return matchLetter(input.letterId,input.targetId)
    }
  });
  window.addEventListener('pagehide',()=>lifecycle.abort())
}

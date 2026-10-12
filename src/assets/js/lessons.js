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

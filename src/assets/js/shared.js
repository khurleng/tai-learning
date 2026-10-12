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

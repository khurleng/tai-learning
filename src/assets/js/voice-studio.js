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

const fs=require('fs'),vm=require('vm'),assert=require('assert');
class Element{constructor(tag='div'){this.tag=tag;this.children=[];this.dataset={};this.attrs={};this.value='';this.textContent='';this.hidden=false;this.disabled=false;this.classList={add(){},remove(){},toggle(){return true}}}append(...v){this.children.push(...v)}replaceChildren(...v){this.children=v}setAttribute(k,v){this.attrs[k]=v}querySelector(s){const m=s.match(/data-id="([^"]+)"/);return m?this.children.find(x=>x.dataset.id===m[1]):null}addEventListener(){} }
function env(page){const els=new Map();const get=id=>{if(!els.has(id))els.set(id,new Element());return els.get(id)};get('quizTopic').value='alphabet';const registered=[];const document={body:{dataset:{page}},getElementById:get,createElement:t=>new Element(t),querySelector:s=>s==='.menu-button'?get('menu'):null,querySelectorAll:()=>[],modelContext:{registerTool(tool){registered.push(tool)}}};const ctx={document,window:{addEventListener(){}},console,setTimeout,clearTimeout,AbortController,Blob,URL,navigator:{},localStorage:{getItem(){return null},setItem(){}},Uint8Array,atob};ctx.window.window=ctx.window;vm.createContext(ctx);vm.runInContext(fs.readFileSync('dist/lessons.js','utf8'),ctx);vm.runInContext(fs.readFileSync('dist/voices.js','utf8'),ctx);vm.runInContext(fs.readFileSync('dist/app.js','utf8'),ctx);return{ctx,get,registered}}
const quiz=env('practicing');assert.equal(quiz.registered[0].name,'answer_shan_quiz');for(let i=0;i<10;i++){const label=vm.runInContext('quizItems[question].label',quiz.ctx);const r=quiz.registered[0].execute({label});assert.equal(r.correct,true);quiz.get('nextQuestion').onclick()}assert.equal(quiz.get('quizGlyph').textContent,'10/10');assert.throws(()=>quiz.registered[0].execute({label:'INVALID'}));
const game=env('drag-and-drop');const ids=vm.runInContext('round.map(x=>x.id)',game.ctx);assert.throws(()=>game.registered[0].execute({letterId:'INVALID',targetId:ids[0]}));assert.equal(game.registered[0].execute({letterId:ids[0],targetId:ids[1]}).matched,false);for(const id of ids)assert.equal(game.registered[0].execute({letterId:id,targetId:id}).matched,true);assert.equal(game.get('gameScore').textContent,'5 / 5 matched');game.get('newGame').onclick();assert.equal(game.get('gameScore').textContent,'0 / 5 matched');
const validation=env('sources');assert.throws(()=>vm.runInContext('validateVoices({"alphabet-0":"https://untrusted.example"})',validation.ctx));vm.runInContext('validateVoices({"alphabet-0":"data:audio/webm;codecs=opus;base64,YQ=="})',validation.ctx);
const finals=env('final-consonants');assert.equal(finals.get('lessonGrid').children.length,8);finals.get('lessonSearch').value='-ng';finals.get('lessonSearch').oninput();assert.equal(finals.get('lessonGrid').children.length,1);finals.get('stopAudio').onclick();assert.equal(finals.get('status').textContent,'Playback stopped.');
const overview=env('final-consonants');for(const card of overview.get('lessonGrid').children){const glyph=card.children[0];assert.equal(glyph.tag,'a');assert.ok(fs.existsSync('dist/'+glyph.href));assert.equal(card.children.at(-1).href,glyph.href)}
const content=JSON.parse(fs.readFileSync('src/content/lessons/final-consonants.json','utf8'));
for(const item of content.items){const slug=item.detail.slug;const detail=env(slug);assert.equal(detail.get('lessonGrid').children.length,item.detail.items.length);assert.deepEqual(JSON.parse(JSON.stringify(detail.ctx.window.SHAN_LESSONS[slug])),item.detail.items);detail.get('lessonSearch').value='no-such-example';detail.get('lessonSearch').oninput();assert.equal(detail.get('lessonGrid').children[0].textContent,'No matching items.')}
vm.runInContext('validateVoices({"final-m-0":"data:audio/webm;codecs=opus;base64,YQ=="})',validation.ctx);
const spelling=env('practicing');
const catalog=spelling.ctx.window.SHAN_LESSONS['how-to-spell'];
assert.equal(new Set(catalog.map(x=>x.id)).size,catalog.length);
assert.equal(new Set(catalog.map(x=>x.initial)).size,19);
assert(!catalog.some(item=>!item.vowel&&!item.final));
assert.equal(spelling.get('spellSyllable').textContent,'ၵီႈ');
spelling.get('spellExampleMoe').onclick();
assert.equal(spelling.get('spellSyllable').textContent,'မိူၼ်ႈ');
assert.equal(spelling.get('spellResult').hidden,true);
spelling.get('spellAnswer').value='မိူၼ်';
spelling.get('spellForm').onsubmit({preventDefault(){}});
assert.equal(spelling.get('spellResult').hidden,true);
spelling.get('spellAnswer').value='မိူၼ်ႈ';
spelling.get('spellForm').onsubmit({preventDefault(){}});
assert.equal(spelling.get('spellResult').hidden,false);
spelling.get('spellExampleSoe').onclick();
assert.equal(spelling.get('spellSyllable').textContent,'သိူၼ်ႈ');
assert.equal(spelling.get('spellParts').children.length,5);
assert.equal(spelling.get('spellParts').children[2].children[1].textContent,'ိူၼ်');
for(let i=0;i<20;i++){spelling.get('spellNext').onclick();assert(catalog.find(x=>x.text===spelling.get('spellSyllable').textContent).final)}
for(const item of catalog){assert.equal(item.text,item.initial+item.vowel+item.final+item.tone);if(['ပ်','တ်','ၵ်'].includes(item.final))assert(['ႇ','ႈ','း','ႉ'].includes(item.tone))}
spelling.get('spellInitial').value='';spelling.get('spellFinal').value='all';spelling.get('spellVowel').value='all';spelling.get('spellTone').value='all';
for(let i=0;i<30;i++){spelling.get('spellNext').onclick();assert(catalog.some(x=>x.text===spelling.get('spellSyllable').textContent))}
spelling.get('spellRecorded').checked=true;spelling.get('spellNext').onclick();assert.equal(spelling.get('spellListen').disabled,true);
const clip=catalog.find(x=>x.text==='မိူၼ်ႈ');spelling.ctx.window.SHAN_VOICES[clip.id]='data:audio/wav;base64,YQ==';
spelling.get('spellNext').onclick();assert.equal(spelling.get('spellSyllable').textContent,'မိူၼ်ႈ');assert.equal(spelling.get('spellListen').disabled,false);
vm.runInContext('validateVoices({"'+clip.id+'":"data:audio/wav;base64,YQ=="})',validation.ctx);
const studio=env('sources');studio.get('studioTopic').value='how-to-spell';
vm.runInContext('renderStudio()',studio.ctx);assert.equal(studio.get('studioGrid').children.length,40);
studio.get('studioSearch').value='မိူၼ်ႈ';vm.runInContext('renderStudio()',studio.ctx);assert.equal(studio.get('studioGrid').children.length,1);
studio.get('studioTopic').value='how-to-spell-finals';studio.get('studioSearch').value='သိူၼ်ႈ';
vm.runInContext('renderStudio()',studio.ctx);assert.equal(studio.get('studioGrid').children.length,1);
assert.equal(studio.get('studioGrid').children[0].children[1].textContent,'သ + ိူၼ် + ႈ · No audio');
studio.get('studioSearch').value='ၵီႈ';vm.runInContext('renderStudio()',studio.ctx);assert.equal(studio.get('studioGrid').children.length,0);
console.log('PASS: spelling composition, checked tones, random selection, answer checking, recordings-only mode and searchable studio; final consonant links and search; quiz; matching game; audio validation.');

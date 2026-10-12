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

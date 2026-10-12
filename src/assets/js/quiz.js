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

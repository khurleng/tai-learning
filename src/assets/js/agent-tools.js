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

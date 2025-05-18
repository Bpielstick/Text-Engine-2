import EngineAPI from './engine/index.js';

function renderScene(scene){
  const sceneEl=document.getElementById('scene');
  const choicesEl=document.getElementById('choices');
  sceneEl.textContent=scene.text;
  choicesEl.innerHTML='';
  scene.choices.forEach(c=>{
    const li=document.createElement('li');
    const btn=document.createElement('button');
    btn.textContent=c.text;
    btn.onclick=()=>choose(c.id);
    li.appendChild(btn);
    choicesEl.appendChild(li);
  });
}

function choose(id){
  const result=EngineAPI.chooseOption(id);
  if(result.inCombat){
    alert('Combat started. UI handling not implemented.');
  }else if(result.error){
    alert(result.error);
  }else{
    renderScene(result);
  }
}

document.addEventListener('DOMContentLoaded',()=>{
  const scene=EngineAPI.startGame();
  renderScene(scene);
});

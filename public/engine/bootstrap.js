import { contentLoader } from './contentLoader.js';
import EngineAPI from './index.js';
import { renderCombat, showInventory } from './ui.js';

await contentLoader.loadAll();
const first = EngineAPI.startGame();

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
    renderCombat(result,combatAction);
  }else if(result.error){
    alert(result.error);
  }else{
    renderScene(result);
  }
}

function combatAction(skill,target){
  let res=EngineAPI.playerAction(skill,target);
  if(res.combatResult){
    const next=EngineAPI.gotoScene(res.combatResult.nextSceneId);
    renderScene(next);
  }else if(res.inCombat){
    renderCombat(res,combatAction);
  }
}

document.getElementById('inventoryBtn').onclick=()=>showInventory(()=>renderScene(EngineAPI.getScene()));

renderScene(first);


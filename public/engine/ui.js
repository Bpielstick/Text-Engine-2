import EngineAPI from './index.js';
import { contentLoader } from './contentLoader.js';

export function renderCombat(state,onAction){
  const sceneEl=document.getElementById('scene');
  const choicesEl=document.getElementById('choices');
  sceneEl.innerHTML='';
  choicesEl.innerHTML='';
  const makeDiv=(actor)=>`${actor.name}: R ${actor.resistance}/${actor.maxResistance} D ${actor.desire}/${actor.maxDesire} S ${actor.stamina}`;
  const allyHeader=document.createElement('div');
  allyHeader.textContent='Allies:';
  sceneEl.appendChild(allyHeader);
  state.allies.forEach(a=>{const d=document.createElement('div');d.textContent=makeDiv(a);sceneEl.appendChild(d);});
  const enemyHeader=document.createElement('div');
  enemyHeader.textContent='Enemies:';
  sceneEl.appendChild(enemyHeader);
  state.enemies.forEach(e=>{const d=document.createElement('div');d.textContent=makeDiv(e);sceneEl.appendChild(d);});
  const skillDiv=document.createElement('div');
  state.usableSkills?.forEach(s=>{
    const btn=document.createElement('button');
    btn.textContent=s.name;
    btn.onclick=()=>onAction(s.id,0);
    skillDiv.appendChild(btn);
  });
  const inv=EngineAPI.getInventory();
  inv.forEach(it=>{
    const item=contentLoader.items.get(it.id);
    if(item?.type==='essenceCore'){
      if(!state.allies.some(a=>a.id===item.summonCreature)){
        const btn=document.createElement('button');
        btn.textContent=`Summon ${contentLoader.creatures.get(item.summonCreature)?.name||item.summonCreature}`;
        btn.onclick=()=>{
          EngineAPI.summonCompanion(item.id);
          renderCombat(EngineAPI.getCombatState(),onAction);
        };
        skillDiv.appendChild(btn);
      }
    }
  });
  sceneEl.appendChild(skillDiv);
}

export function showInventory(onClose){
  const modal=document.getElementById('inventoryModal');
  const content=document.getElementById('inventoryContent');
  content.innerHTML='';
  const inv=EngineAPI.getInventory();
  inv.forEach(it=>{
    const item=contentLoader.items.get(it.id);
    const div=document.createElement('div');
    div.textContent=`${item?.name||it.id} x${it.qty}`;
    if(item?.type==='consumable'){
      const btn=document.createElement('button');
      btn.textContent='Use';
      btn.onclick=()=>{EngineAPI.useItem(it.id);modal.style.display='none';onClose();};
      div.appendChild(btn);
    }else if(item?.type==='weapon'||item?.type==='armor'){
      const equipped=EngineAPI.getEquipment();
      const isEq=Object.values(equipped).some(arr=>arr.some(e=>e.id===it.id));
      const btn=document.createElement('button');
      btn.textContent=isEq?'Unequip':'Equip';
      btn.onclick=()=>{isEq?EngineAPI.unequipItem(it.id):EngineAPI.equipItem(it.id);modal.style.display='none';onClose();};
      div.appendChild(btn);
    }
    content.appendChild(div);
  });
  const eq=EngineAPI.getEquipment();
  Object.entries(eq).forEach(([slot,arr])=>{
    arr.forEach(e=>{
      const div=document.createElement('div');
      div.textContent=`${slot}: ${e.id} (${e.durability??''})`;
      content.appendChild(div);
    });
  });
  modal.style.display='block';
  const close=()=>{modal.style.display='none';window.removeEventListener('keydown',esc);modal.removeEventListener('click',outside);};
  function esc(ev){if(ev.key==='Escape')close();}
  function outside(ev){if(ev.target===modal)close();}
  window.addEventListener('keydown',esc);
  modal.addEventListener('click',outside);
}

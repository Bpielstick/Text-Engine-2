import EngineAPI from './index.js';
import { contentLoader } from './contentLoader.js';

// This function is defined in bootstrap.js but renderScene is here.
// We'll define it here for now and assume bootstrap.js's renderScene will be replaced or this will be moved.
export function renderScene(scene) {
  const sceneEl = document.getElementById('scene');
  if (!sceneEl) {
    console.error("UI Error: 'scene' element not found in DOM.");
    alert("Critical UI Error: 'scene' element missing. Cannot render scene.");
    return;
  }
  const choicesEl = document.getElementById('choices');
  if (!choicesEl) {
    console.error("UI Error: 'choices' element not found in DOM.");
    alert("Critical UI Error: 'choices' element missing. Cannot render scene.");
    return;
  }

  sceneEl.textContent = scene.text;
  choicesEl.innerHTML = '';

  if (!Array.isArray(scene.choices)) {
    console.error("Data Error: scene.choices is not an array for scene:", scene.id);
    choicesEl.innerHTML = '<li>Error: Scene data is corrupted (choices not an array).</li>';
    return;
  }

  scene.choices.forEach(c => {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.textContent = c.text;
    // Assuming 'choose' function is globally available or passed somehow.
    // For now, this will rely on 'choose' being defined in bootstrap.js and accessible.
    btn.onclick = () => window.choose(c.id); // Make sure choose is accessible
    li.appendChild(btn);
    choicesEl.appendChild(li);
  });
}


export function renderCombat(combatState,onAction){
  const sceneEl=document.getElementById('scene');
  if (!sceneEl) {
    console.error("UI Error: 'scene' element not found in DOM for combat.");
    alert("Critical UI Error: 'scene' element missing. Cannot render combat.");
    return;
  }
  const choicesEl=document.getElementById('choices');
   if (!choicesEl) {
    console.error("UI Error: 'choices' element not found in DOM for combat.");
    alert("Critical UI Error: 'choices' element missing. Cannot render combat actions.");
    return;
  }

  sceneEl.innerHTML='';
  choicesEl.innerHTML='';

  const makeDiv=(actor)=>`${actor.name}: R ${actor.resistance}/${actor.maxResistance} D ${actor.desire}/${actor.maxDesire} S ${actor.stamina}`;
  const allyHeader=document.createElement('div');
  allyHeader.textContent='Allies:';
  sceneEl.appendChild(allyHeader);

  if (!Array.isArray(combatState.allies)) {
    console.error("Data Error: combatState.allies is not an array.");
    sceneEl.appendChild(document.createTextNode("Error: Allies data corrupted."));
  } else {
    combatState.allies.forEach(a=>{const d=document.createElement('div');d.textContent=makeDiv(a);sceneEl.appendChild(d);});
  }

  const enemyHeader=document.createElement('div');
  enemyHeader.textContent='Enemies:';
  sceneEl.appendChild(enemyHeader);

  if (!Array.isArray(combatState.enemies)) {
    console.error("Data Error: combatState.enemies is not an array.");
    sceneEl.appendChild(document.createTextNode("Error: Enemies data corrupted."));
  } else {
    combatState.enemies.forEach(e=>{const d=document.createElement('div');d.textContent=makeDiv(e);sceneEl.appendChild(d);});
  }
  
  const skillDiv=document.createElement('div');

  // Assuming combatState.usableSkills is the correct property for player skills
  if (combatState.usableSkills && !Array.isArray(combatState.usableSkills)) {
    console.error("Data Error: combatState.usableSkills is defined but not an array.");
  } else if (Array.isArray(combatState.usableSkills)) {
    combatState.usableSkills.forEach(s=>{
      const btn=document.createElement('button');
      btn.textContent=s.name;
      btn.onclick=()=>onAction(s.id,0); // Assuming 0 is a default target or handled by onAction
      skillDiv.appendChild(btn);
    });
  }
  
  const inv = EngineAPI.getInventory();
  // Ensure inv is an array before iterating (assuming getInventory() might return non-array)
  if (!Array.isArray(inv)) {
    console.error("Data Error: EngineAPI.getInventory() did not return an array.");
  } else {
    inv.forEach(it=>{
      const item=contentLoader.items.get(it.id);
      if(item?.type==='essenceCore'){
        // Check combatState.allies before assuming it's an array
        const alliesArray = Array.isArray(combatState.allies) ? combatState.allies : [];
        if(!alliesArray.some(a=>a.id===item.summonCreature)){
          const btn=document.createElement('button');
          btn.textContent=`Summon ${contentLoader.creatures.get(item.summonCreature)?.name||item.summonCreature}`;
          btn.onclick=()=>{
            EngineAPI.summonCompanion(item.id);
            // Re-fetch combat state to ensure it's fresh
            renderCombat(EngineAPI.getCombatState(),onAction);
          };
          skillDiv.appendChild(btn);
        }
      }
    });
  }
  sceneEl.appendChild(skillDiv);
  // Note: combatState.availableTargets was mentioned but not used in original code for skill buttons.
  // If skills need targets, that logic would need to be here, checking availableTargets as an array.
}

export function showInventory(onClose){
  const modal=document.getElementById('inventoryModal');
  if (!modal) {
    console.error("UI Error: 'inventoryModal' element not found in DOM.");
    alert("Critical UI Error: 'inventoryModal' element missing. Cannot show inventory.");
    return;
  }
  const content=document.getElementById('inventoryContent');
  if (!content) {
    console.error("UI Error: 'inventoryContent' element not found in DOM.");
    alert("Critical UI Error: 'inventoryContent' element missing. Cannot display inventory items.");
    return;
  }

  content.innerHTML='';
  const inv=EngineAPI.getInventory();

  if (!Array.isArray(inv)) {
    console.error("Data Error: EngineAPI.getInventory() did not return an array for inventory display.");
    content.textContent = "Error: Could not load inventory items.";
    return;
  }

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
      const equipped=EngineAPI.getEquipment(); // Assuming this returns a valid structure
      const isEq=Object.values(equipped).some(arr=> Array.isArray(arr) && arr.some(e=>e.id===it.id));
      const btn=document.createElement('button');
      btn.textContent=isEq?'Unequip':'Equip';
      btn.onclick=()=>{isEq?EngineAPI.unequipItem(it.id):EngineAPI.equipItem(it.id);modal.style.display='none';onClose();};
      div.appendChild(btn);
    }
    content.appendChild(div);
  });

  const eq=EngineAPI.getEquipment();
  // Assuming eq is an object as processed by Object.entries
  if (typeof eq === 'object' && eq !== null) {
    Object.entries(eq).forEach(([slot,arr])=>{
       if (Array.isArray(arr)) {
        arr.forEach(e=>{
          const div=document.createElement('div');
          div.textContent=`${slot}: ${e.id} (${e.durability??''})`;
          content.appendChild(div);
        });
      } else {
        console.error(`Data Error: Equipment slot ${slot} is not an array.`);
      }
    });
  } else {
     console.error("Data Error: EngineAPI.getEquipment() did not return a valid object.");
  }
  
  modal.style.display='block';
  const close=()=>{modal.style.display='none';window.removeEventListener('keydown',esc);modal.removeEventListener('click',outside);};
  function esc(ev){if(ev.key==='Escape')close();}
  function outside(ev){if(ev.target===modal)close();}
  window.addEventListener('keydown',esc);
  modal.addEventListener('click',outside);
}

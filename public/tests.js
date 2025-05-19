import { contentLoader } from './engine/contentLoader.js';
import EngineAPI from './engine/index.js';

export async function runAll(){
  await contentLoader.loadAll();

  // start and choose the fight
  let scene = EngineAPI.startGame();
  let combat = EngineAPI.chooseOption('fight');
  while(combat.inCombat){
    const skill=combat.usableSkills[0];
    combat=EngineAPI.playerAction(skill.id,0);
  }
  scene=EngineAPI.gotoScene(combat.combatResult.nextSceneId);
  console.assert(
    scene.text.includes('slime') || scene.text.includes('goo'),
    'Combat routed to loot OR slimeDefeat scene'
  );

  // quick save / load round-trip
  const blob = EngineAPI.saveGame(1);
  EngineAPI.chooseOption(scene.choices[0]?.id ?? '');   // progress one step
  EngineAPI.loadGame(1);
  console.assert(EngineAPI.getScene().text === scene.text, 'Save restored same scene');

  console.log('%cBrowser tests passed (no game-over path)', 'color:green');
}

if(window.location.hash==='#runTests') runAll();

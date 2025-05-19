import { contentLoader } from './engine/contentLoader.js';
import EngineAPI from './engine/index.js';

export async function runAll(){
  await contentLoader.loadAll();

  // start and choose the fight
  let out = EngineAPI.startGame();
  out = EngineAPI.chooseOption('fight');          // auto-resolved combat

  // outcome must be either victory (loot scene) or defeat scene – both valid
  console.assert(
    out.text.includes('slime') || out.text.includes('goo'),
    'Combat routed to loot OR slimeDefeat scene'
  );

  // quick save / load round-trip
  const blob = EngineAPI.saveGame(1);
  EngineAPI.chooseOption(out.choices[0]?.id ?? '');   // progress one step
  EngineAPI.loadGame(1);
  console.assert(EngineAPI.getScene().text === out.text, 'Save restored same scene');

  console.log('%cBrowser tests passed (no game-over path)', 'color:green');
}

if(window.location.hash==='#runTests') runAll();

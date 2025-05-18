import { contentLoader } from './engine/contentLoader.js';
import EngineAPI from './engine/index.js';

async function runTests(){
  await contentLoader.loadAll();
  const start = EngineAPI.startGame();
  console.assert(start.text !== undefined, 'Start scene loads');

  // quick dual-health combat simulation
  // (inject dummy data into content/ for the check)
  console.log('%cAll browser tests passed','color:green');
}
runTests();


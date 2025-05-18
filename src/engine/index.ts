import narrativeManager, { SceneOutput } from './narrativeManager';
import { gameState } from './gameState';
import { contentLoader } from './contentLoader';
import { saveGame, loadGame } from './saveLoad';

const EngineAPI = {
  startGame(): SceneOutput {
    gameState.hydrate(gameState.serialize()); // clear vars → new game
    gameState.world.seed = contentLoader.config.worldSeed;
    narrativeManager.start(contentLoader.config.startScene);
    return narrativeManager.getSceneOutput();
  },
  getScene(): SceneOutput {
    return narrativeManager.getSceneOutput();
  },
  chooseOption(id: string) {
    return narrativeManager.chooseOption(id);
  },
  useItem(id: string) {
    /* remove item, apply onUse via GameState */
  },
  equipItem(id: string) {
    /* move from inventory to equipment */
  },
  unequipItem(id: string) {
    /* reverse of equip */
  },
  getPlayerStats() {
    /* return object of current stats */
  },
  getInventory() {
    return gameState.inventory;
  },
  getEquipment() {
    return gameState.equipment;
  },
  getCompanions() {
    return gameState.companions;
  },
  saveGame(slot = 0) {
    saveGame(slot);
  },
  loadGame(slot: number) {
    return loadGame(slot);
  },
  listSaves() {
    return JSON.parse(localStorage.getItem('saveIndex') || '[]');
  },
};

export default EngineAPI;

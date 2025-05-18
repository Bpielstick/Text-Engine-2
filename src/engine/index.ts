import narrativeManager, { SceneOutput } from './narrativeManager';
import { gameState, ItemInstance } from './gameState';
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
    const invIdx = gameState.inventory.findIndex((it) => it.id === id);
    if (invIdx < 0) return;
    const inst = gameState.inventory[invIdx];
    const used: ItemInstance = { ...inst, qty: 1 };
    inst.qty -= 1;
    if (inst.qty <= 0) gameState.inventory.splice(invIdx, 1);

    const item = contentLoader.items.get(id);
    if (!item) return;
    if (item.type === 'essenceCore') {
      gameState.summonFromCore(used);
      return;
    }
    if (item.onUse) {
      gameState.apply(item.onUse);
    }
  },
  equipItem(id: string) {
    const invIdx = gameState.inventory.findIndex((it) => it.id === id);
    if (invIdx < 0) return;
    const item = contentLoader.items.get(id);
    if (!item || !item.slot) return;

    const inst = gameState.inventory[invIdx];
    inst.qty -= 1;
    if (inst.qty <= 0) gameState.inventory.splice(invIdx, 1);

    const prev = gameState.equipment[item.slot];
    if (prev) {
      const existing = gameState.inventory.find((it) => it.id === prev.id);
      if (existing) existing.qty += 1;
      else gameState.inventory.push({ id: prev.id, qty: 1 });
    }

    gameState.equipment[item.slot] = {
      id: item.id,
      layer: item.layer,
      durability: item.maxDurability,
    };
  },
  unequipItem(id: string) {
    const entry = Object.entries(gameState.equipment).find(
      ([, eq]) => eq.id === id,
    );
    if (!entry) return;
    const [slot, eq] = entry;
    delete gameState.equipment[slot];

    const existing = gameState.inventory.find((it) => it.id === eq.id);
    if (existing) existing.qty += 1;
    else gameState.inventory.push({ id: eq.id, qty: 1 });
  },
  getPlayerStats() {
    const base = contentLoader.creatures.get(contentLoader.config.playerCharacter);
    return {
      maxResistance: base?.maxResistance ?? 0,
      maxDesire: base?.maxDesire ?? 0,
      stamina: base?.stamina ?? 0,
      attack: base?.attack ?? 0,
      defense: base?.defense ?? 0,
    };
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

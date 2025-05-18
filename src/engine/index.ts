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
  combatAction(actionId: string, targetIdx: number) {
    return narrativeManager.combatAction(actionId, targetIdx);
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
    if (item.requires && !gameState.check(item.requires)) {
      return;
    }
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
    if (item.requires && !gameState.check(item.requires)) return;

    const inst = gameState.inventory[invIdx];
    inst.qty -= 1;
    if (inst.qty <= 0) gameState.inventory.splice(invIdx, 1);

    const slot = item.slot;
    const items = gameState.equipment[slot] || [];
    const replaceIdx = items.findIndex(
      (eq) => (eq.layer ?? 0) === (item.layer ?? 0),
    );
    if (replaceIdx >= 0) {
      const prev = items[replaceIdx];
      const existing = gameState.inventory.find((it) => it.id === prev.id);
      if (existing) existing.qty += 1;
      else gameState.inventory.push({ id: prev.id, qty: 1 });
      items.splice(replaceIdx, 1);
    }

    items.push({
      id: item.id,
      layer: item.layer,
      durability: item.maxDurability,
    });
    items.sort((a, b) => (b.layer ?? 0) - (a.layer ?? 0));
    gameState.equipment[slot] = items;
  },
  unequipItem(id: string) {
    for (const [slot, arr] of Object.entries(gameState.equipment)) {
      const idx = arr.findIndex((eq) => eq.id === id);
      if (idx >= 0) {
        const eq = arr[idx];
        arr.splice(idx, 1);
        if (arr.length === 0) delete gameState.equipment[slot];
        else gameState.equipment[slot] = arr;
        const existing = gameState.inventory.find((it) => it.id === eq.id);
        if (existing) existing.qty += 1;
        else gameState.inventory.push({ id: eq.id, qty: 1 });
        break;
      }
    }
  },
  getPlayerStats() {
    const base = contentLoader.creatures.get(contentLoader.config.playerCharacter);
    return {
      maxResistance: (gameState.player as any).maxResistance ?? base?.maxResistance ?? 0,
      maxDesire: (gameState.player as any).maxDesire ?? base?.maxDesire ?? 0,
      stamina: (gameState.player as any).stamina ?? base?.stamina ?? 0,
      attack: (gameState.player as any).attack ?? base?.attack ?? 0,
      defense: (gameState.player as any).defense ?? base?.defense ?? 0,
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

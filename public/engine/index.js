import narrativeManager from './narrativeManager.js';
import { gameState, GameState } from './gameState.js';
import { contentLoader } from './contentLoader.js';
import { saveGame, loadGame } from './saveLoad.js';
import combatSystem from './combatSystem.js';
import { generateRegion, getScene } from './worldGenerator.js';
const EngineAPI = {
    startGame() {
        gameState.hydrate(new GameState(contentLoader, contentLoader.config).serialize()); // clear vars → new game with defaults
        narrativeManager.start(contentLoader.config.startScene);
        return narrativeManager.getSceneOutput();
    },
    getScene() {
        return narrativeManager.getSceneOutput();
    },
    chooseOption(id) {
        return narrativeManager.chooseOption(id);
    },
    playerAction(actionId, targetIdx) {
        return narrativeManager.combatAction(actionId, targetIdx);
    },
    gotoScene(id) {
        if (!contentLoader.scenes.has(id)) {
            const m = id.match(/^(.+)_room\d+/);
            if (m) {
                const regionId = m[1];
                generateRegion(regionId);
                const scene = getScene(id);
                contentLoader.scenes.set(id, scene);
            }
        }
        gameState.world.currentRoomId = id;
        return narrativeManager.start(id);
    },
    getCombatState() {
        return combatSystem.getCombatState();
    },
    useItem(id) {
        const invIdx = gameState.inventory.findIndex((it) => it.id === id);
        if (invIdx < 0)
            return;
        const inst = gameState.inventory[invIdx];
        const used = { ...inst, qty: 1 };
        inst.qty -= 1;
        if (inst.qty <= 0)
            gameState.inventory.splice(invIdx, 1);
        const item = contentLoader.items.get(id);
        if (!item)
            return;
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
    summonCompanion(id) {
        const item = contentLoader.items.get(id);
        if (!item || item.type !== 'essenceCore' || !item.summonCreature)
            return;
        this.useItem(id);
        combatSystem.addCompanion(item.summonCreature);
        return combatSystem.getCombatState();
    },
    equipItem(id) {
        const invIdx = gameState.inventory.findIndex((it) => it.id === id);
        if (invIdx < 0)
            return;
        const item = contentLoader.items.get(id);
        if (!item || !item.slot)
            return;
        if (item.requires && !gameState.check(item.requires))
            return;
        const inst = gameState.inventory[invIdx];
        inst.qty -= 1;
        if (inst.qty <= 0)
            gameState.inventory.splice(invIdx, 1);
        const slot = item.slot;
        const items = gameState.equipment[slot] || [];
        const replaceIdx = items.findIndex((eq) => (eq.layer ?? 0) === (item.layer ?? 0));
        if (replaceIdx >= 0) {
            const prev = items[replaceIdx];
            const existing = gameState.inventory.find((it) => it.id === prev.id);
            if (existing)
                existing.qty += 1;
            else
                gameState.inventory.push({ id: prev.id, qty: 1 });
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
    unequipItem(id) {
        for (const [slot, arr] of Object.entries(gameState.equipment)) {
            const idx = arr.findIndex((eq) => eq.id === id);
            if (idx >= 0) {
                const eq = arr[idx];
                arr.splice(idx, 1);
                if (arr.length === 0)
                    delete gameState.equipment[slot];
                else
                    gameState.equipment[slot] = arr;
                const existing = gameState.inventory.find((it) => it.id === eq.id);
                if (existing)
                    existing.qty += 1;
                else
                    gameState.inventory.push({ id: eq.id, qty: 1 });
                break;
            }
        }
    },
    getPlayerStats() {
        const base = contentLoader.creatures.get(contentLoader.config.playerCharacter);
        return {
            maxResistance: gameState.player.maxResistance ?? base?.maxResistance ?? 0,
            maxDesire: gameState.player.maxDesire ?? base?.maxDesire ?? 0,
            stamina: gameState.player.stamina ?? base?.stamina ?? 0,
            attack: gameState.player.attack ?? base?.attack ?? 0,
            defense: gameState.player.defense ?? base?.defense ?? 0,
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
    loadGame(slot) {
        return loadGame(slot);
    },
    listSaves() {
        return JSON.parse(localStorage.getItem('saveIndex') || '[]');
    },
};
export default EngineAPI;

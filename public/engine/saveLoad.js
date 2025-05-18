import { IN_COMBAT } from './combatSystem';
import { gameState } from './gameState';
import { contentLoader } from './contentLoader';
import { generateRegion } from './worldGenerator';
import narrativeManager from './narrativeManager';
export function saveGame(slot = 0) {
    if (IN_COMBAT && !contentLoader.config.canSaveInCombat)
        throw 'CANNOT_SAVE';
    const snapshot = {
        engineVersion: '1.0',
        timestamp: Date.now(),
        rngRuntime: gameState.world.rngRuntime,
        state: gameState.serialize(),
    };
    localStorage.setItem(`rpg_save_${slot}`, JSON.stringify(snapshot));
    const raw = localStorage.getItem('saveIndex');
    let index = [];
    if (raw) {
        try {
            index = JSON.parse(raw);
        }
        catch {
            index = [];
        }
    }
    const entry = index.find((e) => e.slot === slot);
    if (entry) {
        entry.name = 'Manual';
        entry.timestamp = snapshot.timestamp;
    }
    else {
        index.push({ slot, name: 'Manual', timestamp: snapshot.timestamp });
    }
    localStorage.setItem('saveIndex', JSON.stringify(index));
}
export function loadGame(slot) {
    const raw = localStorage.getItem(`rpg_save_${slot}`);
    if (!raw)
        throw new Error('SAVE_NOT_FOUND');
    const snapshot = JSON.parse(raw);
    if (snapshot.engineVersion !== '1.0') {
        throw new Error('ENGINE_VERSION_MISMATCH');
    }
    gameState.hydrate(snapshot.state);
    Object.keys(gameState.world.regions).forEach((id) => generateRegion(id));
    narrativeManager.currentSceneId = gameState.world.currentScene;
    return narrativeManager.getSceneOutput();
}

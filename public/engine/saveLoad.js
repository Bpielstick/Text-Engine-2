import combatSystem from './combatSystem.js';
import { gameState } from './gameState.js';
import { contentLoader } from './contentLoader.js';
import { generateRegion } from './worldGenerator.js';
import narrativeManager from './narrativeManager.js';

const SAVE_INDEX_KEY = 'saveIndex'; // Define this constant

export function saveGame(slot = 0) {
    if (combatSystem.isActive() && !contentLoader.config.canSaveInCombat) {
        console.error('CANNOT_SAVE_IN_COMBAT');
        return false;
    }
    const snapshot = {
        engineVersion: '1.0',
        timestamp: Date.now(),
        rngRuntime: gameState.world.rngRuntime,
        state: gameState.serialize(),
    };
    const saveKey = `rpg_save_${slot}`;
    try {
        localStorage.setItem(saveKey, JSON.stringify(snapshot));
    } catch (error) {
        console.error("Error saving game data:", error);
        return false;
    }

    let index = [];
    try {
        const raw = localStorage.getItem(SAVE_INDEX_KEY);
        if (raw) {
            index = JSON.parse(raw);
        }
    } catch (error) {
        console.error("Error reading save index:", error);
        // We can potentially continue without an index, or return false
        // For now, let's try to update/create it
        index = [];
    }

    const entry = index.find((e) => e.slot === slot);
    if (entry) {
        entry.name = 'Manual'; // Assuming 'name' parameter was meant to be slot based name
        entry.timestamp = snapshot.timestamp;
    } else {
        index.push({ slot, name: 'Manual', timestamp: snapshot.timestamp });
    }

    try {
        localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
        console.error("Error saving save index:", error);
        // If saving the index fails, we might consider the overall save failed.
        // Or, the main data is saved, but the index is out of sync.
        // For now, let's return false as the operation wasn't fully successful.
        return false;
    }
    return true;
}

export function loadGame(slot) {
    const saveKey = `rpg_save_${slot}`;
    let raw;
    try {
        raw = localStorage.getItem(saveKey);
    } catch (error) {
        console.error("Error reading game data from localStorage:", error);
        return null;
    }

    if (!raw) {
        // This is not an error, but simply no save file.
        // console.log('SAVE_NOT_FOUND'); // Or handle as per game's design
        return null;
    }

    let snapshot;
    try {
        snapshot = JSON.parse(raw);
    } catch (error) {
        console.error("Error parsing game data from localStorage:", error);
        return null;
    }

    if (snapshot.engineVersion !== '1.0') {
        console.error('ENGINE_VERSION_MISMATCH');
        return null; // Or throw new Error if critical
    }

    gameState.hydrate(snapshot.state);
    Object.keys(gameState.world.regions).forEach((id) => generateRegion(id));
    narrativeManager.currentSceneId = gameState.world.currentScene; // Ensure this is correct
    return narrativeManager.getSceneOutput(); // Ensure this returns what's expected
}

export function listSaves() {
    let raw;
    try {
        raw = localStorage.getItem(SAVE_INDEX_KEY);
    } catch (error) {
        console.error("Error reading save index from localStorage:", error);
        return [];
    }
    if (!raw) {
        return [];
    }
    try {
        return JSON.parse(raw);
    } catch (error) {
        console.error("Error parsing save index from localStorage:", error);
        return [];
    }
}

export function deleteSave(slot) {
    const saveKey = `rpg_save_${slot}`;
    try {
        localStorage.removeItem(saveKey);
    } catch (error) {
        console.error("Error deleting game save data:", error);
        return false;
    }

    let index = listSaves(); // Use listSaves to safely get the current index
    index = index.filter((e) => e.slot !== slot);

    try {
        localStorage.setItem(SAVE_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
        console.error("Error updating save index after deletion:", error);
        return false;
    }
    return true;
}

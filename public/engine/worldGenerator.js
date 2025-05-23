import { contentLoader } from './contentLoader.js';
import gameState from './gameState.js';
// --- internal helpers ---
function hashString(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function mulberry32() {
    let t = (gameState.world.rngRuntime += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randInt(min, max) {
    return Math.floor(mulberry32() * (max - min + 1)) + min;
}
function pickRandom(arr) {
    return arr[randInt(0, arr.length - 1)];
}
// --- generation data ---
const generatedRegions = new Set();
const generatedScenes = new Map();
export function generateRegion(regionId) {
    if (generatedRegions.has(regionId))
        return;
    const region = contentLoader.regions.get(regionId);
    if (!region)
        throw new Error(`Region '${regionId}' not found`);
    const seed = region.randomSeed ?? hashString(`${gameState.world.seed}${regionId}`);
    const prevRng = gameState.world.rngRuntime;
    gameState.world.rngRuntime = seed;
    const roomCount = typeof region.roomCount === 'number'
        ? region.roomCount
        : randInt(region.roomCount.min, region.roomCount.max);
    const rooms = [];
    for (let i = 1; i <= roomCount; i++) {
        const roomId = `${regionId}_room${i}`;
        rooms.push(roomId);
        const templateId = pickRandom(region.roomTemplates);
        const template = contentLoader.scenes.get(templateId);
        if (!template)
            continue;
        const scene = JSON.parse(JSON.stringify(template));
        scene.id = roomId;
        scene.text = `${roomId} - ${scene.text}`;
        scene.choices = [...scene.choices];
        generatedScenes.set(roomId, scene);
    }
    // Link rooms in branching manner
    const connections = {};
    rooms.forEach((r) => (connections[r] = []));
    const reachable = new Set([rooms[0]]);
    // first room connections
    const firstExtras = Math.min(3, rooms.length - 1);
    const firstCount = randInt(1, firstExtras);
    const availableFirst = rooms.slice(1);
    for (let i = 0; i < firstCount && availableFirst.length > 0; i++) {
        const idx = randInt(0, availableFirst.length - 1);
        const target = availableFirst.splice(idx, 1)[0];
        connections[rooms[0]].push(target);
        reachable.add(target);
    }
    for (let i = 1; i < rooms.length; i++) {
        const room = rooms[i];
        if (!reachable.has(room)) {
            const prev = pickRandom(Array.from(reachable));
            connections[prev].push(room);
            reachable.add(room);
        }
        const later = rooms.slice(i + 1);
        const extra = later.length > 0 ? randInt(0, Math.min(3, later.length)) : 0;
        const picks = [];
        for (let j = 0; j < extra && later.length > 0; j++) {
            const idx = randInt(0, later.length - 1);
            const target = later.splice(idx, 1)[0];
            if (!picks.includes(target)) {
                picks.push(target);
                connections[room].push(target);
            }
        }
    }
    // Apply connections and add encounters/loot
    rooms.forEach((roomId) => {
        const scene = generatedScenes.get(roomId);
        if (!scene)
            return;
        connections[roomId].forEach((target) => {
            scene.choices.push({ text: `Go to ${target}`, nextScene: target });
        });
        if (region.encounterPool && region.encounterPool.length > 0) {
            const state = gameState.world.regions[regionId]?.mutations[roomId]?.defeatedEnemies;
            const pool = region.encounterPool.filter((e) => !state || !state.has(e));
            if (pool.length > 0 && (!state || state.size === 0)) {
                if (mulberry32() < 0.3) {
                    const enemy = pickRandom(pool);
                    const auto = {
                        id: 'autoFight',
                        text: '...',
                        encounter: enemy,
                        onWin: `${roomId}_cleared`,
                        onLose: 'defeatScene',
                    };
                    scene.choices.push(auto);
                }
            }
        }
        if (region.lootPool && region.lootPool.length > 0) {
            const state = gameState.world.regions[regionId]?.mutations[roomId]?.collectedLoot;
            const pool = region.lootPool.filter((i) => !state || !state.has(i));
            if (pool.length > 0 && (!state || state.size === 0)) {
                if (mulberry32() < 0.2) {
                    const item = pickRandom(pool);
                    const flag = `${roomId}_${item}_taken`;
                    const take = {
                        id: flag,
                        text: `take ${item}`,
                        requires: { flag, value: false },
                        effects: [{ addItem: item }, { set: { [flag]: true } }],
                    };
                    scene.choices.push(take);
                }
            }
        }
    });
    // Initialize mutations state
    const regionState = gameState.world.regions[regionId] ?? {
        seed,
        mutations: {},
    };
    rooms.forEach((r) => {
        if (!regionState.mutations[r]) {
            regionState.mutations[r] = {
                defeatedEnemies: new Set(),
                collectedLoot: new Set(),
            };
        }
    });
    gameState.world.regions[regionId] = regionState;
    generatedRegions.add(regionId);
    gameState.world.rngRuntime = prevRng;
}
export function getScene(roomId) {
    const base = generatedScenes.get(roomId);
    if (!base)
        throw new Error(`Scene '${roomId}' not generated`);
    return JSON.parse(JSON.stringify(base));
}

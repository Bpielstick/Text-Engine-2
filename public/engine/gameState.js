import { contentLoader } from './contentLoader.js';
// ---------- class GameState ----------
export class GameState {
    loader;
    config;
    vars = {};
    inventory = [];
    equipment = {};
    companions = [];
    player;
    world;
    constructor(loader, cfg) {
        this.loader = loader;
        this.config = cfg;
        this.world = {
            seed: cfg.worldSeed,
            regions: {},
            currentScene: cfg.startScene,
            currentRoomId: null,
            rngRuntime: 0,
        };
        const playerBase = loader.creatures.get(cfg.playerCharacter);
        this.player = {
            resistance: playerBase?.maxResistance ?? 0,
            desire: 0,
            stamina: playerBase?.stamina ?? 0,
            level: playerBase?.level ?? 1,
            xp: playerBase?.xp ?? 0,
            xpToNext: playerBase?.xpToNext ?? 0,
        };
        if (playerBase) {
            this.player.maxResistance = playerBase.maxResistance;
            this.player.maxDesire = playerBase.maxDesire;
            this.player.attack = playerBase.attack;
            this.player.defense = playerBase.defense;
            this.player.maxStamina = playerBase.stamina;
        }
        cfg.startingInventory?.forEach((id) => this.addItem(id));
        if (cfg.startingEquipment) {
            Object.entries(cfg.startingEquipment).forEach(([slot, id]) => {
                this.equipment[slot] = [{ id }];
            });
        }
        cfg.companions?.forEach((id) => {
            const base = loader.creatures.get(id);
            this.companions.push({
                id,
                level: base?.level ?? 1,
                xp: base?.xp ?? 0,
                xpToNext: base?.xpToNext ?? 0,
                currentResistance: base?.maxResistance ?? 0,
                currentDesire: 0,
                currentStamina: base?.stamina ?? 0,
                ...(base
                    ? {
                        maxResistance: base.maxResistance,
                        maxDesire: base.maxDesire,
                        attack: base.attack,
                        defense: base.defense,
                        maxStamina: base.stamina,
                    }
                    : {}),
            });
        });
        for (const region of loader.regions.values()) {
            this.world.regions[region.id] = {
                seed: region.randomSeed ?? cfg.worldSeed,
                mutations: {},
            };
        }
    }
    // ---- query / mutate ----------------
    getVar(k) {
        return this.vars[k];
    }
    setVar(k, v) {
        this.vars[k] = v;
    }
    modifyVar(k, delta) {
        const current = Number(this.vars[k] ?? 0);
        this.vars[k] = current + delta;
    }
    random() {
        // Mulberry32 PRNG using rngRuntime as state
        let t = (this.world.rngRuntime += 0x6d2b79f5);
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
    summonFromCore(core) {
        const baseItem = this.loader.items.get(core.id);
        if (!baseItem?.summonCreature)
            return;
        const creature = this.loader.creatures.get(baseItem.summonCreature);
        if (!creature)
            return;
        const companion = {
            id: baseItem.summonCreature,
            level: core.level ?? baseItem.level ?? creature.level ?? 1,
            xp: core.xp ?? baseItem.xp ?? creature.xp ?? 0,
            xpToNext: core.xpToNext ?? baseItem.xpToNext ?? creature.xpToNext ?? 1,
            currentResistance: creature.maxResistance,
            currentDesire: 0,
            currentStamina: creature.stamina,
            core,
        };
        this.companions.push(companion);
    }
    hasItem(id) {
        return this.inventory.some((it) => it.id === id && it.qty > 0);
    }
    hasEquippedItem(id) {
        return Object.values(this.equipment).some((arr) => arr.some((eq) => eq.id === id));
    }
    check(cond) {
        if (Array.isArray(cond)) {
            return cond.every((c) => this.check(c));
        }
        if (cond.flag !== undefined) {
            const c = cond;
            return Boolean(this.vars[c.flag]) === c.value;
        }
        if (cond.item !== undefined) {
            const c = cond;
            return this.hasItem(c.item);
        }
        if (cond.itemEquipped !== undefined) {
            const c = cond;
            return this.hasEquippedItem(c.itemEquipped);
        }
        if (cond.chance !== undefined) {
            const c = cond;
            return this.random() * 100 < c.chance;
        }
        if (cond.any !== undefined) {
            const c = cond;
            return c.any.some((sub) => this.check(sub));
        }
        if (cond.stat !== undefined) {
            const c = cond;
            const val = Number(this.vars[c.stat] ?? 0);
            if (c.min !== undefined && val < c.min)
                return false;
            if (c.max !== undefined && val > c.max)
                return false;
            return true;
        }
        if (cond.level !== undefined) {
            const c = cond;
            return this.player.level >= c.level;
        }
        return false;
    }
    apply(effect) {
        if (Array.isArray(effect)) {
            effect.forEach((e) => this.apply(e));
            return;
        }
        if (effect.set !== undefined) {
            const e = effect;
            Object.entries(e.set).forEach(([k, v]) => {
                this.vars[k] = v;
            });
            return;
        }
        if (effect.change !== undefined) {
            const e = effect;
            Object.entries(e.change).forEach(([k, d]) => {
                const curr = Number(this.vars[k] ?? 0);
                this.vars[k] = curr + d;
            });
            return;
        }
        if (effect.addItem !== undefined) {
            const e = effect;
            const ids = Array.isArray(e.addItem) ? e.addItem : [e.addItem];
            ids.forEach((id) => this.addItem(id));
            return;
        }
        if (effect.removeItem !== undefined) {
            const e = effect;
            const ids = Array.isArray(e.removeItem) ? e.removeItem : [e.removeItem];
            ids.forEach((id) => this.removeItem(id));
            return;
        }
        if (effect.reset) {
            this.hydrate(new GameState(this.loader, this.config).serialize());
            return;
        }
    }
    // ---------- serialization ----------
    serialize() {
        const replacer = (_, value) => {
            if (value instanceof Set)
                return Array.from(value);
            return value;
        };
        return JSON.stringify({
            vars: this.vars,
            inventory: this.inventory,
            equipment: this.equipment,
            companions: this.companions,
            player: this.player,
            world: {
                seed: this.world.seed,
                currentScene: this.world.currentScene,
                currentRoomId: this.world.currentRoomId,
                rngRuntime: this.world.rngRuntime,
                regions: Object.fromEntries(Object.entries(this.world.regions).map(([rid, r]) => [
                    rid,
                    {
                        seed: r.seed,
                        mutations: Object.fromEntries(Object.entries(r.mutations).map(([mid, m]) => [
                            mid,
                            {
                                defeatedEnemies: Array.from(m.defeatedEnemies),
                                collectedLoot: Array.from(m.collectedLoot),
                            },
                        ])),
                    },
                ])),
            },
        }, replacer);
    }
    hydrate(json) {
        const data = JSON.parse(json);
        this.vars = data.vars || {};
        this.inventory = data.inventory || [];
        this.equipment = data.equipment || {};
        this.companions = data.companions || [];
        const base = this.loader.creatures.get(this.config.playerCharacter);
        this.player = data.player || {
            resistance: base?.maxResistance ?? 0,
            desire: 0,
            stamina: base?.stamina ?? 0,
            level: base?.level ?? 1,
            xp: base?.xp ?? 0,
            xpToNext: base?.xpToNext ?? 0,
        };
        this.world = {
            seed: data.world.seed,
            currentScene: data.world.currentScene,
            currentRoomId: data.world.currentRoomId ?? null,
            rngRuntime: data.world.rngRuntime,
            regions: {},
        };
        for (const [rid, r] of Object.entries(data.world.regions || {})) {
            const regionState = {
                seed: r.seed,
                mutations: {},
            };
            for (const [mid, m] of Object.entries(r.mutations || {})) {
                regionState.mutations[mid] = {
                    defeatedEnemies: new Set(m.defeatedEnemies || []),
                    collectedLoot: new Set(m.collectedLoot || []),
                };
            }
            this.world.regions[rid] = regionState;
        }
    }
    // ----- internal helpers -----
    addItem(id) {
        if (typeof id === 'string') {
            const existing = this.inventory.find((it) => it.id === id);
            if (existing) {
                existing.qty += 1;
                return;
            }
            this.inventory.push({ id, qty: 1 });
            return;
        }
        const item = id;
        const existing = this.inventory.find((it) => it.id === item.id && !it.level && !item.level);
        if (existing) {
            existing.qty += item.qty;
        }
        else {
            this.inventory.push({ ...item });
        }
    }
    removeItem(id) {
        const idx = this.inventory.findIndex((it) => it.id === id);
        if (idx >= 0) {
            const inst = this.inventory[idx];
            inst.qty -= 1;
            if (inst.qty <= 0) {
                this.inventory.splice(idx, 1);
            }
        }
    }
    unsummonCompanions() {
        this.companions = this.companions.filter((c) => {
            if (!c.core)
                return true;
            c.core.level = c.level;
            c.core.xp = c.xp;
            c.core.xpToNext = c.xpToNext;
            this.addItem(c.core);
            return false;
        });
    }
}
export const gameState = new GameState(contentLoader, contentLoader.config);
export default gameState;

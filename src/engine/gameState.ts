import { ContentLoader, contentLoader } from './contentLoader';
import { GameConfig, Condition, Effect } from './types';

// ---------- helper types ----------
export interface ItemInstance { id: string; qty: number; durability?: number }
export interface EquippedItem { id: string; layer?: number; durability?: number }
export interface CompanionInstance {
  id: string;
  level: number;
  xp: number;
  xpToNext: number;
  currentResistance: number;
  currentDesire: number;
  currentStamina: number;
}
export interface RegionMutation {
  defeatedEnemies: Set<string>;
  collectedLoot: Set<string>;
}
export interface RegionState {
  seed: number;
  mutations: Record<string, RegionMutation>; // roomId -> mutations
}

// ---------- class GameState ----------
export class GameState {
  private loader: ContentLoader;
  private config: GameConfig;
  private vars: Record<string, number | boolean | string> = {};

  inventory: ItemInstance[] = [];
  equipment: Record<string, EquippedItem> = {};
  companions: CompanionInstance[] = [];
  world: {
    seed: number;
    regions: Record<string, RegionState>;
    currentScene: string;
    rngRuntime: number;
  };

  constructor(loader: ContentLoader, cfg: GameConfig) {
    this.loader = loader;
    this.config = cfg;

    this.world = {
      seed: cfg.worldSeed,
      regions: {},
      currentScene: cfg.startScene,
      rngRuntime: 0,
    };

    cfg.startingInventory?.forEach((id) => this.addItem(id));

    if (cfg.startingEquipment) {
      Object.entries(cfg.startingEquipment).forEach(([slot, id]) => {
        this.equipment[slot] = { id };
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
  getVar(k: string): number | boolean | string | undefined {
    return this.vars[k];
  }

  setVar(k: string, v: number | boolean | string): void {
    this.vars[k] = v;
  }

  modifyVar(k: string, delta: number): void {
    const current = Number(this.vars[k] ?? 0);
    this.vars[k] = current + delta;
  }

  private random(): number {
    this.world.rngRuntime += 1;
    return Math.random();
  }

  private hasItem(id: string): boolean {
    return this.inventory.some((it) => it.id === id && it.qty > 0);
  }

  check(cond: Condition | Condition[]): boolean {
    if (Array.isArray(cond)) {
      return cond.every((c) => this.check(c));
    }

    if ((cond as any).flag !== undefined) {
      const c = cond as any as { flag: string; value: boolean };
      return Boolean(this.vars[c.flag]) === c.value;
    }
    if ((cond as any).item !== undefined) {
      const c = cond as any as { item: string };
      return this.hasItem(c.item);
    }
    if ((cond as any).chance !== undefined) {
      const c = cond as any as { chance: number };
      return this.random() * 100 < c.chance;
    }
    if ((cond as any).any !== undefined) {
      const c = cond as any as { any: Condition[] };
      return c.any.some((sub) => this.check(sub));
    }
    if ((cond as any).var !== undefined) {
      const c = cond as any as { var: string; min?: number; max?: number };
      const val = Number(this.vars[c.var] ?? 0);
      if (c.min !== undefined && val < c.min) return false;
      if (c.max !== undefined && val > c.max) return false;
      return true;
    }
    return false;
  }

  apply(effect: Effect | Effect[]): void {
    if (Array.isArray(effect)) {
      effect.forEach((e) => this.apply(e));
      return;
    }

    if ((effect as any).set !== undefined) {
      const e = effect as any as { set: Record<string, boolean | number | string> };
      Object.entries(e.set).forEach(([k, v]) => {
        this.vars[k] = v;
      });
      return;
    }
    if ((effect as any).change !== undefined) {
      const e = effect as any as { change: Record<string, number> };
      Object.entries(e.change).forEach(([k, d]) => {
        const curr = Number(this.vars[k] ?? 0);
        this.vars[k] = curr + d;
      });
      return;
    }
    if ((effect as any).addItem !== undefined) {
      const e = effect as any as { addItem: string | string[] };
      const ids = Array.isArray(e.addItem) ? e.addItem : [e.addItem];
      ids.forEach((id) => this.addItem(id));
      return;
    }
    if ((effect as any).removeItem !== undefined) {
      const e = effect as any as { removeItem: string | string[] };
      const ids = Array.isArray(e.removeItem) ? e.removeItem : [e.removeItem];
      ids.forEach((id) => this.removeItem(id));
      return;
    }
    if ((effect as any).reset) {
      this.hydrate(new GameState(this.loader, this.config).serialize());
      return;
    }
  }

  // ---------- serialization ----------
  serialize(): string {
    const replacer = (_: string, value: any) => {
      if (value instanceof Set) return Array.from(value);
      return value;
    };
    return JSON.stringify({
      vars: this.vars,
      inventory: this.inventory,
      equipment: this.equipment,
      companions: this.companions,
      world: {
        seed: this.world.seed,
        currentScene: this.world.currentScene,
        rngRuntime: this.world.rngRuntime,
        regions: Object.fromEntries(
          Object.entries(this.world.regions).map(([rid, r]) => [
            rid,
            {
              seed: r.seed,
              mutations: Object.fromEntries(
                Object.entries(r.mutations).map(([mid, m]) => [
                  mid,
                  {
                    defeatedEnemies: Array.from(m.defeatedEnemies),
                    collectedLoot: Array.from(m.collectedLoot),
                  },
                ]),
              ),
            },
          ]),
        ),
      },
    }, replacer);
  }

  hydrate(json: string): void {
    const data = JSON.parse(json);
    this.vars = data.vars || {};
    this.inventory = data.inventory || [];
    this.equipment = data.equipment || {};
    this.companions = data.companions || [];
    this.world = {
      seed: data.world.seed,
      currentScene: data.world.currentScene,
      rngRuntime: data.world.rngRuntime,
      regions: {},
    };
    for (const [rid, r] of Object.entries<any>(data.world.regions || {})) {
      const regionState: RegionState = {
        seed: (r as any).seed,
        mutations: {},
      };
      for (const [mid, m] of Object.entries<any>(r.mutations || {})) {
        regionState.mutations[mid] = {
          defeatedEnemies: new Set<string>((m as any).defeatedEnemies || []),
          collectedLoot: new Set<string>((m as any).collectedLoot || []),
        };
      }
      this.world.regions[rid] = regionState;
    }
  }

  // ----- internal helpers -----
  private addItem(id: string): void {
    const existing = this.inventory.find((it) => it.id === id);
    if (existing) {
      existing.qty += 1;
    } else {
      this.inventory.push({ id, qty: 1 });
    }
  }

  private removeItem(id: string): void {
    const idx = this.inventory.findIndex((it) => it.id === id);
    if (idx >= 0) {
      const inst = this.inventory[idx];
      inst.qty -= 1;
      if (inst.qty <= 0) {
        this.inventory.splice(idx, 1);
      }
    }
  }
}

export const gameState = new GameState(contentLoader, contentLoader.config);
export default gameState;

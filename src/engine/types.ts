export interface RandomPool<T> {
  value: T;
  weight?: number; // default = 1
}

// --- Conditions ---
export interface ConditionFlag {
  flag: string;
  value: boolean;
}

export interface ConditionItem {
  item: string;
}

export interface ConditionChance {
  chance: number; // percent 0-100
}

export interface ConditionAny {
  any: Condition[];
}

export interface ConditionStat {
  var: string;
  min?: number;
  max?: number;
}

export type Condition =
  | ConditionFlag
  | ConditionItem
  | ConditionChance
  | ConditionAny
  | ConditionStat;

// --- Effects ---
export interface EffectSet {
  set: Record<string, boolean | number | string>;
}
export interface EffectChange {
  change: Record<string, number>; // delta ±
}
export interface EffectAddItem {
  addItem: string | string[];
}
export interface EffectRemoveItem {
  removeItem: string | string[];
}
export interface EffectReset {
  reset: true;
}

export type Effect =
  | EffectSet
  | EffectChange
  | EffectAddItem
  | EffectRemoveItem
  | EffectReset;

// --- Scenes ---
export interface Choice {
  id?: string;
  text: string;
  nextScene?: string | { randomPool: RandomPool<string>[] };
  encounter?: string | string[] | { randomPool: RandomPool<string>[] };
  onWin?: string;
  onLose?: string;
  requires?: Condition | Condition[];
  effects?: Effect | Effect[];
}

export interface Scene {
  id: string;
  text: string;
  choices: Choice[];
  onEnter?: Effect[];
  onExit?: Effect[];
  schemaVersion: 1;
}

// --- Skills ---
export enum DamageType {
  Physical = "physical",
  Desire = "desire",
}

export enum TargetType {
  Enemy = "enemy",
  Ally = "ally",
  Self = "self",
  Area = "area",
}

export interface Skill {
  id: string;
  name: string;
  description?: string;
  targetType: TargetType;
  damageType?: DamageType;
  baseDamage?: number;
  staminaCost?: number;
  cooldown?: number;
  effects?: Effect | Effect[];
  requires?: Condition | Condition[];
  schemaVersion: 1;
}

// --- Items ---
export interface Item {
  id: string;
  name: string;
  description?: string;
  type: "weapon" | "armor" | "consumable" | "quest" | "essenceCore";
  slot?: string;
  layer?: number; // for armor/weapon
  protection?: number;
  attackBonus?: number;
  durability?: number;
  maxDurability?: number;
  onUse?: Effect | Effect[];
  requires?: Condition | Condition[];
  summonCreature?: string;
  level?: number;
  xp?: number;
  xpToNext?: number; // core-only
  schemaVersion: 1;
}

// --- Creatures ---
export interface Creature {
  id: string;
  name: string;
  maxResistance: number;
  maxDesire: number;
  attack: number;
  defense: number;
  lustAttack?: number;
  lustDefense?: number;
  stamina: number;
  skills?: string[];
  drops?: string[];
  xpReward?: number;
  level?: number;
  xp?: number;
  xpToNext?: number;
  levelUpIncreases?: Record<string, number>;
  schemaVersion: 1;
}

// --- Regions ---
export interface Region {
  id: string;
  name: string;
  description?: string;
  startScene?: string;
  roomCount: number | { min: number; max: number };
  layout: "linear" | "branching" | "open";
  roomTemplates: string[];
  encounterPool?: string[];
  lootPool?: string[];
  randomSeed?: number;
  schemaVersion: 1;
}

// --- Game Config ---
export interface GameConfig {
  startScene: string;
  playerCharacter: string;
  startingInventory?: string[];
  startingEquipment?: Record<string, string>;
  companions?: string[];
  worldSeed: number;
  canSaveInCombat: boolean;
  version: "1.0";
  schemaVersion: 1;
}

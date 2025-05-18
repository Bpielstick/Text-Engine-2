import fs from 'fs';
import path from 'path';

// create stub localStorage for Node
class LocalStorageMock {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key)
      ? this.store[key]
      : null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
}

// Attach to global if not already present
if (!(global as any).localStorage) {
  (global as any).localStorage = new LocalStorageMock();
}

const contentDir = path.join(__dirname, '../src/content');
fs.mkdirSync(contentDir, { recursive: true });

// minimal fixture data
const scenes = [
  {
    id: 'A',
    text: 'Scene A',
    choices: [
      {
        id: 'toB',
        text: 'To B',
        nextScene: 'B',
        requires: { flag: 'myFlag', value: true },
      },
    ],
    schemaVersion: 1,
  },
  { id: 'B', text: 'Scene B', choices: [], schemaVersion: 1 },
  { id: 'C', text: 'Scene C', choices: [], schemaVersion: 1 },
  {
    id: 'R',
    text: 'Random',
    choices: [
      {
        id: 'toBC',
        text: 'Next',
        nextScene: { randomPool: [{ value: 'B' }, { value: 'C' }] },
      },
    ],
    schemaVersion: 1,
  },
  { id: 'template', text: 'Template', choices: [], schemaVersion: 1 },
];
const skills = [
  {
    id: 'atk1',
    name: 'Attack',
    targetType: 'enemy',
    damageType: 'physical',
    baseDamage: 1,
    schemaVersion: 1,
  },
];
const items = [
  { id: 'sword', name: 'Sword', type: 'weapon', slot: 'hand', schemaVersion: 1 },
  {
    id: 'potion',
    name: 'Potion',
    type: 'consumable',
    onUse: { set: { healed: true } },
    schemaVersion: 1,
  },
  {
    id: 'core_enemy',
    name: 'Enemy Core',
    type: 'essenceCore',
    summonCreature: 'enemy',
    schemaVersion: 1,
  },
];
const creatures = [
  {
    id: 'player',
    name: 'Hero',
    maxResistance: 10,
    maxDesire: 10,
    attack: 1,
    defense: 0,
    stamina: 1,
    skills: ['atk1'],
    schemaVersion: 1,
  },
  {
    id: 'enemy',
    name: 'Enemy',
    maxResistance: 1,
    maxDesire: 10,
    attack: 0,
    defense: 0,
    stamina: 1,
    skills: ['atk1'],
    xpReward: 1,
    schemaVersion: 1,
  },
  {
    id: 'enemy2',
    name: 'Enemy2',
    maxResistance: 1,
    maxDesire: 10,
    attack: 0,
    defense: 0,
    stamina: 1,
    skills: ['atk1'],
    xpReward: 1,
    schemaVersion: 1,
  },
];
const regions = [
  {
    id: 'r1',
    name: 'Region 1',
    roomCount: 2,
    layout: 'linear',
    roomTemplates: ['template'],
    schemaVersion: 1,
  },
];
const config = {
  startScene: 'A',
  playerCharacter: 'player',
  worldSeed: 1,
  canSaveInCombat: true,
  version: '1.0',
  schemaVersion: 1,
};

function writeJSON(name: string, data: any): void {
  fs.writeFileSync(path.join(contentDir, name), JSON.stringify(data, null, 2));
}

writeJSON('scenes.json', scenes);
writeJSON('skills.json', skills);
writeJSON('items.json', items);
writeJSON('creatures.json', creatures);
writeJSON('regions.json', regions);
writeJSON('gameConfig.json', config);


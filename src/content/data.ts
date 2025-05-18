import { Scene, Skill, Item, Creature, Region, GameConfig, TargetType, DamageType } from '../engine/types';

export const scenes: Scene[] = [
  {
    id: 'start',
    text: 'You are at the start.',
    choices: [{ id: 'end', text: 'End game', nextScene: 'end' }],
    schemaVersion: 1,
  },
  {
    id: 'end',
    text: 'The end.',
    choices: [],
    schemaVersion: 1,
  },
];

export const skills: Skill[] = [
  {
    id: 'basicAttack',
    name: 'Attack',
    targetType: TargetType.Enemy,
    damageType: DamageType.Physical,
    baseDamage: 5,
    staminaCost: 0,
    schemaVersion: 1,
  },
];

export const items: Item[] = [
  {
    id: 'potion',
    name: 'Potion',
    type: 'consumable',
    description: 'Heals 10.',
    onUse: { change: { resistance: 10 } },
    schemaVersion: 1,
  },
];

export const creatures: Creature[] = [
  {
    id: 'player',
    name: 'Hero',
    maxResistance: 30,
    maxDesire: 20,
    attack: 5,
    defense: 1,
    stamina: 10,
    skills: ['basicAttack'],
    level: 1,
    xp: 0,
    xpToNext: 100,
    levelUpIncreases: { maxResistance: 5, attack: 1 },
    schemaVersion: 1,
  },
  {
    id: 'slime',
    name: 'Slime',
    maxResistance: 10,
    maxDesire: 5,
    attack: 3,
    defense: 0,
    stamina: 5,
    skills: ['basicAttack'],
    xpReward: 10,
    schemaVersion: 1,
  },
];

export const regions: Region[] = [
  {
    id: 'testRegion',
    name: 'Test Region',
    roomTemplates: ['start'],
    roomCount: 1,
    layout: 'linear',
    schemaVersion: 1,
  },
];

export const gameConfig: GameConfig = {
  startScene: 'start',
  playerCharacter: 'player',
  worldSeed: 1,
  canSaveInCombat: false,
    schemaVersion: 1,
};

import { TargetType, DamageType } from '../engine/types';
export const scenes = [
    {
        id: 'start',
        text: 'You are at the start.',
        choices: [{ id: 'end', text: 'End game', nextScene: 'end' }],
        version: '1.0',
    },
    {
        id: 'end',
        text: 'The end.',
        choices: [],
        version: '1.0',
    },
];
export const skills = [
    {
        id: 'basicAttack',
        name: 'Attack',
        targetType: TargetType.Enemy,
        damageType: DamageType.Physical,
        baseDamage: 5,
        staminaCost: 0,
        version: '1.0',
    },
];
export const items = [
    {
        id: 'potion',
        name: 'Potion',
        type: 'consumable',
        description: 'Heals 10.',
        onUse: { change: { resistance: 10 } },
        version: '1.0',
    },
];
export const creatures = [
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
        version: '1.0',
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
        version: '1.0',
    },
];
export const regions = [
    {
        id: 'testRegion',
        name: 'Test Region',
        roomTemplates: ['start'],
        roomCount: 1,
        layout: 'linear',
        version: '1.0',
    },
];
export const gameConfig = {
    startScene: 'start',
    playerCharacter: 'player',
    worldSeed: 1,
    canSaveInCombat: false,
    version: '1.0',
};

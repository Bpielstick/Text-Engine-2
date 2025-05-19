export const scenes = [
  {"schemaVersion":1,"id":"intro","text":"You wake up in a misty glade. A green slime jiggles toward you.","choices":[{"id":"fight","text":"Tame the slime","encounter":"greenSlime","onWin":"loot","onLose":"slimeDefeat"},{"id":"leave","text":"Retreat from the glade","nextScene":"outro"}]},
  {"schemaVersion":1,"id":"loot","text":"The slime dissolves into a shimmering essence core that pulses in your palm.","choices":[{"text":"Pocket the core","effects":[{"addItem":"slimeCore"}],"nextScene":"outro"}],"onEnter":[{"change":{"xp":10}}]},
  {"schemaVersion":1,"id":"slimeDefeat","text":"Over-stimulated, you collapse in goo. Hours later you stagger upright at the glade’s edge, drenched but alive.","choices":[{"text":"Shake it off and head home","effects":[{"set":{"currentResistance":5,"currentDesire":0}}],"nextScene":"outro"}]},
  {"schemaVersion":1,"id":"outro","text":"End of demo. Thanks for playing!","choices":[]}
];

export const skills = [
  {"schemaVersion":1,"id":"basicAttack","name":"Strike","targetType":"enemy","damageType":"physical","baseDamage":5,"staminaCost":0}
];

export const items = [
  {"schemaVersion":1,"id":"slimeCore","name":"Slime Essence Core","type":"essenceCore","description":"A pulsing green orb.","summonCreature":"greenSlimeCompanion","level":1,"xp":0,"xpToNext":50}
];

export const creatures = [
  {"schemaVersion":1,"id":"greenSlime","name":"Green Slime","maxResistance":12,"maxDesire":12,"attack":2,"defense":0,"stamina":3,"skills":["basicAttack"],"xpReward":8,"drops":["slimeCore"]},
  {"schemaVersion":1,"id":"hero","name":"Hero","maxResistance":25,"maxDesire":25,"attack":4,"defense":1,"stamina":5,"skills":["basicAttack"]},
  {"schemaVersion":1,"id":"greenSlimeCompanion","name":"Slime Buddy","maxResistance":10,"maxDesire":0,"attack":3,"defense":0,"stamina":4,"skills":["basicAttack"],"levelUpIncreases":{"maxResistance":2,"attack":1}}
];

export const regions = [
  {"schemaVersion":1,"id":"demoRegion","name":"Demo","roomCount":1,"layout":"linear","roomTemplates":["intro"]}
];

export const gameConfig = {"schemaVersion":1,"startScene":"intro","playerCharacter":"hero","worldSeed":1234,"canSaveInCombat":false,"version":"1.0"};

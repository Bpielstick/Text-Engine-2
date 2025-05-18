# Text Engine 2 Guide

This project now includes prebuilt JavaScript so it can run directly in a web browser. Open `public/index.html` in any modern browser to launch the demo.

## Creating Your Own Content

Game data is defined using simple JavaScript objects inside `public/content/data.js`. The following structures are used:

- **Scene**
  ```js
  {
    id: 'sceneId',
    text: 'Scene description',
    choices: [
      { text: 'Go somewhere', nextScene: 'otherScene' }
    ],
    version: '1.0'
  }
  ```
  Each scene must have a unique `id`. Choices can point to another scene or start an encounter.

- **Skill**
  ```js
  {
    id: 'skillId',
    name: 'Skill Name',
    targetType: 'enemy',
    damageType: 'physical',
    baseDamage: 5,
    staminaCost: 1,
    version: '1.0'
  }
  ```

- **Item**
  ```js
  {
    id: 'potion',
    name: 'Potion',
    type: 'consumable',
    description: 'Heals 10',
    onUse: { change: { resistance: 10 } },
    version: '1.0'
  }
  ```

- **Creature**
  ```js
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
    version: '1.0'
  }
  ```

- **Region**
  ```js
  {
    id: 'regionId',
    name: 'My Region',
    roomTemplates: ['start'],
    roomCount: 1,
    layout: 'linear',
    version: '1.0'
  }
  ```

- **GameConfig**
  ```js
  {
    startScene: 'start',
    playerCharacter: 'player',
    worldSeed: 1,
    canSaveInCombat: false,
    version: '1.0'
  }
  ```

Edit the arrays exported from `data.js` to add or change game content. When the page is loaded the engine automatically reads this file.

## Local Testing Package

All files required for the browser version live in the `public` directory:

- `index.html` – main page
- `style.css` – basic styles
- `main.js` – minimal UI that drives the engine
- `engine/` – prebuilt engine modules
- `content/` – sample content definitions

To test locally, open `public/index.html` in your browser. No server or additional tools are required.

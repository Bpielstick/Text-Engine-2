import './_setup';
import { expect } from 'chai';

const path = require('path');
const fs = require('fs');

describe('WorldGenerator', () => {
  it('deterministic room ids for same seed', async () => {
    let wg = await import('../src/engine/worldGenerator');
    let gs = await import('../src/engine/gameState');
    wg.generateRegion('r1');
    const ids1 = Object.keys(gs.gameState.world.regions['r1'].mutations);

    delete require.cache[require.resolve('../src/engine/worldGenerator')];
    delete require.cache[require.resolve('../src/engine/gameState')];
    delete require.cache[require.resolve('../src/engine/contentLoader')];

    wg = await import('../src/engine/worldGenerator');
    gs = await import('../src/engine/gameState');
    wg.generateRegion('r1');
    const ids2 = Object.keys(gs.gameState.world.regions['r1'].mutations);
    expect(ids2).to.deep.equal(ids1);
  });

  it('reapplies saved mutation logs on load', async () => {
    let wg = await import('../src/engine/worldGenerator');
    let gs = await import('../src/engine/gameState');
    let sl = await import('../src/engine/saveLoad');

    wg.generateRegion('r1');
    const roomId = Object.keys(gs.gameState.world.regions['r1'].mutations)[0];

    const mut = gs.gameState.world.regions['r1'].mutations[roomId];
    mut.defeatedEnemies.add('enemy');
    mut.collectedLoot.add('potion');

    sl.saveGame(1);

    delete require.cache[require.resolve('../src/engine/worldGenerator')];
    delete require.cache[require.resolve('../src/engine/gameState')];
    delete require.cache[require.resolve('../src/engine/saveLoad')];
    delete require.cache[require.resolve('../src/engine/contentLoader')];

    wg = await import('../src/engine/worldGenerator');
    gs = await import('../src/engine/gameState');
    sl = await import('../src/engine/saveLoad');
    sl.loadGame(1);
    wg.generateRegion('r1');

    const scene = wg.getScene(roomId);
    const hasEnemy = scene.choices.some((c: any) => c.id === 'autoFight');
    const lootId = `${roomId}_potion_taken`;
    const hasLoot = scene.choices.some((c: any) => c.id === lootId);
    expect(hasEnemy).to.equal(false);
    expect(hasLoot).to.equal(false);
  });
});


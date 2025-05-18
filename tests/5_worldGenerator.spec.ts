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
});


import './_setup';
import { expect } from 'chai';

const { ContentLoader } = require('../src/engine/contentLoader');
const { GameState } = require('../src/engine/gameState');
const { NarrativeManager } = require('../src/engine/narrativeManager');
const { CombatSystem } = require('../src/engine/combatSystem');

// Test deterministic behavior of seeded RNG

describe('Seeded RNG', () => {
  it('narrative pickRandom deterministic with same seed', () => {
    const loader1 = new ContentLoader();
    const state1 = new GameState(loader1, loader1.config);
    const combat1 = new CombatSystem();
    const nm1 = new NarrativeManager(loader1, state1, combat1);
    nm1.start('R');
    const out1 = nm1.chooseOption('toBC') as any;

    const loader2 = new ContentLoader();
    const state2 = new GameState(loader2, loader2.config);
    const combat2 = new CombatSystem();
    const nm2 = new NarrativeManager(loader2, state2, combat2);
    nm2.start('R');
    const out2 = nm2.chooseOption('toBC') as any;

    expect(out1.text).to.equal(out2.text);
  });

  it('combat encounter random pool deterministic with same seed', async () => {
    let csMod = await import('../src/engine/combatSystem');
    let gsMod = await import('../src/engine/gameState');

    const combat1 = new csMod.CombatSystem();
    const start1 = combat1.start({ randomPool: [{ value: 'enemy' }, { value: 'enemy2' }] });
    const e1 = start1.enemies[0].id;

    delete require.cache[require.resolve('../src/engine/combatSystem')];
    delete require.cache[require.resolve('../src/engine/gameState')];
    delete require.cache[require.resolve('../src/engine/contentLoader')];

    csMod = await import('../src/engine/combatSystem');
    gsMod = await import('../src/engine/gameState');

    const combat2 = new csMod.CombatSystem();
    const start2 = combat2.start({ randomPool: [{ value: 'enemy' }, { value: 'enemy2' }] });
    const e2 = start2.enemies[0].id;

    expect(e2).to.equal(e1);
  });
});

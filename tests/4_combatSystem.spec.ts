import './_setup';
import { expect } from 'chai';

const { CombatSystem } = require('../src/engine/combatSystem');
const { contentLoader } = require('../src/engine/contentLoader');
const { gameState } = require('../src/engine/gameState');

describe('CombatSystem', () => {
  it('player defeats 1HP enemy and gains xp', () => {
    const combat = new CombatSystem();
    const start = combat.start('enemy');
    expect(start.inCombat).to.be.true;
    const result = combat.playerAction('atk1', 0);
    expect(result.result).to.equal('win');
    expect(result.xp).to.equal(1);
  });
});


import './_setup';
import { expect } from 'chai';

const { CombatSystem } = require('../src/engine/combatSystem');
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

  it('armor layers break in order', () => {
    gameState.equipment['torso'] = [
      { id: 'inner_armor', layer: 0, durability: 1 },
      { id: 'outer_armor', layer: 1, durability: 1 },
    ];
    const combat = new CombatSystem();
    const start = combat.start('tank');
    const player = start.allies[0];

    combat.playerAction('atk1', 0);
    expect(gameState.equipment['torso'][0].id).to.equal('inner_armor');
    expect(player.resistance).to.equal(9);

    combat.playerAction('atk1', 0);
    expect(gameState.equipment['torso']).to.be.undefined;
    expect(player.resistance).to.equal(8);

    combat.playerAction('atk1', 0);
    expect(player.resistance).to.equal(6);
  });
});


import './_setup';
import { expect } from 'chai';

const { CombatSystem } = require('../src/engine/combatSystem');
const EngineAPI = require('../src/engine/index').default;
const { gameState } = require('../src/engine/gameState');
const { saveGame, loadGame } = require('../src/engine/saveLoad');

describe('Player progression', () => {
  beforeEach(() => {
    EngineAPI.startGame();
  });

  it('player xp persists after combat and reload', () => {
    const combat = new CombatSystem();
    combat.start('enemy');
    const result = combat.playerAction('atk1', 0);
    expect(result.result).to.equal('win');
    expect(gameState.player.xp).to.equal(1);
    saveGame(1);
    gameState.player.xp = 0;
    loadGame(1);
    expect(gameState.player.xp).to.equal(1);
  });
});

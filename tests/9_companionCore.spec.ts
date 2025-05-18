import './_setup';
import { expect } from 'chai';

const { CombatSystem } = require('../src/engine/combatSystem');
const EngineAPI = require('../src/engine/index').default;
const { gameState } = require('../src/engine/gameState');
const { saveGame, loadGame } = require('../src/engine/saveLoad');

describe('Companion essence core', () => {
  beforeEach(() => {
    EngineAPI.startGame();
  });

  it('core xp persists after combat and reload', () => {
    gameState.inventory.push({ id: 'core_enemy', qty: 1, level: 1, xp: 0, xpToNext: 1 });
    EngineAPI.useItem('core_enemy');
    const combat = new CombatSystem();
    combat.start('enemy');
    const result = combat.playerAction('atk1', 0);
    expect(result.result).to.equal('win');
    const core = gameState.inventory.find((i: any) => i.id === 'core_enemy');
    expect(core.level).to.equal(2);
    expect(core.xp).to.equal(0);
    saveGame(1);
    gameState.inventory = [];
    loadGame(1);
    const loaded = gameState.inventory.find((i: any) => i.id === 'core_enemy');
    expect(loaded.level).to.equal(2);
    expect(loaded.xp).to.equal(0);
  });
});

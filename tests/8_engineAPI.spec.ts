import './_setup';
import { expect } from 'chai';

const EngineAPI = require('../src/engine/index').default;
const { gameState } = require('../src/engine/gameState');

describe('EngineAPI', () => {
  beforeEach(() => {
    EngineAPI.startGame();
  });

  it('useItem applies onUse and removes from inventory', () => {
    gameState.inventory.push({ id: 'potion', qty: 1 });
    EngineAPI.useItem('potion');
    const found = gameState.inventory.find((i: any) => i.id === 'potion');
    expect(found).to.be.undefined;
    expect(gameState.getVar('healed')).to.equal(true);
  });

  it('using essence core summons companion', () => {
    gameState.inventory.push({ id: 'core_enemy', qty: 1 });
    EngineAPI.useItem('core_enemy');
    const found = gameState.companions.find((c: any) => c.id === 'enemy');
    expect(found).to.exist;
    expect(gameState.inventory.find((i: any) => i.id === 'core_enemy')).to.be.undefined;
  });

  it('equipItem moves item to equipment', () => {
    gameState.inventory.push({ id: 'sword', qty: 1 });
    EngineAPI.equipItem('sword');
    expect(gameState.inventory.find((i: any) => i.id === 'sword')).to.be.undefined;
    expect(gameState.equipment['hand'].id).to.equal('sword');
  });

  it('unequipItem returns item to inventory', () => {
    gameState.inventory.push({ id: 'sword', qty: 1 });
    EngineAPI.equipItem('sword');
    EngineAPI.unequipItem('sword');
    expect(gameState.equipment['hand']).to.be.undefined;
    const inv = gameState.inventory.find((i: any) => i.id === 'sword');
    expect(inv?.qty).to.equal(1);
  });

  it('getPlayerStats returns base stats', () => {
    const stats = EngineAPI.getPlayerStats();
    expect(stats.maxResistance).to.equal(10);
    expect(stats.maxDesire).to.equal(10);
    expect(stats.stamina).to.equal(1);
  });
});

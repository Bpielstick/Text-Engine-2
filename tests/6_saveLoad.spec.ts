import './_setup';
import { expect } from 'chai';

const { saveGame, loadGame } = require('../src/engine/saveLoad');
const { gameState } = require('../src/engine/gameState');

describe('SaveLoad', () => {
  it('save and load restores state', () => {
    const before = gameState.serialize();
    saveGame(1);
    gameState.setVar('changed', true);
    loadGame(1);
    expect(gameState.serialize()).to.equal(before);
  });
});


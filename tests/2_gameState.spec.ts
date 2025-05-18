import './_setup';
import { expect } from 'chai';

const { ContentLoader } = require('../src/engine/contentLoader');
const { GameState } = require('../src/engine/gameState');

describe('GameState', () => {
  const loader = new ContentLoader();

  it('apply EffectChange decreases resistance', () => {
    const state = new GameState(loader, loader.config);
    state.setVar('resistance', 20);
    state.apply({ change: { resistance: -10 } });
    expect(state.getVar('resistance')).to.equal(10);
  });

  it('serialize and hydrate round-trip', () => {
    const state = new GameState(loader, loader.config);
    state.setVar('foo', 42);
    const json = state.serialize();
    const state2 = new GameState(loader, loader.config);
    state2.hydrate(json);
    expect(state2.serialize()).to.equal(json);
  });
});


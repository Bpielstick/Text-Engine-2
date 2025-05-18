import './_setup';
import { expect } from 'chai';

const { ContentLoader } = require('../src/engine/contentLoader');
const { GameState } = require('../src/engine/gameState');
const { NarrativeManager } = require('../src/engine/narrativeManager');
const { CombatSystem } = require('../src/engine/combatSystem');

describe('NarrativeManager', () => {
  const loader = new ContentLoader();
  const state = new GameState(loader, loader.config);
  const combat = new CombatSystem();
  const manager = new NarrativeManager(loader, state, combat);

  it('choice hidden without flag', () => {
    manager.start('A');
    const out = manager.getSceneOutput();
    expect(out.choices).to.have.length(0);
  });

  it('choice visible when flag set and leads to B', () => {
    state.setVar('myFlag', true);
    manager.start('A');
    const out = manager.getSceneOutput();
    expect(out.choices.map(c => c.id)).to.include('toB');
    const res = manager.chooseOption('toB');
    expect((res as any).text).to.equal('Scene B');
  });
});


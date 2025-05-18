import { ContentLoader, contentLoader } from './contentLoader';
import { GameState, gameState } from './gameState';
import { Choice, Scene, RandomPool } from './types';
import { CombatSystem, CombatStart, combatSystem } from './combatSystem';

export interface SceneOutput {
  text: string;
  choices: { id: string; text: string }[];
  inCombat: false;
}

export type ChooseResult = SceneOutput | CombatStart | { error: string };

export class NarrativeManager {
  private loader: ContentLoader;
  private state: GameState;
  private combat: CombatSystem;
  currentSceneId: string;
  private isResolving = false;

  constructor(
    loader: ContentLoader,
    state: GameState,
    combat: CombatSystem,
  ) {
    this.loader = loader;
    this.state = state;
    this.combat = combat;
    this.currentSceneId = state.world.currentScene;
  }

  start(sceneId: string): SceneOutput {
    const scene = this.loader.scenes.get(sceneId);
    if (!scene) {
      throw new Error(`Scene '${sceneId}' not found`);
    }
    this.currentSceneId = sceneId;
    this.state.world.currentScene = sceneId;
    if (scene.onEnter) {
      this.state.apply(scene.onEnter);
    }
    return this.getSceneOutput();
  }

  private visibleChoices(scene: Scene): Array<{ id: string; choice: Choice }> {
    const list: Array<{ id: string; choice: Choice }> = [];
    scene.choices.forEach((c, idx) => {
      const id = c.id ?? String(idx);
      let show = true;
      if (c.requires) {
        show = this.state.check(c.requires);
      }
      if (show) {
        list.push({ id, choice: c });
      }
    });
    return list;
  }

  getSceneOutput(): SceneOutput {
    const scene = this.loader.scenes.get(this.currentSceneId);
    if (!scene) {
      throw new Error(`Scene '${this.currentSceneId}' not found`);
    }
    const choices = this.visibleChoices(scene).map((v) => ({
      id: v.id,
      text: v.choice.text,
    }));
    return { text: scene.text, choices, inCombat: false };
  }

  chooseOption(choiceId: string): ChooseResult {
    if (this.isResolving) {
      return { error: 'TRANSITION_IN_PROGRESS' };
    }

    const scene = this.loader.scenes.get(this.currentSceneId);
    if (!scene) {
      return { error: 'SCENE_NOT_FOUND' };
    }

    const visible = this.visibleChoices(scene);
    const entry = visible.find((v) => v.id === choiceId);
    if (!entry) {
      return { error: 'INVALID_CHOICE' };
    }

    const choice = entry.choice;
    this.isResolving = true;

    if (choice.effects) {
      this.state.apply(choice.effects);
    }

    if (choice.encounter) {
      const result = this.combat.start(
        choice.encounter,
        choice.onWin,
        choice.onLose,
      );
      this.isResolving = false;
      return result;
    }

    let nextScene = this.currentSceneId;
    if (choice.nextScene) {
      if (typeof choice.nextScene === 'string') {
        nextScene = choice.nextScene;
      } else {
        nextScene = this.pickRandom(choice.nextScene.randomPool);
      }
    }

    if (scene.onExit) {
      this.state.apply(scene.onExit);
    }
    const out = this.start(nextScene);
    this.isResolving = false;
    return out;
  }

  private pickRandom<T>(pool: RandomPool<T>[]): T {
    const total = pool.reduce((s, p) => s + (p.weight ?? 1), 0);
    let r = Math.random() * total;
    for (const p of pool) {
      r -= p.weight ?? 1;
      if (r <= 0) return p.value;
    }
    return pool[pool.length - 1].value;
  }
}

export const narrativeManager = new NarrativeManager(
  contentLoader,
  gameState,
  combatSystem,
);
export default narrativeManager;

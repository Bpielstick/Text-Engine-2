import {
  scenes as scenesData,
  skills as skillsData,
  items as itemsData,
  creatures as creaturesData,
  regions as regionsData,
  gameConfig,
} from '../content/data';
import {
  Scene,
  Skill,
  Item,
  Creature,
  Region,
  GameConfig,
  Choice,
  RandomPool,
} from './types';

export class ContentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentError';
  }
}

const ID_REGEX = /^[a-z][A-Za-z0-9_]*$/;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new ContentError(message);
  }
}

export class ContentLoader {
  readonly scenes: Map<string, Scene>;
  readonly skills: Map<string, Skill>;
  readonly items: Map<string, Item>;
  readonly creatures: Map<string, Creature>;
  readonly regions: Map<string, Region>;
  readonly config: GameConfig;

  constructor() {
    const scenes = this.loadArray<Scene>(scenesData, 'scenes');
    const skills = this.loadArray<Skill>(skillsData, 'skills');
    const items = this.loadArray<Item>(itemsData, 'items');
    const creatures = this.loadArray<Creature>(creaturesData, 'creatures');
    const regions = this.loadArray<Region>(regionsData, 'regions');
    const config = this.loadObject<GameConfig>(gameConfig, 'gameConfig');

    this.scenes = this.arrayToMap(scenes, 'Scene');
    this.skills = this.arrayToMap(skills, 'Skill');
    this.items = this.arrayToMap(items, 'Item');
    this.creatures = this.arrayToMap(creatures, 'Creature');
    this.regions = this.arrayToMap(regions, 'Region');
    this.config = config;

    this.validateCrossReferences();
  }

  private loadArray<T extends { id: string; schemaVersion: number }>(
    data: readonly T[],
    context: string,
  ): T[] {
    assert(Array.isArray(data), `${context} must be an array`);
    const out: T[] = [];
    data.forEach((obj, i) => {
      assert(
        obj.schemaVersion === 1,
        `${context}[${i}] schemaVersion must be 1`,
      );
      assert(ID_REGEX.test(obj.id), `${context}[${i}] invalid id '${obj.id}'`);
      out.push({ ...(obj as any) });
    });
    return out;
  }

  private loadObject<T extends { schemaVersion?: number }>(
    data: T,
    context: string,
  ): T {
    assert(data && typeof data === 'object' && !Array.isArray(data), `${context} must be an object`);
    assert(
      (data as any).schemaVersion === 1,
      `${context} schemaVersion must be 1`,
    );
    return data as T;
  }

  private arrayToMap<T extends { id: string }>(arr: T[], name: string): Map<string, T> {
    const map = new Map<string, T>();
    arr.forEach((obj, i) => {
      assert(!map.has(obj.id), `${name} id '${obj.id}' duplicated`);
      map.set(obj.id, obj);
    });
    return map;
  }

  private validateRandomPool(pool: RandomPool<string>[], context: string): void {
    pool.forEach((p, index) => {
      assert(
        ID_REGEX.test(p.value),
        `${context} randomPool[${index}] invalid id '${p.value}'`,
      );
      if (p.weight !== undefined) {
        assert(
          Number.isInteger(p.weight) && p.weight > 0,
          `${context} randomPool[${index}] weight must be positive integer`,
        );
      }
    });
  }

  private validateChoice(choice: Choice, sceneId: string): void {
    const ctx = `Scene '${sceneId}' choice`;
    if (choice.nextScene) {
      if (typeof choice.nextScene === 'string') {
        assert(
          this.scenes.has(choice.nextScene),
          `${ctx} nextScene '${choice.nextScene}' not found`,
        );
      } else {
        this.validateRandomPool(choice.nextScene.randomPool, `${ctx} nextScene`);
        choice.nextScene.randomPool.forEach((p) => {
          assert(
            this.scenes.has(p.value),
            `${ctx} nextScene random id '${p.value}' not found`,
          );
        });
      }
    }
    if (choice.encounter) {
      if (typeof choice.encounter === 'string') {
        assert(
          this.creatures.has(choice.encounter),
          `${ctx} encounter '${choice.encounter}' not found`,
        );
      } else if (Array.isArray(choice.encounter)) {
        choice.encounter.forEach((id) => {
          assert(this.creatures.has(id), `${ctx} encounter '${id}' not found`);
        });
      } else {
        this.validateRandomPool(
          choice.encounter.randomPool,
          `${ctx} encounter`,
        );
        choice.encounter.randomPool.forEach((p) => {
          assert(
            this.creatures.has(p.value),
            `${ctx} encounter random id '${p.value}' not found`,
          );
        });
      }
    }
  }

  private validateCrossReferences(): void {
    // Validate scenes choices
    for (const scene of this.scenes.values()) {
      scene.choices.forEach((choice) => this.validateChoice(choice, scene.id));
    }

    // Validate creature skills and drops
    for (const creature of this.creatures.values()) {
      creature.skills?.forEach((id) => {
        assert(this.skills.has(id), `Creature '${creature.id}' skill '${id}' invalid`);
      });
      creature.drops?.forEach((id) => {
        assert(this.items.has(id), `Creature '${creature.id}' drop '${id}' invalid`);
      });
    }

    // Validate regions
    for (const region of this.regions.values()) {
      region.roomTemplates.forEach((id) => {
        assert(this.scenes.has(id), `Region '${region.id}' roomTemplate '${id}' invalid`);
      });
    }

    // Validate config references
    this.config.startingInventory?.forEach((id) => {
      assert(this.items.has(id), `Config startingInventory item '${id}' invalid`);
    });
    if (this.config.startingEquipment) {
      Object.entries(this.config.startingEquipment).forEach(([, id]) => {
        assert(this.items.has(id), `Config startingEquipment item '${id}' invalid`);
      });
    }
    assert(
      this.scenes.has(this.config.startScene),
      `Config startScene '${this.config.startScene}' invalid`,
    );
  }
}

export const contentLoader = new ContentLoader();
export default contentLoader;

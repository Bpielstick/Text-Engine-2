import { contentLoader } from './contentLoader';
import { gameState, EquippedItem } from './gameState';
import {
  Skill,
  Creature,
  DamageType,
} from './types';

// ------------------------------------------------
export interface CombatStart {
  inCombat: true;
  allies: CombatActor[];
  enemies: CombatActor[];
  activeActorId: string;
}

export interface CombatResult {
  result: 'win' | 'lose';
  xp: number;
  loot: string[];
}

export class CombatActor {
  id: string;
  name: string;
  resistance: number;
  maxResistance: number;
  desire: number;
  maxDesire: number;
  stamina: number;
  maxStamina: number;
  attack: number;
  defense: number;
  lustDefense?: number;
  skills: string[];
  cooldowns: Record<string, number> = {};
  equipment: Record<string, EquippedItem> = {};

  constructor(base: Creature, equipment?: Record<string, EquippedItem>) {
    this.id = base.id;
    this.name = base.name;
    this.resistance = base.maxResistance;
    this.maxResistance = base.maxResistance;
    this.desire = 0;
    this.maxDesire = base.maxDesire;
    this.stamina = base.stamina;
    this.maxStamina = base.stamina;
    this.attack = base.attack;
    this.defense = base.defense;
    this.lustDefense = base.lustDefense;
    this.skills = base.skills ? [...base.skills] : [];
    if (equipment) {
      this.equipment = JSON.parse(JSON.stringify(equipment));
    }
  }
}

// Global flag for the Save/Load system
export let IN_COMBAT = false;

export class CombatSystem {
  private allies: CombatActor[] = [];
  private enemies: CombatActor[] = [];
  private order: CombatActor[] = [];
  private turnIdx = 0;
  private running = false;
  private onWin?: string;
  private onLose?: string;

  // ----- utilities -----
  private pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  private createActor(id: string, equipment?: Record<string, EquippedItem>): CombatActor {
    const base = contentLoader.creatures.get(id);
    if (!base) throw new Error(`Creature '${id}' not found`);
    return new CombatActor(base, equipment);
  }

  private applyEndOfRound(): void {
    for (const actor of this.order) {
      Object.keys(actor.cooldowns).forEach((k) => {
        if (actor.cooldowns[k] > 0) actor.cooldowns[k] -= 1;
      });
      actor.stamina = Math.min(actor.maxStamina, actor.stamina + 1);
    }
  }

  private getUsableSkills(actor: CombatActor): Skill[] {
    return actor.skills
      .map((id) => contentLoader.skills.get(id))
      .filter((s): s is Skill => !!s)
      .filter((s) => {
        const cd = actor.cooldowns[s.id] ?? 0;
        const cost = s.staminaCost ?? 0;
        return cd <= 0 && cost <= actor.stamina;
      });
  }

  private armorProtection(actor: CombatActor): number {
    let prot = 0;
    Object.values(actor.equipment).forEach((eq) => {
      const item = contentLoader.items.get(eq.id);
      if (item?.protection) prot += item.protection;
    });
    return prot;
  }

  private handleDurability(actor: CombatActor): void {
    Object.entries(actor.equipment).forEach(([slot, eq]) => {
      const item = contentLoader.items.get(eq.id);
      if (!item?.protection) return;
      if (eq.durability !== undefined) {
        eq.durability -= 1;
      }
      if (eq.durability !== undefined && eq.durability <= 0) {
        delete actor.equipment[slot];
        if (actor.id === 'player') {
          delete gameState.equipment[slot];
        }
      }
    });
  }

  private applyDamage(
    attacker: CombatActor,
    target: CombatActor,
    skill: Skill,
  ): void {
    const base = skill.baseDamage ?? 0;
    const cost = skill.staminaCost ?? 0;
    attacker.stamina = Math.max(0, attacker.stamina - cost);

    if (skill.damageType === DamageType.Desire) {
      let dmg = base + attacker.attack - (target.lustDefense ?? 0);
      if (dmg < 0) dmg = 0;
      target.desire += dmg;
    } else {
      const beforeArmor = base + attacker.attack - target.defense;
      let dmg = beforeArmor - this.armorProtection(target);
      if (dmg < 0) dmg = 0;
      target.resistance -= dmg;
      if (dmg < beforeArmor) {
        this.handleDurability(target);
      }
    }
  }

  private removeDefeated(): void {
    const defeated = (actor: CombatActor) =>
      actor.resistance <= 0 || actor.desire >= actor.maxDesire;
    const wasLength = this.order.length;
    this.order = this.order.filter((a) => !defeated(a));
    this.allies = this.allies.filter((a) => !defeated(a));
    this.enemies = this.enemies.filter((a) => !defeated(a));
    if (this.order.length !== wasLength && this.turnIdx >= this.order.length) {
      this.turnIdx = 0;
    }
  }

  private processAI(actor: CombatActor): void {
    const usable = this.getUsableSkills(actor);
    if (usable.length === 0) return;
    const skill = usable.reduce((best, s) => {
      const dmg = s.baseDamage ?? 0;
      const bestDmg = best.baseDamage ?? 0;
      return dmg > bestDmg ? s : best;
    });
    const opponents = this.allies.includes(actor) ? this.enemies : this.allies;
    if (opponents.length === 0) return;
    const target = this.pickRandom(opponents);
    this.applyDamage(actor, target, skill);
    if (skill.cooldown) actor.cooldowns[skill.id] = skill.cooldown;
  }

  private nextTurn(): CombatResult | null {
    this.turnIdx += 1;
    if (this.turnIdx >= this.order.length) {
      this.applyEndOfRound();
      this.turnIdx = 0;
    }

    this.removeDefeated();

    // Check win/lose
    if (this.enemies.length === 0) {
      IN_COMBAT = false;
      this.running = false;
      const xp = this.enemies.reduce((s, e) => {
        const base = contentLoader.creatures.get(e.id);
        return s + (base?.xpReward ?? 0);
      }, 0);
      const loot: string[] = [];
      this.enemies.forEach((e) => {
        const base = contentLoader.creatures.get(e.id);
        base?.drops?.forEach((d) => loot.push(d));
      });
      loot.forEach((id) => gameState.apply({ addItem: id }));
      return { result: 'win', xp, loot };
    }
    const player = this.allies[0];
    if (!player || player.resistance <= 0 || player.desire >= player.maxDesire) {
      IN_COMBAT = false;
      this.running = false;
      return { result: 'lose', xp: 0, loot: [] };
    }

    const actor = this.order[this.turnIdx];
    if (actor !== player) {
      this.processAI(actor);
      if (actor.cooldowns) {
        // Already set by applyDamage
      }
      this.removeDefeated();
      return this.nextTurn();
    }
    return null;
  }

  // ----- public API -----
  start(
    encounter: string | string[] | { randomPool: { value: string; weight?: number }[] },
    onWin?: string,
    onLose?: string,
  ): CombatStart {
    const enemiesIds: string[] = [];
    if (typeof encounter === 'string') {
      enemiesIds.push(encounter);
    } else if (Array.isArray(encounter)) {
      enemiesIds.push(...encounter);
    } else {
      const total = encounter.randomPool.reduce((t, p) => t + (p.weight ?? 1), 0);
      let r = Math.random() * total;
      for (const p of encounter.randomPool) {
        r -= p.weight ?? 1;
        if (r <= 0) {
          enemiesIds.push(p.value);
          break;
        }
      }
      if (enemiesIds.length === 0 && encounter.randomPool.length > 0) {
        enemiesIds.push(encounter.randomPool[0].value);
      }
    }

    const playerBaseId = contentLoader.config.playerCharacter;
    const player = this.createActor(playerBaseId, gameState.equipment);

    this.allies = [player, ...gameState.companions.map((c) => this.createActor(c.id))];
    this.enemies = enemiesIds.map((id) => this.createActor(id));
    this.order = [...this.allies, ...this.enemies];
    this.turnIdx = 0;
    this.onWin = onWin;
    this.onLose = onLose;
    this.running = true;
    IN_COMBAT = true;

    return {
      inCombat: true,
      allies: this.allies,
      enemies: this.enemies,
      activeActorId: this.order[0].id,
    };
  }

  playerAction(actionId: string, targetIdx: number): CombatStart | CombatResult {
    if (!this.running) {
      throw new Error('No combat in progress');
    }
    const player = this.allies[0];
    const target = this.enemies[targetIdx];
    const skill = contentLoader.skills.get(actionId) ?? this.getUsableSkills(player)[0];
    if (!skill || !target) {
      throw new Error('Invalid action or target');
    }

    this.applyDamage(player, target, skill);
    if (skill.cooldown) player.cooldowns[skill.id] = skill.cooldown;

    const result = this.nextTurn();
    if (result) return result;

    return {
      inCombat: true,
      allies: this.allies,
      enemies: this.enemies,
      activeActorId: this.order[this.turnIdx].id,
    };
  }
}

export const combatSystem = new CombatSystem();
export default combatSystem;

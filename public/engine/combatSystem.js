import { contentLoader } from './contentLoader';
import { gameState } from './gameState';
import { DamageType, } from './types';
export class CombatActor {
    id;
    name;
    resistance;
    maxResistance;
    desire;
    maxDesire;
    stamina;
    maxStamina;
    attack;
    defense;
    lustDefense;
    skills;
    cooldowns = {};
    equipment = {};
    constructor(base, equipment) {
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
    allies = [];
    enemies = [];
    order = [];
    turnIdx = 0;
    running = false;
    onWin;
    onLose;
    enemyIds = [];
    playerActor;
    getCurrentEnemyIds() {
        return this.enemyIds.slice();
    }
    isActive() {
        return this.running;
    }
    // ----- utilities -----
    pickRandom(arr) {
        return arr[Math.floor(gameState.random() * arr.length)];
    }
    createActor(id, equipment) {
        const base = contentLoader.creatures.get(id);
        if (!base)
            throw new Error(`Creature '${id}' not found`);
        let level = base.level ?? 1;
        if (id === contentLoader.config.playerCharacter) {
            level = gameState.player.level;
        }
        else {
            const comp = gameState.companions.find((c) => c.id === id);
            if (comp)
                level = comp.level;
        }
        const leveled = { ...base };
        if (base.levelUpIncreases) {
            for (let i = base.level ?? 1; i < level; i++) {
                Object.entries(base.levelUpIncreases).forEach(([k, v]) => {
                    leveled[k] = (leveled[k] ?? 0) + v;
                });
            }
        }
        return new CombatActor(leveled, equipment);
    }
    applyEndOfRound() {
        for (const actor of this.order) {
            Object.keys(actor.cooldowns).forEach((k) => {
                if (actor.cooldowns[k] > 0)
                    actor.cooldowns[k] -= 1;
            });
            actor.stamina = Math.min(actor.maxStamina, actor.stamina + 1);
        }
    }
    getUsableSkills(actor) {
        return actor.skills
            .map((id) => contentLoader.skills.get(id))
            .filter((s) => !!s)
            .filter((s) => {
            const cd = actor.cooldowns[s.id] ?? 0;
            const cost = s.staminaCost ?? 0;
            const reqOk = s.requires ? gameState.check(s.requires) : true;
            return cd <= 0 && cost <= actor.stamina && reqOk;
        });
    }
    armorProtection(actor, zone) {
        const items = actor.equipment[zone];
        if (!items || items.length === 0)
            return 0;
        const outer = items.reduce((a, b) => (b.layer ?? 0) > (a.layer ?? 0) ? b : a);
        const item = contentLoader.items.get(outer.id);
        return item?.protection ?? 0;
    }
    handleDurability(actor, zone, amount = 1) {
        const items = actor.equipment[zone];
        if (!items || items.length === 0)
            return;
        let outerIdx = 0;
        for (let i = 1; i < items.length; i++) {
            if ((items[i].layer ?? 0) > (items[outerIdx].layer ?? 0))
                outerIdx = i;
        }
        const eq = items[outerIdx];
        const item = contentLoader.items.get(eq.id);
        if (!item?.protection)
            return;
        if (eq.durability !== undefined) {
            eq.durability -= amount;
        }
        if (eq.durability !== undefined && eq.durability <= 0) {
            items.splice(outerIdx, 1);
            if (items.length === 0)
                delete actor.equipment[zone];
            else
                actor.equipment[zone] = items;
            if (actor.id === 'player') {
                const playerItems = gameState.equipment[zone];
                if (playerItems) {
                    const idx = playerItems.findIndex((e) => e.id === eq.id && e.layer === eq.layer);
                    if (idx >= 0) {
                        playerItems.splice(idx, 1);
                        if (playerItems.length === 0)
                            delete gameState.equipment[zone];
                        else
                            gameState.equipment[zone] = playerItems;
                    }
                }
            }
        }
    }
    applyDamage(attacker, target, skill) {
        const base = skill.baseDamage ?? 0;
        const cost = skill.staminaCost ?? 0;
        attacker.stamina = Math.max(0, attacker.stamina - cost);
        const zone = skill.zone ?? 'torso';
        if (skill.damageType === DamageType.Desire) {
            let dmg = base + attacker.attack - (target.lustDefense ?? 0);
            if (dmg < 0)
                dmg = 0;
            target.desire += dmg;
        }
        else {
            const beforeArmor = base + attacker.attack - target.defense;
            const armor = this.armorProtection(target, zone);
            let dmg = beforeArmor - armor;
            if (dmg < 0)
                dmg = 0;
            target.resistance -= dmg;
            const blocked = Math.max(beforeArmor - dmg, 0);
            if (blocked > 0) {
                this.handleDurability(target, zone, blocked);
            }
        }
    }
    removeDefeated() {
        const defeated = (actor) => actor.resistance <= 0 || actor.desire >= actor.maxDesire;
        const wasLength = this.order.length;
        this.order = this.order.filter((a) => !defeated(a));
        this.allies = this.allies.filter((a) => !defeated(a));
        this.enemies = this.enemies.filter((a) => !defeated(a));
        if (this.order.length !== wasLength && this.turnIdx >= this.order.length) {
            this.turnIdx = 0;
        }
    }
    awardCompanionXp(xp) {
        gameState.companions.forEach((c) => {
            c.xp += xp;
            while (c.xpToNext && c.xp >= c.xpToNext) {
                c.xp -= c.xpToNext;
                c.level += 1;
                const base = contentLoader.creatures.get(c.id);
                if (base?.levelUpIncreases) {
                    Object.entries(base.levelUpIncreases).forEach(([k, v]) => {
                        c[k] = (c[k] ?? 0) + v;
                    });
                }
            }
        });
        gameState.unsummonCompanions();
    }
    awardPlayerXp(xp) {
        const p = gameState.player;
        p.xp += xp;
        while (p.xpToNext && p.xp >= p.xpToNext) {
            p.xp -= p.xpToNext;
            p.level += 1;
            const base = contentLoader.creatures.get(contentLoader.config.playerCharacter);
            if (base?.levelUpIncreases) {
                Object.entries(base.levelUpIncreases).forEach(([k, v]) => {
                    const curr = gameState.player[k] ?? base[k];
                    gameState.player[k] = curr + v;
                });
            }
        }
    }
    syncPlayerStats() {
        if (!this.playerActor)
            return;
        gameState.player.resistance = this.playerActor.resistance;
        gameState.player.desire = this.playerActor.desire;
        gameState.player.stamina = this.playerActor.stamina;
    }
    processAI(actor) {
        const usable = this.getUsableSkills(actor);
        if (usable.length === 0)
            return;
        const skill = usable.reduce((best, s) => {
            const dmg = s.baseDamage ?? 0;
            const bestDmg = best.baseDamage ?? 0;
            return dmg > bestDmg ? s : best;
        });
        const opponents = this.allies.includes(actor) ? this.enemies : this.allies;
        if (opponents.length === 0)
            return;
        const target = this.pickRandom(opponents);
        this.applyDamage(actor, target, skill);
        if (skill.cooldown)
            actor.cooldowns[skill.id] = skill.cooldown;
    }
    nextTurn() {
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
            const xp = this.enemyIds.reduce((s, id) => {
                const base = contentLoader.creatures.get(id);
                return s + (base?.xpReward ?? 0);
            }, 0);
            const loot = [];
            this.enemyIds.forEach((id) => {
                const base = contentLoader.creatures.get(id);
                base?.drops?.forEach((d) => loot.push(d));
            });
            loot.forEach((id) => gameState.apply({ addItem: id }));
            this.syncPlayerStats();
            this.awardPlayerXp(xp);
            this.awardCompanionXp(xp);
            return { result: 'win', xp, loot };
        }
        const player = this.allies[0];
        if (!player || player.resistance <= 0 || player.desire >= player.maxDesire) {
            IN_COMBAT = false;
            this.running = false;
            this.syncPlayerStats();
            this.awardPlayerXp(0);
            this.awardCompanionXp(0);
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
    start(encounter, onWin, onLose) {
        const enemiesIds = [];
        if (typeof encounter === 'string') {
            enemiesIds.push(encounter);
        }
        else if (Array.isArray(encounter)) {
            enemiesIds.push(...encounter);
        }
        else {
            const total = encounter.randomPool.reduce((t, p) => t + (p.weight ?? 1), 0);
            let r = gameState.random() * total;
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
        player.resistance = gameState.player.resistance;
        player.desire = gameState.player.desire;
        player.stamina = player.maxStamina;
        gameState.player.stamina = player.maxStamina;
        this.playerActor = player;
        this.allies = [
            player,
            ...gameState.companions.map((c) => {
                const actor = this.createActor(c.id);
                actor.resistance = c.currentResistance;
                actor.desire = c.currentDesire;
                actor.stamina = actor.maxStamina;
                c.currentStamina = actor.maxStamina;
                return actor;
            }),
        ];
        this.enemies = enemiesIds.map((id) => this.createActor(id));
        this.enemyIds = enemiesIds.slice();
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
    playerAction(actionId, targetIdx) {
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
        if (skill.cooldown)
            player.cooldowns[skill.id] = skill.cooldown;
        const result = this.nextTurn();
        if (result)
            return result;
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

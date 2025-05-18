import { contentLoader } from './contentLoader';
import { gameState } from './gameState';
import { combatSystem } from './combatSystem';
export class NarrativeManager {
    loader;
    state;
    combat;
    currentSceneId;
    isResolving = false;
    combatOnWin;
    combatOnLose;
    combatRoomId;
    combatRegionId;
    constructor(loader, state, combat) {
        this.loader = loader;
        this.state = state;
        this.combat = combat;
        this.currentSceneId = state.world.currentScene;
    }
    start(sceneId) {
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
    visibleChoices(scene) {
        const list = [];
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
    parseRoom(id) {
        const m = id.match(/^(.+_room\d+)/);
        if (!m)
            return null;
        const roomId = m[1];
        const idx = roomId.indexOf('_room');
        return { regionId: roomId.slice(0, idx), roomId };
    }
    getSceneOutput() {
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
    chooseOption(choiceId) {
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
            if (choice.id && choice.id.endsWith('_taken')) {
                const room = this.parseRoom(this.currentSceneId);
                if (room) {
                    const effects = Array.isArray(choice.effects)
                        ? choice.effects
                        : [choice.effects];
                    const add = effects.find((e) => e.addItem);
                    const item = add && add.addItem;
                    if (item && typeof item === 'string') {
                        const mut = this.state.world.regions[room.regionId]?.mutations[room.roomId];
                        mut?.collectedLoot.add(item);
                    }
                }
            }
        }
        if (choice.encounter) {
            const loc = this.parseRoom(this.currentSceneId);
            this.combatRoomId = loc?.roomId;
            this.combatRegionId = loc?.regionId;
            this.combatOnWin = choice.onWin;
            this.combatOnLose = choice.onLose;
            const result = this.combat.start(choice.encounter, choice.onWin, choice.onLose);
            this.isResolving = false;
            return result;
        }
        let nextScene = this.currentSceneId;
        if (choice.nextScene) {
            if (typeof choice.nextScene === 'string') {
                nextScene = choice.nextScene;
            }
            else {
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
    pickRandom(pool) {
        const total = pool.reduce((s, p) => s + (p.weight ?? 1), 0);
        let r = this.state.random() * total;
        for (const p of pool) {
            r -= p.weight ?? 1;
            if (r <= 0)
                return p.value;
        }
        return pool[pool.length - 1].value;
    }
    combatAction(actionId, targetIdx) {
        const result = this.combat.playerAction(actionId, targetIdx);
        if (result.result) {
            const scene = this.loader.scenes.get(this.currentSceneId);
            if (scene?.onExit) {
                this.state.apply(scene.onExit);
            }
            let next = this.currentSceneId;
            if (result.result === 'win') {
                if (this.combatRegionId && this.combatRoomId) {
                    const mut = this.state.world.regions[this.combatRegionId]?.mutations[this.combatRoomId];
                    this.combat
                        .getCurrentEnemyIds()
                        .forEach((id) => mut?.defeatedEnemies.add(id));
                }
                next = this.combatOnWin ?? next;
            }
            else {
                next = this.combatOnLose ?? next;
            }
            this.combatOnWin = undefined;
            this.combatOnLose = undefined;
            this.combatRoomId = undefined;
            this.combatRegionId = undefined;
            return this.start(next);
        }
        return result;
    }
}
export const narrativeManager = new NarrativeManager(contentLoader, gameState, combatSystem);
export default narrativeManager;

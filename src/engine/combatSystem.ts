export interface CombatStartPayload {
  inCombat: true;
}

export class CombatSystem {
  start(
    encounter: string | string[] | { randomPool: { value: string; weight?: number }[] },
    onWin?: string,
    onLose?: string,
  ): CombatStartPayload {
    // Stub implementation just enters combat immediately
    return { inCombat: true };
  }
}

export const combatSystem = new CombatSystem();
export default combatSystem;

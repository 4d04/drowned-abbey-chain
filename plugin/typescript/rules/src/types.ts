/* Content schema (registry + level packs) and game state shapes. Integers only; gold is whole GOLD. */

export const ABILITIES = ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const;
export type Ability = (typeof ABILITIES)[number];

// ---------- registry (global, append-only numeric ids) ----------

export interface AttackDef {
    name: string;
    bonus: number;
    damage: string; // dice expression, e.g. "1d8+3"
}

export interface ClassDef {
    id: number;
    hpBase: number; // + CON modifier
    ac: number;
    attack: AttackDef;
    proficient: Ability[];
    abilities: Record<string, number>; // ability key -> uses per delve
    hitDice: number; // short-rest hit dice per delve
}

export type MonsterTrait =
    | { kind: 'pack'; bonusPerAlly: number } // +N to hit per other living monster of the same template
    | { kind: 'onHitSave'; ability: Ability; dc: number; status: string }
    | { kind: 'aoeEvery'; every: number; damage: string; save: { ability: Ability; dc: number; half: boolean } }
    | { kind: 'recovers'; afterSeconds: number } // back to full HP if nobody has fought it for this long
    | { kind: 'quick' }; // (variant `quick`) strikes before the actor's action instead of after

export interface MonsterDef {
    id: number;
    hp: number;
    ac: number;
    attack: AttackDef;
    tags: string[]; // e.g. "undead", "boss"
    saves: Partial<Record<Ability, number>>;
    traits: MonsterTrait[];
    turnImmune?: boolean;
    initiative?: number; // added to its d20 when initiative is rolled (variants `ambush`, `initiative`); default 0
}

export interface ItemDef {
    id: number;
    rarity: 'common' | 'uncommon' | 'rare';
    price?: number; // shop buy price
    sellPrice?: number; // shop sell price (paid from item escrow)
    use?: { heal: string }; // consumable
    weapon?: { bonus: number; damage: string; bonusDamageVs?: Record<string, string> };
    acBonus?: number;
    advantageOn?: Ability[];
    grantsAbility?: Record<string, number>;
}

export interface StatusDef {
    id: number;
    rollBonus?: number; // applies to every d20 the character rolls
    disadvantage?: boolean; // next d20 roll
    attackAdvantage?: boolean; // next attack rolls
    charges: number; // default charges when applied
}

export interface Registry {
    classes: Record<string, ClassDef>;
    monsters: Record<string, MonsterDef>;
    items: Record<string, ItemDef>;
    statuses: Record<string, StatusDef>;
}

// ---------- level packs ----------

export type RoomRef = number | { level: number; room: number };

export type Condition =
    | { roomFlag: string; is?: boolean; room?: number }
    | { roomCounter: string; atLeast?: number; below?: number; room?: number }
    | { charFlag: string; is?: boolean }
    | { hasItem: string }
    | { class: string }
    | { abilityAtLeast: { ability: Ability; score: number } }
    | { monstersAlive: boolean }
    | { monsterStatus: { template?: string; status: MonsterStatus } }
    | { levelBossDefeated: number }
    | { goldAtLeast: number }
    | { lootAvailable: string }
    | { not: Condition }
    | { any: Condition[] };

export type Target = 'actor' | 'room';

export type Effect =
    | { op: 'damage'; dice: string; target?: Target; save?: { ability: Ability; dc: number; half: boolean } }
    | { op: 'heal'; dice: string; target?: Target }
    | { op: 'grantGold'; dice: string } // from the level budget
    | { op: 'grantLoot'; table: string; to?: 'actor' | 'pile' }
    | { op: 'grantItem'; item: string }
    | { op: 'setRoomFlag'; flag: string; value?: boolean; room?: number }
    | { op: 'incRoomCounter'; counter: string; by?: number; room?: number }
    | { op: 'setCharFlag'; flag: string }
    | { op: 'applyStatus'; status: string; charges?: number; target?: Target }
    | { op: 'spawnMonster'; template: string; room?: number; alert?: boolean }
    | { op: 'moveTo'; room: number }
    | { op: 'revealEdge'; to: number }
    | { op: 'narrate'; outcome: string }
    | { op: 'dropGold'; dice: string; pool: string } // carried -> room pool (recycled gold)
    | { op: 'payGold'; amount: number; pool?: string } // carried -> room pool, or treasury when no pool
    | { op: 'claimPool'; pool: string } // room pool -> carried
    | { op: 'setMonsters'; status: MonsterStatus; template?: string }
    | { op: 'monsterAttack'; advantage?: boolean }
    | { op: 'alertMonsters'; room?: number } // living monsters get advantage on their next attack
    | { op: 'consumeItem'; item: string };

export interface CheckDef {
    ability: Ability | Ability[]; // list = best modifier
    dc: number;
    save?: boolean; // flavor: a save rather than a check (same math)
    advantageIf?: Condition[]; // any match -> advantage
    disadvantage?: boolean;
    autoSuccessIf?: Condition[]; // any match -> no roll
}

export interface ActionDef {
    id: string;
    room: number;
    when?: Condition[];
    check?: CheckDef;
    provokes?: boolean | 'onFailure'; // default true
    effects?: Effect[]; // always (before success/failure branch)
    onSuccess?: Effect[];
    onFailure?: Effect[];
}

export interface LootTable {
    gold?: string; // dice expression, budgeted
    items?: string[]; // item templates (sellPrice is escrowed from the budget)
    once: boolean; // once per season
}

export interface EdgeDef {
    from: number;
    to: RoomRef;
    requires?: Condition[]; // gates from -> to only; the reverse edge is always open
    hidden?: boolean; // needs revealEdge in the `from` room
    oneWay?: boolean; // no automatic reverse edge (the way back is an action, e.g. wading out)
}

export interface RoomDef {
    id: number;
    key: string;
    camp?: boolean;
    monsters?: { template: string; status?: MonsterStatus }[]; // default status: hostile
    pools?: string[];
    onCleared?: Effect[]; // when the last hostile/wary monster dies or flees
}

export interface LevelDef {
    id: number;
    key: string;
    version: number;
    budget: number; // whole GOLD reserved per season
    entry: number; // room you arrive in from the camp / stairs
    camp?: number; // extraction room (level 1 only)
    bossRoom: number;
    season: { capSeconds: number; resetAfterBossSeconds: number; bellWarningSeconds: number }; // real time (timing.ts)
    wandering: string[];
    rooms: RoomDef[];
    edges: EdgeDef[];
    lootTables: Record<string, LootTable>;
    actions: ActionDef[];
}

// ---------- state ----------

export type MonsterStatus = 'hostile' | 'wary' | 'disguised' | 'friendly' | 'fled' | 'dead';

export interface MonsterState {
    template: string;
    hp: number;
    status: MonsterStatus;
    alert: boolean; // advantage on its next attack
    engaged: boolean; // has attacked or been attacked (sneak attack "unaware")
    lastEngagedAt: number; // height of its last attack or of the last attack on it
}

export interface Item {
    id: string;
    template: string;
    sourceLevel: number;
    escrow: number; // gold reserved from the source level budget for its sale price
}

/** What a downed character leaves behind when the Ferryman takes them (the name predates the rescue). */
export interface CorpseCache {
    charId: string;
    gold: number;
    items: Item[];
}

export interface RoomState {
    levelId: number;
    roomId: number;
    monsters: MonsterState[];
    flags: Record<string, boolean>;
    counters: Record<string, number>;
    pools: Record<string, number>;
    pile: Item[];
    pileGold: number; // budgeted gold already granted into the pile
    corpses: CorpseCache[];
}

export interface StatusState {
    id: string;
    charges: number;
}

// 'dead' is reserved: since the Ferryman rescue nothing kills a character permanently
export type CharStatus = 'rolling' | 'camp' | 'delving' | 'downed' | 'dead';

export interface Character {
    id: string;
    owner: string;
    name: string;
    classId: string;
    stats: number[]; // STR DEX CON INT WIS CHA
    hp: number;
    maxHp: number;
    levelId: number;
    room: number;
    prevRoom: number;
    carriedGold: number;
    inventory: Item[];
    statuses: StatusState[];
    abilityUses: Record<string, number>;
    hitDice: number;
    rested: boolean;
    flags: string[];
    status: CharStatus;
    downedAt: number;
    lastActionHeight: number; // last exchange committed or resolved (or entry): decides who lies low (§3.3) and who shares a Ferryman's toll
    /**
     * The party this character chose to travel with (SPEC §3.6): a character id, its own for a party it leads. Only the
     * character's owner sets it. When a member of the same party moves within a level, it comes along. Absent = none.
     */
    party?: string;
    // reserved for deeper levels (SPEC §5.4)
    xp: number;
    charLevel: number;
    features: string[];
}

export interface LevelState {
    id: number;
    season: number;
    seasonStart: number;
    bossKilledAt: number; // 0 = alive
    budgetReserved: number;
    budgetPaid: number; // gold + escrow granted this season
    scaleBp: number; // loot scaling in basis points (10000 = full tables; lower when the treasury runs short)
    lootTaken: string[];
}

/** Everything a resolution may read or write. The plugin loads exactly this before calling the engine. */
export interface Scene {
    height: number;
    level: LevelState;
    rooms: Record<number, RoomState>; // actor's room + any room an action's effects touch
    chars: Record<string, Character>; // every character in the actor's room (incl. actor)
    activeLevels: number[]; // for stairs to other levels
    /**
     * Standing characters in the actor's room that were NOT loaded into `chars` (the plugin loads room-mates only when an
     * action can affect them). Only presence checks use it, e.g. Sneak Attack's "an ally is in the room". Default 0.
     */
    othersStanding?: number;
    /** Characters in `chars` with a roll still sealed: they're locked, so a party move leaves them behind. */
    busy?: string[];
}

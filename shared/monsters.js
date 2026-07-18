// ============================================================
// Mythral - Monsters
// Each monster defines combat stats, level range, drops
// ============================================================

export const MONSTERS = {
  // ---- Lumina Isle (beginner) ----
  rat: {
    id: 'rat', name: 'Cave Rat', icon: '🐀', level: 1, hp: 18, attack: 4, defense: 1, speed: 3, xp: 6, gold: [1, 3],
    color: '#a78bfa', element: 'none',
    drops: [{ id: 'rat_tail', chance: 0.7 }, { id: 'gold_coin', chance: 0.5, qty: [1, 2] }],
    aggro: false, aggroRange: 4, attackRange: 1, moveCooldown: 600,
  },
  wild_dog: {
    id: 'wild_dog', name: 'Wild Dog', icon: '🐕', level: 2, hp: 28, attack: 6, defense: 2, speed: 5, xp: 9, gold: [2, 5],
    color: '#d97706', element: 'none',
    drops: [{ id: 'wolf_pelt', chance: 0.4 }, { id: 'gold_coin', chance: 0.6, qty: [1, 3] }],
    aggro: true, aggroRange: 5, attackRange: 1, moveCooldown: 500,
  },
  forest_goblin: {
    id: 'forest_goblin', name: 'Forest Goblin', icon: '👺', level: 3, hp: 38, attack: 8, defense: 3, speed: 4, xp: 14, gold: [3, 8],
    color: '#16a34a', element: 'none',
    drops: [{ id: 'goblin_ear', chance: 0.65 }, { id: 'leather_cap', chance: 0.05 }, { id: 'gold_coin', chance: 0.7, qty: [2, 5] }],
    aggro: true, aggroRange: 5, attackRange: 1, moveCooldown: 550,
  },
  giant_spider: {
    id: 'giant_spider', name: 'Giant Spider', icon: '🕷', level: 4, hp: 55, attack: 11, defense: 4, speed: 4, xp: 22, gold: [5, 12],
    color: '#7c2d12', element: 'none',
    drops: [{ id: 'spider_silk', chance: 0.6 }, { id: 'health_potion', chance: 0.1 }, { id: 'gold_coin', chance: 0.8, qty: [4, 8] }],
    aggro: true, aggroRange: 6, attackRange: 1, moveCooldown: 600,
  },
  dire_wolf: {
    id: 'dire_wolf', name: 'Dire Wolf', icon: '🐺', level: 5, hp: 70, attack: 14, defense: 5, speed: 6, xp: 30, gold: [6, 14],
    color: '#525252', element: 'none',
    drops: [{ id: 'wolf_pelt', chance: 0.7 }, { id: 'iron_ore', chance: 0.05 }, { id: 'gold_coin', chance: 0.85, qty: [5, 10] }],
    aggro: true, aggroRange: 7, attackRange: 1, moveCooldown: 450,
  },

  // ---- Emberfall Isle (fire) ----
  fire_beetle: {
    id: 'fire_beetle', name: 'Fire Beetle', icon: '🪲', level: 6, hp: 80, attack: 16, defense: 6, speed: 4, xp: 38, gold: [8, 18],
    color: '#ea580c', element: 'fire',
    drops: [{ id: 'ember_essence', chance: 0.5 }, { id: 'gold_coin', chance: 0.85, qty: [6, 12] }],
    aggro: false, aggroRange: 4, attackRange: 1, moveCooldown: 600,
  },
  lava_imp: {
    id: 'lava_imp', name: 'Lava Imp', icon: '😈', level: 8, hp: 110, attack: 22, defense: 7, speed: 5, xp: 55, gold: [12, 24],
    color: '#dc2626', element: 'fire',
    drops: [{ id: 'ember_essence', chance: 0.6 }, { id: 'greater_health_potion', chance: 0.08 }, { id: 'gold_coin', chance: 0.9, qty: [10, 18] }],
    aggro: true, aggroRange: 6, attackRange: 4, moveCooldown: 700,
  },
  magma_hound: {
    id: 'magma_hound', name: 'Magma Hound', icon: '🐕‍🦺', level: 10, hp: 160, attack: 28, defense: 9, speed: 7, xp: 80, gold: [15, 32],
    color: '#7c2d12', element: 'fire',
    drops: [{ id: 'ember_essence', chance: 0.7 }, { id: 'flamebrand', chance: 0.02 }, { id: 'gold_coin', chance: 0.95, qty: [12, 22] }],
    aggro: true, aggroRange: 7, attackRange: 1, moveCooldown: 450,
  },
  volcanic_golem: {
    id: 'volcanic_golem', name: 'Volcanic Golem', icon: '🗿', level: 14, hp: 320, attack: 38, defense: 18, speed: 2, xp: 160, gold: [30, 60],
    color: '#451a03', element: 'fire',
    drops: [{ id: 'ember_essence', chance: 0.85, qty: [2, 4] }, { id: 'iron_ore', chance: 0.5, qty: [2, 4] }, { id: 'plate_armor', chance: 0.05 }, { id: 'gold_coin', chance: 1, qty: [25, 50] }],
    aggro: false, aggroRange: 4, attackRange: 1, moveCooldown: 900, boss: false,
  },
  emberlord_pyros: {
    id: 'emberlord_pyros', name: 'Emberlord Pyros', icon: '🔥', level: 18, hp: 800, attack: 55, defense: 22, speed: 3, xp: 500, gold: [120, 200],
    color: '#dc2626', element: 'fire', boss: true,
    drops: [{ id: 'flamebrand', chance: 1 }, { id: 'dragonscale', chance: 1 }, { id: 'ember_essence', chance: 1, qty: [5, 10] }, { id: 'gold_coin', chance: 1, qty: [100, 180] }],
    aggro: true, aggroRange: 8, attackRange: 2, moveCooldown: 700,
  },

  // ---- Frostpeak Isle (ice) ----
  frost_wisp: {
    id: 'frost_wisp', name: 'Frost Wisp', icon: '👻', level: 7, hp: 90, attack: 18, defense: 5, speed: 5, xp: 45, gold: [10, 20],
    color: '#7dd3fc', element: 'ice',
    drops: [{ id: 'frost_shard', chance: 0.55 }, { id: 'gold_coin', chance: 0.85, qty: [8, 15] }],
    aggro: true, aggroRange: 6, attackRange: 4, moveCooldown: 700,
  },
  ice_wolf: {
    id: 'ice_wolf', name: 'Ice Wolf', icon: '🐺', level: 9, hp: 130, attack: 24, defense: 8, speed: 6, xp: 65, gold: [12, 26],
    color: '#bae6fd', element: 'ice',
    drops: [{ id: 'frost_shard', chance: 0.6 }, { id: 'wolf_pelt', chance: 0.5 }, { id: 'gold_coin', chance: 0.9, qty: [10, 20] }],
    aggro: true, aggroRange: 7, attackRange: 1, moveCooldown: 500,
  },
  yeti: {
    id: 'yeti', name: 'Yeti', icon: '🦍', level: 13, hp: 280, attack: 36, defense: 14, speed: 3, xp: 140, gold: [25, 55],
    color: '#e0e7ff', element: 'ice',
    drops: [{ id: 'frost_shard', chance: 0.75, qty: [2, 3] }, { id: 'plate_armor', chance: 0.04 }, { id: 'gold_coin', chance: 0.95, qty: [22, 45] }],
    aggro: true, aggroRange: 6, attackRange: 1, moveCooldown: 700,
  },
  frost_dragon: {
    id: 'frost_dragon', name: 'Frost Dragon', icon: '🐉', level: 20, hp: 950, attack: 62, defense: 25, speed: 4, xp: 600, gold: [150, 250],
    color: '#0ea5e9', element: 'ice', boss: true,
    drops: [{ id: 'crown_of_flames', chance: 1 }, { id: 'wyrm_scale', chance: 1, qty: [3, 6] }, { id: 'frost_shard', chance: 1, qty: [5, 10] }, { id: 'gold_coin', chance: 1, qty: [130, 220] }],
    aggro: true, aggroRange: 9, attackRange: 3, moveCooldown: 650,
  },

  // ---- Mistwood Isle (forest/magic) ----
  moss_snake: {
    id: 'moss_snake', name: 'Moss Snake', icon: '🐍', level: 7, hp: 95, attack: 17, defense: 6, speed: 4, xp: 42, gold: [9, 18],
    color: '#84cc16', element: 'none',
    drops: [{ id: 'mist_petal', chance: 0.5 }, { id: 'gold_coin', chance: 0.85, qty: [7, 14] }],
    aggro: false, aggroRange: 4, attackRange: 1, moveCooldown: 600,
  },
  dryad_guardian: {
    id: 'dryad_guardian', name: 'Dryad Guardian', icon: '🧚', level: 11, hp: 200, attack: 30, defense: 12, speed: 4, xp: 110, gold: [20, 42],
    color: '#22c55e', element: 'none',
    drops: [{ id: 'mist_petal', chance: 0.7, qty: [2, 3] }, { id: 'arcane_focus', chance: 0.04 }, { id: 'gold_coin', chance: 0.92, qty: [16, 35] }],
    aggro: false, aggroRange: 4, attackRange: 5, moveCooldown: 700,
  },
  treant: {
    id: 'treant', name: 'Treant', icon: '🌳', level: 15, hp: 380, attack: 42, defense: 20, speed: 1, xp: 200, gold: [35, 75],
    color: '#166534', element: 'none',
    drops: [{ id: 'mist_petal', chance: 0.8, qty: [3, 5] }, { id: 'iron_ore', chance: 0.3, qty: [2, 4] }, { id: 'boots_of_striding', chance: 0.05 }, { id: 'gold_coin', chance: 1, qty: [30, 60] }],
    aggro: false, aggroRange: 4, attackRange: 2, moveCooldown: 1000,
  },
  whispering_wraith: {
    id: 'whispering_wraith', name: 'Whispering Wraith', icon: '💀', level: 17, hp: 280, attack: 50, defense: 10, speed: 6, xp: 280, gold: [40, 80],
    color: '#a78bfa', element: 'shadow',
    drops: [{ id: 'void_crystal', chance: 0.15 }, { id: 'arcane_circlet', chance: 0.06 }, { id: 'gold_coin', chance: 1, qty: [35, 70] }],
    aggro: true, aggroRange: 8, attackRange: 4, moveCooldown: 600,
  },
  wraith_queen_sylvana: {
    id: 'wraith_queen_sylvana', name: 'Wraith Queen Sylvana', icon: '👻', level: 18, hp: 1100, attack: 60, defense: 18, speed: 5, xp: 700, gold: [180, 300],
    color: '#7c3aed', element: 'shadow', boss: true,
    drops: [{ id: 'arcane_focus', chance: 1 }, { id: 'archmage_robe', chance: 1 }, { id: 'void_crystal', chance: 1, qty: [3, 5] }, { id: 'gold_coin', chance: 1, qty: [160, 280] }],
    aggro: true, aggroRange: 10, attackRange: 5, moveCooldown: 600,
  },

  // ---- Sunscar Isle (desert) ----
  sand_scorpion: {
    id: 'sand_scorpion', name: 'Sand Scorpion', icon: '🦂', level: 8, hp: 120, attack: 21, defense: 9, speed: 4, xp: 60, gold: [10, 22],
    color: '#ca8a04', element: 'none',
    drops: [{ id: 'iron_ore', chance: 0.4 }, { id: 'gold_coin', chance: 0.9, qty: [8, 16] }],
    aggro: true, aggroRange: 6, attackRange: 1, moveCooldown: 600,
  },
  desert_raider: {
    id: 'desert_raider', name: 'Desert Raider', icon: '🗡', level: 11, hp: 190, attack: 28, defense: 11, speed: 5, xp: 105, gold: [22, 45],
    color: '#b45309', element: 'none',
    drops: [{ id: 'iron_sword', chance: 0.08 }, { id: 'chainmail', chance: 0.05 }, { id: 'gold_coin', chance: 0.95, qty: [18, 38] }],
    aggro: true, aggroRange: 7, attackRange: 1, moveCooldown: 550,
  },
  mummy_lord: {
    id: 'mummy_lord', name: 'Mummy Lord', icon: '🧟', level: 16, hp: 350, attack: 45, defense: 16, speed: 2, xp: 240, gold: [40, 85],
    color: '#d97706', element: 'shadow',
    drops: [{ id: 'ancient_talisman', chance: 0.15 }, { id: 'sunstone', chance: 0.25 }, { id: 'arcane_focus', chance: 0.05 }, { id: 'gold_coin', chance: 1, qty: [35, 70] }],
    aggro: false, aggroRange: 5, attackRange: 4, moveCooldown: 800,
  },
  sun_titan: {
    id: 'sun_titan', name: 'Sun Titan', icon: '🗿', level: 22, hp: 1100, attack: 70, defense: 28, speed: 3, xp: 700, gold: [180, 300],
    color: '#facc15', element: 'fire', boss: true,
    drops: [{ id: 'dawnbringer', chance: 1 }, { id: 'sunstone', chance: 1, qty: [3, 6] }, { id: 'crown_of_flames', chance: 0.5 }, { id: 'gold_coin', chance: 1, qty: [160, 280] }],
    aggro: true, aggroRange: 8, attackRange: 3, moveCooldown: 750,
  },

  // ---- Tidehaven Isle (coastal/water) ----
  crab: {
    id: 'crab', name: 'Giant Crab', icon: '🦀', level: 7, hp: 110, attack: 16, defense: 10, speed: 3, xp: 50, gold: [8, 18],
    color: '#f97316', element: 'none',
    drops: [{ id: 'pearl', chance: 0.1 }, { id: 'gold_coin', chance: 0.85, qty: [6, 14] }],
    aggro: false, aggroRange: 4, attackRange: 1, moveCooldown: 700,
  },
  murloc: {
    id: 'murloc', name: 'Murloc', icon: '🐟', level: 9, hp: 140, attack: 22, defense: 7, speed: 5, xp: 70, gold: [12, 26],
    color: '#06b6d4', element: 'water',
    drops: [{ id: 'pearl', chance: 0.15 }, { id: 'health_potion', chance: 0.12 }, { id: 'gold_coin', chance: 0.9, qty: [10, 22] }],
    aggro: true, aggroRange: 6, attackRange: 1, moveCooldown: 550,
  },
  sea_serpent: {
    id: 'sea_serpent', name: 'Sea Serpent', icon: '🐲', level: 14, hp: 300, attack: 40, defense: 13, speed: 5, xp: 170, gold: [30, 65],
    color: '#0891b2', element: 'water',
    drops: [{ id: 'pearl', chance: 0.4, qty: [1, 2] }, { id: 'tower_shield', chance: 0.05 }, { id: 'gold_coin', chance: 1, qty: [25, 55] }],
    aggro: true, aggroRange: 7, attackRange: 3, moveCooldown: 600,
  },
  kraken: {
    id: 'kraken', name: 'The Kraken', icon: '🐙', level: 20, hp: 1000, attack: 65, defense: 24, speed: 3, xp: 650, gold: [160, 280],
    color: '#7c3aed', element: 'water', boss: true,
    drops: [{ id: 'staff_of_storms', chance: 1 }, { id: 'pearl', chance: 1, qty: [5, 10] }, { id: 'tower_shield', chance: 0.6 }, { id: 'gold_coin', chance: 1, qty: [150, 250] }],
    aggro: true, aggroRange: 9, attackRange: 4, moveCooldown: 700,
  },

  // ---- Shadowfen Isle (swamp/undead) ----
  bog_spirit: {
    id: 'bog_spirit', name: 'Bog Spirit', icon: '👻', level: 10, hp: 160, attack: 24, defense: 6, speed: 5, xp: 85, gold: [14, 30],
    color: '#65a30d', element: 'shadow',
    drops: [{ id: 'bone_fragment', chance: 0.4 }, { id: 'gold_coin', chance: 0.9, qty: [12, 25] }],
    aggro: true, aggroRange: 7, attackRange: 4, moveCooldown: 650,
  },
  skeleton: {
    id: 'skeleton', name: 'Skeleton Warrior', icon: '💀', level: 12, hp: 200, attack: 30, defense: 10, speed: 4, xp: 115, gold: [16, 35],
    color: '#e5e7eb', element: 'shadow',
    drops: [{ id: 'bone_fragment', chance: 0.7 }, { id: 'iron_sword', chance: 0.06 }, { id: 'iron_helm', chance: 0.08 }, { id: 'gold_coin', chance: 0.95, qty: [14, 30] }],
    aggro: true, aggroRange: 6, attackRange: 1, moveCooldown: 550,
  },
  plague_lich: {
    id: 'plague_lich', name: 'Plague Lich', icon: '☠', level: 17, hp: 380, attack: 48, defense: 14, speed: 3, xp: 260, gold: [40, 80],
    color: '#84cc16', element: 'shadow',
    drops: [{ id: 'bone_fragment', chance: 0.8, qty: [2, 3] }, { id: 'arcane_circlet', chance: 0.08 }, { id: 'greater_mana_potion', chance: 0.2 }, { id: 'gold_coin', chance: 1, qty: [35, 70] }],
    aggro: true, aggroRange: 7, attackRange: 5, moveCooldown: 700,
  },
  death_knight: {
    id: 'death_knight', name: 'Death Knight', icon: '♞', level: 19, hp: 600, attack: 58, defense: 22, speed: 4, xp: 420, gold: [80, 150],
    color: '#1f2937', element: 'shadow',
    drops: [{ id: 'steel_longsword', chance: 0.3 }, { id: 'plate_armor', chance: 0.2 }, { id: 'void_crystal', chance: 0.25 }, { id: 'gold_coin', chance: 1, qty: [70, 130] }],
    aggro: true, aggroRange: 8, attackRange: 1, moveCooldown: 500,
  },
  lich_queen_mortis: {
    id: 'lich_queen_mortis', name: 'Lich Queen Mortis', icon: '👑', level: 22, hp: 1300, attack: 75, defense: 26, speed: 3, xp: 850, gold: [220, 380],
    color: '#16a34a', element: 'shadow', boss: true,
    drops: [{ id: 'voidheart_relic', chance: 1 }, { id: 'hierophant_robe', chance: 1 }, { id: 'void_crystal', chance: 1, qty: [3, 6] }, { id: 'gold_coin', chance: 1, qty: [200, 350] }],
    aggro: true, aggroRange: 9, attackRange: 5, moveCooldown: 650,
  },

  // ---- Skyreach Isle (floating, elementals) ----
  cloud_sprite: {
    id: 'cloud_sprite', name: 'Cloud Sprite', icon: '☁', level: 12, hp: 180, attack: 26, defense: 8, speed: 7, xp: 110, gold: [16, 32],
    color: '#e0e7ff', element: 'air',
    drops: [{ id: 'gold_coin', chance: 0.9, qty: [14, 28] }, { id: 'swift_boots', chance: 0.05 }],
    aggro: false, aggroRange: 5, attackRange: 4, moveCooldown: 500,
  },
  harpy: {
    id: 'harpy', name: 'Harpy', icon: '🦅', level: 14, hp: 240, attack: 35, defense: 10, speed: 8, xp: 150, gold: [22, 45],
    color: '#a16207', element: 'air',
    drops: [{ id: 'gold_coin', chance: 0.95, qty: [18, 38] }, { id: 'swift_boots', chance: 0.08 }, { id: 'ring_of_vigor', chance: 0.05 }],
    aggro: true, aggroRange: 8, attackRange: 2, moveCooldown: 450,
  },
  storm_elemental: {
    id: 'storm_elemental', name: 'Storm Elemental', icon: '⚡', level: 16, hp: 320, attack: 44, defense: 12, speed: 5, xp: 220, gold: [35, 70],
    color: '#fbbf24', element: 'air',
    drops: [{ id: 'arcane_focus', chance: 0.1 }, { id: 'ring_of_wisdom', chance: 0.08 }, { id: 'gold_coin', chance: 1, qty: [30, 60] }],
    aggro: true, aggroRange: 7, attackRange: 5, moveCooldown: 600,
  },
  thunder_drake: {
    id: 'thunder_drake', name: 'Thunder Drake', icon: '🐉', level: 20, hp: 950, attack: 68, defense: 22, speed: 6, xp: 620, gold: [150, 260],
    color: '#facc15', element: 'air', boss: true,
    drops: [{ id: 'staff_of_storms', chance: 1 }, { id: 'wyrm_scale', chance: 1, qty: [4, 7] }, { id: 'crown_of_flames', chance: 0.4 }, { id: 'gold_coin', chance: 1, qty: [140, 240] }],
    aggro: true, aggroRange: 9, attackRange: 4, moveCooldown: 550,
  },

  // ---- Voidheart Isle (end-game demons) ----
  void_spawn: {
    id: 'void_spawn', name: 'Void Spawn', icon: '👾', level: 18, hp: 380, attack: 50, defense: 15, speed: 6, xp: 290, gold: [45, 90],
    color: '#7c3aed', element: 'shadow',
    drops: [{ id: 'void_crystal', chance: 0.3 }, { id: 'super_health_potion', chance: 0.15 }, { id: 'gold_coin', chance: 1, qty: [40, 75] }],
    aggro: true, aggroRange: 8, attackRange: 3, moveCooldown: 550,
  },
  demon_brute: {
    id: 'demon_brute', name: 'Demon Brute', icon: '👹', level: 20, hp: 550, attack: 62, defense: 20, speed: 4, xp: 400, gold: [70, 130],
    color: '#991b1b', element: 'fire',
    drops: [{ id: 'void_crystal', chance: 0.35 }, { id: 'flamebrand', chance: 0.06 }, { id: 'dragonscale', chance: 0.04 }, { id: 'gold_coin', chance: 1, qty: [60, 110] }],
    aggro: true, aggroRange: 7, attackRange: 1, moveCooldown: 550,
  },
  shadow_demon: {
    id: 'shadow_demon', name: 'Shadow Demon', icon: '👿', level: 22, hp: 700, attack: 72, defense: 18, speed: 7, xp: 520, gold: [90, 170],
    color: '#1e1b4b', element: 'shadow',
    drops: [{ id: 'void_crystal', chance: 0.5, qty: [1, 2] }, { id: 'arcane_circlet', chance: 0.1 }, { id: 'amulet_of_warding', chance: 0.08 }, { id: 'gold_coin', chance: 1, qty: [80, 150] }],
    aggro: true, aggroRange: 9, attackRange: 4, moveCooldown: 500,
  },
  voidlord_acheron: {
    id: 'voidlord_acheron', name: 'Voidlord Acheron', icon: '☠', level: 25, hp: 2000, attack: 95, defense: 32, speed: 4, xp: 1500, gold: [400, 700],
    color: '#000', element: 'shadow', boss: true, finalBoss: true,
    drops: [{ id: 'dragonscale', chance: 1 }, { id: 'crown_of_flames', chance: 1 }, { id: 'void_crystal', chance: 1, qty: [10, 15] }, { id: 'gold_coin', chance: 1, qty: [380, 650] }],
    aggro: true, aggroRange: 10, attackRange: 5, moveCooldown: 600,
  },
}

export function getMonster(id) {
  return MONSTERS[id]
}

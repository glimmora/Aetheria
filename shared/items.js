// ============================================================
// Mythral - Items
// ============================================================

export const ITEMS = {
  // ---- Weapons ----
  rusted_sword: { id: 'rusted_sword', name: 'Rusted Sword', type: 'weapon', slot: 'weapon', class: 'warrior', attack: 4, value: 5, desc: 'A worn blade, but it still cuts.', icon: '🗡' },
  iron_sword: { id: 'iron_sword', name: 'Iron Sword', type: 'weapon', slot: 'weapon', class: 'warrior', attack: 10, value: 60, desc: 'A reliable iron blade.', icon: '🗡' },
  steel_longsword: { id: 'steel_longsword', name: 'Steel Longsword', type: 'weapon', slot: 'weapon', class: 'warrior', attack: 18, value: 180, desc: 'A longsword of tempered steel.', icon: '⚔', reqLevel: 6 },
  flamebrand: { id: 'flamebrand', name: 'Flamebrand', type: 'weapon', slot: 'weapon', class: 'warrior', attack: 30, element: 'fire', value: 600, desc: 'A blade ever wreathed in flame.', icon: '🔥', reqLevel: 14 },

  apprentice_staff: { id: 'apprentice_staff', name: 'Apprentice Staff', type: 'weapon', slot: 'weapon', class: 'mage', magic: 4, value: 5, desc: 'A simple wooden staff.', icon: '⊹' },
  oak_staff: { id: 'oak_staff', name: 'Oak Staff', type: 'weapon', slot: 'weapon', class: 'mage', magic: 10, value: 70, desc: 'A staff carved from ancient oak.', icon: '⊹' },
  arcane_focus: { id: 'arcane_focus', name: 'Arcane Focus', type: 'weapon', slot: 'weapon', class: 'mage', magic: 20, value: 240, desc: 'A crystal-tipped focus humming with power.', icon: '✦', reqLevel: 8 },
  staff_of_storms: { id: 'staff_of_storms', name: 'Staff of Storms', type: 'weapon', slot: 'weapon', class: 'mage', magic: 34, value: 720, desc: 'Crackles with captured lightning.', icon: '⚡', reqLevel: 16 },

  short_bow: { id: 'short_bow', name: 'Short Bow', type: 'weapon', slot: 'weapon', class: 'ranger', attack: 5, value: 8, desc: 'A simple hunting bow.', icon: '➷' },
  yew_bow: { id: 'yew_bow', name: 'Yew Bow', type: 'weapon', slot: 'weapon', class: 'ranger', attack: 12, value: 80, desc: 'A flexible bow of polished yew.', icon: '➷' },
  crossbow: { id: 'crossbow', name: 'Heavy Crossbow', type: 'weapon', slot: 'weapon', class: 'ranger', attack: 22, value: 260, desc: 'A mechanical bow that hits hard.', icon: '➹', reqLevel: 8 },
  phoenix_bow: { id: 'phoenix_bow', name: 'Phoenix Bow', type: 'weapon', slot: 'weapon', class: 'ranger', attack: 36, element: 'fire', value: 780, desc: 'Arrows ignite in flight.', icon: '🔥', reqLevel: 16 },

  oak_mace: { id: 'oak_mace', name: 'Oak Mace', type: 'weapon', slot: 'weapon', class: 'healer', attack: 4, magic: 2, value: 8, desc: 'A simple mace for the faithful.', icon: '✧' },
  blessed_mace: { id: 'blessed_mace', name: 'Blessed Mace', type: 'weapon', slot: 'weapon', class: 'healer', attack: 8, magic: 8, value: 90, desc: 'A mace anointed with holy water.', icon: '✧' },
  sun_scepter: { id: 'sun_scepter', name: 'Sun Scepter', type: 'weapon', slot: 'weapon', class: 'healer', attack: 14, magic: 18, value: 280, desc: 'Radiates warmth and power.', icon: '☀', reqLevel: 8 },
  dawnbringer: { id: 'dawnbringer', name: 'Dawnbringer', type: 'weapon', slot: 'weapon', class: 'healer', attack: 22, magic: 30, value: 800, desc: 'Forged at sunrise on the highest peak.', icon: '☀', reqLevel: 16 },

  // ---- Armor ----
  leather_armor: { id: 'leather_armor', name: 'Leather Armor', type: 'armor', slot: 'armor', defense: 4, value: 15, desc: 'Boiled leather, light and flexible.', icon: '🛡' },
  chainmail: { id: 'chainmail', name: 'Chainmail', type: 'armor', slot: 'armor', defense: 9, value: 90, desc: 'Interlocked iron rings.', icon: '🛡', reqLevel: 5 },
  plate_armor: { id: 'plate_armor', name: 'Plate Armor', type: 'armor', slot: 'armor', defense: 16, value: 280, desc: 'Full plate, heavy but protective.', icon: '🛡', reqLevel: 12 },
  dragonscale: { id: 'dragonscale', name: 'Dragonscale Armor', type: 'armor', slot: 'armor', defense: 26, value: 900, desc: 'Scaled like a wyrm, fire-resistant.', icon: '🐉', reqLevel: 20 },

  apprentice_robe: { id: 'apprentice_robe', name: 'Apprentice Robe', type: 'armor', slot: 'armor', defense: 2, magic: 3, value: 10, desc: 'Embroidered with simple runes.', icon: '🧥' },
  sorcerer_robe: { id: 'sorcerer_robe', name: "Sorcerer's Robe", type: 'armor', slot: 'armor', defense: 5, magic: 10, value: 110, desc: 'Worn by mages of the Tower.', icon: '🧥', reqLevel: 5 },
  archmage_robe: { id: 'archmage_robe', name: 'Archmage Robe', type: 'armor', slot: 'armor', defense: 10, magic: 22, value: 350, desc: 'Threaded with astral silk.', icon: '🧥', reqLevel: 14 },

  acolyte_vestments: { id: 'acolyte_vestments', name: 'Acolyte Vestments', type: 'armor', slot: 'armor', defense: 3, magic: 4, value: 12, desc: 'Humble robes of a temple servant.', icon: '🧥' },
  priest_vestments: { id: 'priest_vestments', name: 'Priest Vestments', type: 'armor', slot: 'armor', defense: 6, magic: 9, value: 100, desc: 'Embroidered with sun motifs.', icon: '🧥', reqLevel: 5 },
  hierophant_robe: { id: 'hierophant_robe', name: 'Hierophant Robe', type: 'armor', slot: 'armor', defense: 11, magic: 20, value: 320, desc: 'Worn by the high priests of Mythral.', icon: '🧥', reqLevel: 14 },

  // ---- Helmets ----
  leather_cap: { id: 'leather_cap', name: 'Leather Cap', type: 'armor', slot: 'helmet', defense: 1, value: 5, desc: 'A simple cap.', icon: '⛑' },
  iron_helm: { id: 'iron_helm', name: 'Iron Helm', type: 'armor', slot: 'helmet', defense: 3, value: 40, desc: 'A solid iron helmet.', icon: '⛑', reqLevel: 4 },
  arcane_circlet: { id: 'arcane_circlet', name: 'Arcane Circlet', type: 'armor', slot: 'helmet', defense: 2, magic: 6, value: 120, desc: 'A silver circlet for spellcasters.', icon: '👑', reqLevel: 6 },
  crown_of_flames: { id: 'crown_of_flames', name: 'Crown of Flames', type: 'armor', slot: 'helmet', defense: 6, magic: 10, value: 450, desc: 'Burns eternally without harming its wearer.', icon: '👑', reqLevel: 16 },

  // ---- Shields ----
  wooden_shield: { id: 'wooden_shield', name: 'Wooden Shield', type: 'armor', slot: 'shield', defense: 2, value: 10, desc: 'A round wooden shield.', icon: '🛡' },
  iron_shield: { id: 'iron_shield', name: 'Iron Shield', type: 'armor', slot: 'shield', defense: 5, value: 60, desc: 'A sturdy iron shield.', icon: '🛡', reqLevel: 4 },
  tower_shield: { id: 'tower_shield', name: 'Tower Shield', type: 'armor', slot: 'shield', defense: 10, value: 200, desc: 'A massive shield that hides its bearer.', icon: '🛡', reqLevel: 12 },

  // ---- Boots ----
  leather_boots: { id: 'leather_boots', name: 'Leather Boots', type: 'armor', slot: 'boots', defense: 1, value: 5, desc: 'Sturdy walking boots.', icon: '👢' },
  swift_boots: { id: 'swift_boots', name: 'Swift Boots', type: 'armor', slot: 'boots', defense: 2, speed: 2, value: 80, desc: 'Light as a feather.', icon: '👢', reqLevel: 6 },
  boots_of_striding: { id: 'boots_of_striding', name: 'Boots of Striding', type: 'armor', slot: 'boots', defense: 4, speed: 3, value: 220, desc: 'Increase movement speed significantly.', icon: '👢', reqLevel: 12 },

  // ---- Consumables ----
  health_potion: { id: 'health_potion', name: 'Health Potion', type: 'consumable', value: 25, heal: 60, desc: 'Restores 60 HP.', icon: '🧪' },
  greater_health_potion: { id: 'greater_health_potion', name: 'Greater Health Potion', type: 'consumable', value: 70, heal: 180, desc: 'Restores 180 HP.', icon: '🧪', reqLevel: 8 },
  super_health_potion: { id: 'super_health_potion', name: 'Super Health Potion', type: 'consumable', value: 200, heal: 450, desc: 'Restores 450 HP.', icon: '🧪', reqLevel: 16 },
  mana_potion: { id: 'mana_potion', name: 'Mana Potion', type: 'consumable', value: 30, mana: 60, desc: 'Restores 60 MP.', icon: '🔵' },
  greater_mana_potion: { id: 'greater_mana_potion', name: 'Greater Mana Potion', type: 'consumable', value: 80, mana: 160, desc: 'Restores 160 MP.', icon: '🔵', reqLevel: 8 },
  bread: { id: 'bread', name: 'Bread', type: 'consumable', value: 4, heal: 15, desc: 'A simple loaf. Restores 15 HP.', icon: '🍞' },
  roasted_meat: { id: 'roasted_meat', name: 'Roasted Meat', type: 'consumable', value: 12, heal: 40, desc: 'A hearty meal. Restores 40 HP.', icon: '🍖' },
  apple: { id: 'apple', name: 'Apple', type: 'consumable', value: 2, heal: 8, desc: 'A fresh red apple. Restores 8 HP.', icon: '🍎' },
  elixir_of_might: { id: 'elixir_of_might', name: 'Elixir of Might', type: 'consumable', value: 100, buff: { attack: 5, duration: 60000 }, desc: '+5 Attack for 60 seconds.', icon: '⚗' },

  // ---- Materials / Loot ----
  wolf_pelt: { id: 'wolf_pelt', name: 'Wolf Pelt', type: 'material', value: 8, desc: 'A coarse gray pelt.', icon: '🟤' },
  rat_tail: { id: 'rat_tail', name: 'Rat Tail', type: 'material', value: 2, desc: 'A hairless rat tail.', icon: '🪢' },
  goblin_ear: { id: 'goblin_ear', name: 'Goblin Ear', type: 'material', value: 6, desc: 'Proof of a slain goblin.', icon: '👂' },
  spider_silk: { id: 'spider_silk', name: 'Spider Silk', type: 'material', value: 10, desc: 'Strong, sticky thread.', icon: '🕸' },
  iron_ore: { id: 'iron_ore', name: 'Iron Ore', type: 'material', value: 12, desc: 'A chunk of raw iron.', icon: '🪨' },
  frost_shard: { id: 'frost_shard', name: 'Frost Shard', type: 'material', value: 25, desc: 'A sliver of eternal ice.', icon: '❄' },
  ember_essence: { id: 'ember_essence', name: 'Ember Essence', type: 'material', value: 30, desc: 'Glowing liquid fire.', icon: '🔥' },
  bone_fragment: { id: 'bone_fragment', name: 'Bone Fragment', type: 'material', value: 5, desc: 'A yellowed bone shard.', icon: '🦴' },
  wyrm_scale: { id: 'wyrm_scale', name: 'Wyrm Scale', type: 'material', value: 80, desc: 'A shimmering dragon scale.', icon: '🐲' },
  void_crystal: { id: 'void_crystal', name: 'Void Crystal', type: 'material', value: 200, desc: 'A crystal of pure darkness.', icon: '🔮' },
  pearl: { id: 'pearl', name: 'Pearl', type: 'material', value: 50, desc: 'A lustrous ocean pearl.', icon: '⚪' },
  sunstone: { id: 'sunstone', name: 'Sunstone', type: 'material', value: 75, desc: 'Warm to the touch, glows at night.', icon: '🔆' },
  mist_petal: { id: 'mist_petal', name: 'Mist Petal', type: 'material', value: 18, desc: 'A petal from a Mistwood bloom.', icon: '🌸' },
  gold_coin: { id: 'gold_coin', name: 'Gold Coin', type: 'currency', value: 1, desc: 'The currency of Mythral.', icon: '🪙' },

  // ---- Keys / Quest Items ----
  rusty_key: { id: 'rusty_key', name: 'Rusty Key', type: 'key', value: 0, desc: 'Opens something forgotten.', icon: '🗝' },
  cellar_key: { id: 'cellar_key', name: 'Cellar Key', type: 'key', value: 0, desc: "Opens Mira's cellar.", icon: '🗝' },
  ancient_talisman: { id: 'ancient_talisman', name: 'Ancient Talisman', type: 'quest', value: 0, desc: 'A carved bone talisman from Sunscar ruins.', icon: '🦴' },
  captain_ledger: { id: 'captain_ledger', name: "Captain's Ledger", type: 'quest', value: 0, desc: "Smuggler records from Tidehaven's docks.", icon: '📓' },
  voidheart_relic: { id: 'voidheart_relic', name: 'Voidheart Relic', type: 'quest', value: 0, desc: 'A pulsing orb of pure darkness.', icon: '🔮' },

  // ---- Rings / Trinkets ----
  copper_ring: { id: 'copper_ring', name: 'Copper Ring', type: 'trinket', slot: 'trinket', defense: 1, value: 30, desc: 'A simple copper band.', icon: '💍' },
  ring_of_vigor: { id: 'ring_of_vigor', name: 'Ring of Vigor', type: 'trinket', slot: 'trinket', hp: 30, value: 150, desc: '+30 Maximum HP.', icon: '💍', reqLevel: 5 },
  ring_of_wisdom: { id: 'ring_of_wisdom', name: 'Ring of Wisdom', type: 'trinket', slot: 'trinket', mp: 30, value: 150, desc: '+30 Maximum MP.', icon: '💍', reqLevel: 5 },
  amulet_of_warding: { id: 'amulet_of_warding', name: 'Amulet of Warding', type: 'trinket', slot: 'trinket', defense: 4, value: 200, desc: '+4 Defense.', icon: '📿', reqLevel: 8 },
}

export function getItem(id) {
  return ITEMS[id]
}

export function isEquipment(item) {
  return item && (item.type === 'weapon' || item.type === 'armor' || item.type === 'trinket')
}

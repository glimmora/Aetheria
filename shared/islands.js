// ============================================================
// Mythral - Master island definitions
// All 9 islands, each with 8-18 NPCs, monsters, quests
// ============================================================

import { TILE, TILE_INFO } from './tiles.js'
import { generateIslandMap, findSpawnPoints, getVillageCenter } from './islandGenerator.js'

// ============================================================
// ISLAND 1: LUMINA ISLE (Beginner, level 1-5)
// ============================================================
const luminaNpcs = [
  { id: 'lumina elder_ravenna', name: 'Elder Ravenna', role: 'Village Elder', x: 0, y: 0, color: '#fde047', dialog: 'Welcome, traveler, to Lumina Isle, the first spark of Mythral. Our isle is gentle, but the world beyond is not. Speak with our folk, and you will find your purpose.', shop: null, quest: 'lumina_goblins' },
  { id: 'lumina mira', name: 'Mira the Baker', role: 'Baker', x: 0, y: 0, color: '#fb923c', dialog: 'Fresh bread today! Just three coins a loaf. Oh, but my cellar has rats again. Would you help me, dear?', shop: { name: "Mira's Bakery", items: [{ id: 'bread', price: 3, stock: 99 }, { id: 'apple', price: 2, stock: 50 }, { id: 'roasted_meat', price: 12, stock: 20 }] }, quest: 'lumina_rats' },
  { id: 'lumina thom', name: 'Thom Blacksmith', role: 'Blacksmith', x: 0, y: 0, color: '#9ca3af', dialog: 'Need a blade? I forge the finest iron in Lumina. Bring me ore and I will reward you.', shop: { name: "Thom's Forge", items: [{ id: 'iron_sword', price: 60, stock: 5 }, { id: 'leather_armor', price: 15, stock: 8 }, { id: 'wooden_shield', price: 10, stock: 6 }, { id: 'leather_cap', price: 5, stock: 10 }] }, quest: 'lumina_ore' },
  { id: 'lumina old_pip', name: 'Old Pip', role: 'Fisherman', x: 0, y: 0, color: '#0ea5e9', dialog: 'Aye, I have fished these waters for sixty years. The sea remembers everything. Even what the land tries to forget.', shop: null, quest: 'lumina_dog' },
  { id: 'lumina sister_lyra', name: 'Sister Lyra', role: 'Healer', x: 0, y: 0, color: '#f472b6', dialog: 'May the Light keep you. I tend to the wounded of Lumina. Potions I have, if you have coin.', shop: { name: "Lyra's Apothecary", items: [{ id: 'health_potion', price: 25, stock: 20 }, { id: 'mana_potion', price: 30, stock: 15 }, { id: 'elixir_of_might', price: 100, stock: 3 }] }, quest: 'lumina_herbs' },
  { id: 'lumina finn', name: 'Finn the Hunter', role: 'Hunter', x: 0, y: 0, color: '#16a34a', dialog: 'Wolves stalk the eastern woods. Kill five of them and I will teach you the way of the bow.', shop: { name: "Finn's Outpost", items: [{ id: 'short_bow', price: 8, stock: 5 }, { id: 'leather_boots', price: 5, stock: 6 }] }, quest: 'lumina_wolves' },
  { id: 'lumina marcus', name: 'Marcus the Sailor', role: 'Sailor', x: 0, y: 0, color: '#0284c7', dialog: 'My ship can take you to Emberfall Isle when you are strong enough. Speak to me at the dock.', shop: null, travel: 'emberfall', reqLevel: 5 },
  { id: 'lumina collector', name: 'Antique Collector', role: 'Collector', x: 0, y: 0, color: '#a855f7', dialog: 'I pay well for curiosities. Bring me three spider silks, and I shall reward your trouble.', shop: null, quest: 'lumina_silk' },
]

// ============================================================
// ISLAND 2: EMBERFALL ISLE (Fire biome, level 5-10)
// ============================================================
const emberfallNpcs = [
  { id: 'ember warden_kael', name: 'Warden Kael', role: 'Volcano Warden', x: 0, y: 0, color: '#dc2626', dialog: 'Emberfall is no place for the timid. Lava flows have grown restless, and the beasts grow bold. Tread carefully, hero.', shop: null, quest: 'ember_beetles' },
  { id: 'ember smitty', name: 'Smitty the Smith', role: 'Master Smith', x: 0, y: 0, color: '#f59e0b', dialog: 'The volcanic rock here holds ember essence. Bring me six vials and I will forge you a steel longsword - free of charge.', shop: { name: "Smitty's Volcano Forge", items: [{ id: 'steel_longsword', price: 180, stock: 3 }, { id: 'chainmail', price: 90, stock: 4 }, { id: 'iron_helm', price: 40, stock: 6 }, { id: 'iron_shield', price: 60, stock: 5 }] }, quest: 'ember_essence' },
  { id: 'ember priestess_ember', name: 'Priestess Ember', role: 'Flame Priestess', x: 0, y: 0, color: '#f97316', dialog: 'The Emberlord Pyros stirs in the caldera. He must be stopped before his flames consume Mythral.', shop: { name: "Ember's Reliquary", items: [{ id: 'greater_health_potion', price: 70, stock: 15 }, { id: 'greater_mana_potion', price: 80, stock: 15 }, { id: 'ring_of_vigor', price: 150, stock: 2 }] }, quest: 'ember_pyros' },
  { id: 'ember cinder', name: 'Cinder', role: 'Imp Hunter', x: 0, y: 0, color: '#fb923c', dialog: 'Lava imps stole my lucky charm. Slay eight of the wretches and I will share my fortune with you.', shop: null, quest: 'ember_imps' },
  { id: 'ember torvin', name: 'Torvin the Miner', role: 'Miner', x: 0, y: 0, color: '#a16207', dialog: 'I mine the volcanic glass. It is dangerous work, but the ore is pure. Bring me 10 iron ores and I will pay double.', shop: { name: "Torvin's Wares", items: [{ id: 'iron_ore', price: 12, stock: 20 }, { id: 'leather_armor', price: 15, stock: 4 }] }, quest: 'ember_mining' },
  { id: 'ember granny_coal', name: 'Granny Coal', role: 'Hermit', x: 0, y: 0, color: '#525252', dialog: 'Sit a while, child. The mountain speaks if you listen. Slay ten magma hounds and you will hear its voice.', shop: null, quest: 'ember_hounds' },
  { id: 'ember sergeant_drake', name: 'Sergeant Drake', role: 'Guard Captain', x: 0, y: 0, color: '#b91c1c', dialog: 'My men cannot hold the eastern pass. Slay twelve fire beetles to relieve our line.', shop: null, quest: 'ember_pass' },
  { id: 'ember ignis', name: 'Ignis the Mage', role: 'Arcane Scholar', x: 0, y: 0, color: '#7c3aed', dialog: 'I study the fire. Bring me the heart of the Emberlord and I shall teach you the secret of flame.', shop: { name: "Ignis's Tower", items: [{ id: 'oak_staff', price: 70, stock: 4 }, { id: 'sorcerer_robe', price: 110, stock: 3 }, { id: 'arcane_circlet', price: 120, stock: 2 }] } },
  { id: 'ember captain_reef', name: 'Captain Reef', role: 'Sailor', x: 0, y: 0, color: '#0284c7', dialog: 'I can ferry you to Frostpeak Isle, cold as the void itself. Or back to Lumina, if you tire of fire.', shop: null, travel: { options: [{ to: 'frostpeak', reqLevel: 8 }, { to: 'lumina', reqLevel: 1 }] } },
  { id: 'ember broker', name: 'Ember Broker', role: 'Merchant', x: 0, y: 0, color: '#facc15', dialog: 'Ember essence is in high demand across Mythral. Sell it to me, and I will pay you well.', shop: { name: "Broker's Stall", items: [{ id: 'ember_essence', price: 30, stock: 0 }, { id: 'health_potion', price: 25, stock: 10 }] }, quest: 'ember_essence_trade' },
  { id: 'ember lavana', name: 'Lavana', role: 'Innkeeper', x: 0, y: 0, color: '#fda4af', dialog: 'Welcome to the Sooty Hearth Inn. Rest, traveler. Tomorrow you may die.', shop: { name: "Sooty Hearth", items: [{ id: 'roasted_meat', price: 12, stock: 20 }, { id: 'bread', price: 3, stock: 30 }, { id: 'greater_health_potion', price: 70, stock: 5 }] } },
  { id: 'ember historian', name: 'Volcano Historian', role: 'Historian', x: 0, y: 0, color: '#92400e', dialog: 'The Emberlord was once a man, you know. Pyros, the sorcerer-king. He sought immortality and found fire.', shop: null, quest: 'ember_history' },
]

// ============================================================
// ISLAND 3: FROSTPEAK ISLE (Ice biome, level 6-12)
// ============================================================
const frostpeakNpcs = [
  { id: 'frost chieftain_borin', name: 'Chieftain Borin', role: 'Clan Chief', x: 0, y: 0, color: '#bae6fd', dialog: 'You walk on the bones of my fathers, stranger. Prove your worth, and you may share our fire.', shop: null, quest: 'frost_wisps' },
  { id: 'frost helga', name: 'Helga the Brewmaster', role: 'Brewmaster', x: 0, y: 0, color: '#0ea5e9', dialog: 'My mead warms the coldest night. Bring me ten frost shards and I will brew you an elixir of might.', shop: { name: "Helga's Mead Hall", items: [{ id: 'roasted_meat', price: 12, stock: 25 }, { id: 'greater_health_potion', price: 70, stock: 10 }, { id: 'elixir_of_might', price: 100, stock: 3 }] }, quest: 'frost_shards' },
  { id: 'frost runa', name: 'Runa the Seer', role: 'Seer', x: 0, y: 0, color: '#a78bfa', dialog: 'I see a great frost in your future, hero. The Frost Dragon wakes. Slay it, or Mythral freezes.', shop: { name: "Runa's Visions", items: [{ id: 'arcane_focus', price: 240, stock: 2 }, { id: 'arcane_circlet', price: 120, stock: 2 }, { id: 'mana_potion', price: 30, stock: 15 }] }, quest: 'frost_dragon' },
  { id: 'frost bjorn', name: 'Bjorn Icebreaker', role: 'Warrior', x: 0, y: 0, color: '#0891b2', dialog: 'The yetis took my brother. Slay six of the beasts and I will give you my father\'s shield.', shop: null, quest: 'frost_yetis' },
  { id: 'frost sigrid', name: 'Sigrid the Tanner', role: 'Tanner', x: 0, y: 0, color: '#7c3aed', dialog: 'Ice wolf pelts make the warmest cloaks. Bring me eight and I will reward you handsomely.', shop: { name: "Sigrid's Furs", items: [{ id: 'leather_armor', price: 15, stock: 6 }, { id: 'leather_boots', price: 5, stock: 8 }, { id: 'swift_boots', price: 80, stock: 3 }] }, quest: 'frost_pelts' },
  { id: 'frost olaf', name: 'Olaf the Drunk', role: 'Drunkard', x: 0, y: 0, color: '#fbbf24', dialog: '*hic* Wha... oh, it is you. Bring me a bottle of Helga\'s mead, will you? I will pay double.', shop: null, quest: 'frost_mead' },
  { id: 'frost theresa', name: 'Theresa the Healer', role: 'Healer', x: 0, y: 0, color: '#f472b6', dialog: 'The cold brings fever. I need frost shards to make my cures. Bring me five, quickly.', shop: { name: "Theresa's Hut", items: [{ id: 'health_potion', price: 25, stock: 15 }, { id: 'greater_health_potion', price: 70, stock: 8 }, { id: 'super_health_potion', price: 200, stock: 2 }] }, quest: 'frost_cure' },
  { id: 'frost skald', name: 'Skald the Bard', role: 'Bard', x: 0, y: 0, color: '#f97316', dialog: 'I sing of heroes. Be one, and I shall sing of you. Slay the Frost Dragon and your name shall echo forever.', shop: null },
  { id: 'frost captain_elsa', name: 'Captain Elsa', role: 'Sailor', x: 0, y: 0, color: '#0284c7', dialog: 'My icebreaker can take you to Mistwood Isle to the south, or back to Emberfall.', shop: null, travel: { options: [{ to: 'mistwood', reqLevel: 9 }, { to: 'emberfall', reqLevel: 5 }] } },
  { id: 'frost rune_keeper', name: 'Rune Keeper', role: 'Runemaster', x: 0, y: 0, color: '#1e40af', dialog: 'The runes speak of a great cold. Slay fifteen ice wolves to weaken the dragon\'s thralls.', shop: null, quest: 'frost_thralls' },
]

// ============================================================
// ISLAND 4: MISTWOOD ISLE (Forest/magic, level 7-13)
// ============================================================
const mistwoodNpcs = [
  { id: 'mist archdruid_thorne', name: 'Archdruid Thorne', role: 'Archdruid', x: 0, y: 0, color: '#16a34a', dialog: 'The forest weeps, traveler. The Whispering Wraiths corrupt our ancient groves. Aid us, and the forest will remember.', shop: null, quest: ['mist_wraiths', 'mist_wraith_queen'] },
  { id: 'mist sylva', name: 'Sylva the Herbalist', role: 'Herbalist', x: 0, y: 0, color: '#84cc16', dialog: 'Mist petals are delicate things. Bring me ten and I will brew you an elixir of vitality.', shop: { name: "Sylva's Herbs", items: [{ id: 'health_potion', price: 25, stock: 15 }, { id: 'mana_potion', price: 30, stock: 15 }, { id: 'mist_petal', price: 18, stock: 0 }, { id: 'greater_health_potion', price: 70, stock: 5 }] }, quest: 'mist_petals' },
  { id: 'mist king_aldric', name: 'King Aldric', role: 'Forest King', x: 0, y: 0, color: '#15803d', dialog: 'I rule what remains of the sylvan folk. The treants grow restless. Calm five of them by force if you must.', shop: null, quest: 'mist_treants' },
  { id: 'mist elara', name: 'Elara the Enchantress', role: 'Enchantress', x: 0, y: 0, color: '#c084fc', dialog: 'I craft wonders from nature\'s gifts. Bring me eight mist petals and I will enchant your boots with speed.', shop: { name: "Elara's Wonders", items: [{ id: 'arcane_focus', price: 240, stock: 2 }, { id: 'sorcerer_robe', price: 110, stock: 3 }, { id: 'ring_of_wisdom', price: 150, stock: 2 }, { id: 'boots_of_striding', price: 220, stock: 1 }] }, quest: 'mist_enchant' },
  { id: 'mist pip', name: 'Woodcutter Pip', role: 'Woodcutter', x: 0, y: 0, color: '#a16207', dialog: 'Moss snakes infest the eastern grove. Slay ten and I can return to my work.', shop: null, quest: 'mist_snakes' },
  { id: 'mist brother_oak', name: 'Brother Oak', role: 'Treant Elder', x: 0, y: 0, color: '#166534', dialog: 'I am old, traveler. Older than your kind. Listen: the Wraiths feed on fear. Be fearless, and they cannot harm you.', shop: null, quest: 'mist_wraith_hunt' },
  { id: 'mist morrigan', name: 'Morrigan the Witch', role: 'Witch', x: 0, y: 0, color: '#7c3aed', dialog: 'The dryads are fierce, but their petals are precious. Slay six dryad guardians and bring me their petals.', shop: { name: "Morrigan's Hut", items: [{ id: 'greater_mana_potion', price: 80, stock: 8 }, { id: 'arcane_circlet', price: 120, stock: 2 }] }, quest: 'mist_dryads' },
  { id: 'mist traveler', name: 'Wandering Traveler', role: 'Traveler', x: 0, y: 0, color: '#9ca3af', dialog: 'I have walked all of Mythral. The Mistwood hides secrets. Slay fifteen moss snakes and I will share one with you.', shop: null, quest: 'mist_secret' },
  { id: 'mist captain_moss', name: 'Captain Moss', role: 'Sailor', x: 0, y: 0, color: '#0284c7', dialog: 'I can ferry you to Sunscar Isle to the east, or back to Frostpeak.', shop: null, travel: { options: [{ to: 'sunscar', reqLevel: 10 }, { to: 'frostpeak', reqLevel: 6 }] } },
  { id: 'mist lyra', name: 'Lyra the Bard', role: 'Bard', x: 0, y: 0, color: '#f59e0b', dialog: 'Songs of old tell of a sleeping evil in Mistwood. The Wraith Queen, they call her. Slay twenty wraiths and you may face her.', shop: null, quest: 'mist_wraith_count' },
  { id: 'mist collector', name: 'Petals Collector', role: 'Collector', x: 0, y: 0, color: '#f472b6', dialog: 'I pay well for mist petals. Bring me fifteen.', shop: null, quest: 'mist_petals_trade' },
  { id: 'mist robin', name: 'Robin Hoodlum', role: 'Outlaw', x: 0, y: 0, color: '#15803d', dialog: 'I steal from the rich and... well, keep it. Bring me five spider silks and I will teach you to move unseen.', shop: null, quest: 'mist_silk' },
  { id: 'mist innkeeper', name: 'Innkeeper Willow', role: 'Innkeeper', x: 0, y: 0, color: '#fde047', dialog: 'The Mossy Stump Inn welcomes all. Rest, eat, and prepare. The forest is hungry tonight.', shop: { name: "Mossy Stump", items: [{ id: 'bread', price: 3, stock: 30 }, { id: 'roasted_meat', price: 12, stock: 15 }, { id: 'apple', price: 2, stock: 25 }] } },
  { id: 'mist scout', name: 'Forest Scout', role: 'Scout', x: 0, y: 0, color: '#65a30d', dialog: 'I track the treants. They are corrupted by something dark. Slay three treants and bring me their heartwood.', shop: null, quest: 'mist_scout' },
]

// ============================================================
// ISLAND 5: SUNSCAR ISLE (Desert, level 8-14)
// ============================================================
const sunscarNpcs = [
  { id: 'sun vizier_khalid', name: 'Vizier Khalid', role: 'Royal Vizier', x: 0, y: 0, color: '#fbbf24', dialog: 'The Sun Titan awakens in the great pyramid. He has burned our oases dry. Stop him, hero of Mythral.', shop: null, quest: 'sun_titan' },
  { id: 'sun merchant_zara', name: 'Merchant Zara', role: 'Caravan Master', x: 0, y: 0, color: '#f59e0b', dialog: 'My caravans cannot travel with scorpions on the roads. Slay twelve and my routes shall reopen.', shop: { name: "Zara's Caravan", items: [{ id: 'health_potion', price: 25, stock: 20 }, { id: 'greater_health_potion', price: 70, stock: 8 }, { id: 'iron_sword', price: 60, stock: 3 }, { id: 'chainmail', price: 90, stock: 2 }] }, quest: 'sun_scorpions' },
  { id: 'sun scholar_omar', name: 'Scholar Omar', role: 'Historian', x: 0, y: 0, color: '#a855f7', dialog: 'The ancient talismans of the first kings lie in the ruins. Bring me three, and I will tell you of the Sun Titan\'s true name.', shop: null, quest: 'sun_talismans' },
  { id: 'sun princess_leyla', name: 'Princess Leyla', role: 'Princess', x: 0, y: 0, color: '#f472b6', dialog: 'My father is prisoner of the raiders. Slay eight desert raiders and I shall reward you with royal gold.', shop: null, quest: 'sun_raiders' },
  { id: 'sun ahmed', name: 'Ahmed the Smith', role: 'Blacksmith', x: 0, y: 0, color: '#b45309', dialog: 'Sunscorched iron makes the finest blades. Bring me ten iron ores and I will forge you a steel longsword.', shop: { name: "Ahmed's Forge", items: [{ id: 'steel_longsword', price: 180, stock: 2 }, { id: 'iron_helm', price: 40, stock: 4 }, { id: 'iron_shield', price: 60, stock: 3 }] }, quest: 'sun_iron' },
  { id: 'sun fatima', name: 'Fatima the Seer', role: 'Oracle', x: 0, y: 0, color: '#c084fc', dialog: 'I see a shadow rising. The Mummy Lords of old walk again. Slay five and you will weaken the Sun Titan.', shop: { name: "Fatima's Prophecies", items: [{ id: 'greater_mana_potion', price: 80, stock: 10 }, { id: 'arcane_focus', price: 240, stock: 2 }] }, quest: 'sun_mummies' },
  { id: 'sun carter', name: 'Carter the Explorer', role: 'Explorer', x: 0, y: 0, color: '#92400e', dialog: 'I seek the lost tomb of Rahotep. Slay fifteen desert raiders and I will share my map with you.', shop: null, quest: 'sun_tomb' },
  { id: 'sun yusuf', name: 'Yusuf the Spice Merchant', role: 'Spice Merchant', x: 0, y: 0, color: '#dc2626', dialog: 'Spices from the east! Cures for what ails you. Bring me five sunstones and I will give you a phoenix bow.', shop: { name: "Yusuf's Spices", items: [{ id: 'bread', price: 3, stock: 25 }, { id: 'roasted_meat', price: 12, stock: 15 }, { id: 'elixir_of_might', price: 100, stock: 5 }] }, quest: 'sun_phoenix' },
  { id: 'sun captain_scarab', name: 'Captain Scarab', role: 'Sailor', x: 0, y: 0, color: '#0284c7', dialog: 'My dhow can sail you to Tidehaven Isle to the south, or back to Mistwood.', shop: null, travel: { options: [{ to: 'tidehaven', reqLevel: 11 }, { to: 'mistwood', reqLevel: 7 }] } },
  { id: 'sun guard_captain', name: 'Guard Captain Tariq', role: 'Guard Captain', x: 0, y: 0, color: '#b91c1c', dialog: 'The desert raiders grow bolder. Slay ten of them, and the city will rest easy tonight.', shop: null, quest: 'sun_patrol' },
  { id: 'sun innkeeper', name: 'Innkeeper Hassan', role: 'Innkeeper', x: 0, y: 0, color: '#fde047', dialog: 'Welcome to the Scorpion\'s Rest. Cool drinks, warm food. Stay out of the sun at noon.', shop: { name: "Scorpion's Rest", items: [{ id: 'bread', price: 3, stock: 30 }, { id: 'roasted_meat', price: 12, stock: 20 }, { id: 'apple', price: 2, stock: 15 }, { id: 'greater_health_potion', price: 70, stock: 5 }] } },
]

// ============================================================
// ISLAND 6: TIDEHAVEN ISLE (Coastal/water, level 9-15)
// ============================================================
const tidehavenNpcs = [
  { id: 'tide harbor_master', name: 'Harbor Master Jorah', role: 'Harbor Master', x: 0, y: 0, color: '#0ea5e9', dialog: 'Smugglers plague our docks. Find the Captain\'s Ledger and bring it to me, and you shall be rewarded.', shop: null, quest: 'tide_smugglers' },
  { id: 'tide captain_neri', name: 'Captain Neri', role: 'Pirate Hunter', x: 0, y: 0, color: '#7c3aed', dialog: 'The Kraken has taken three of my ships. Slay it, and the bounties of the deep are yours.', shop: null, quest: 'tide_kraken' },
  { id: 'tide mira', name: 'Mira the Fisher', role: 'Fisherwoman', x: 0, y: 0, color: '#06b6d4', dialog: 'Giant crabs have infested my favorite cove. Slay ten and I will give you my lucky pearl.', shop: { name: "Mira's Catch", items: [{ id: 'bread', price: 3, stock: 20 }, { id: 'roasted_meat', price: 12, stock: 15 }, { id: 'apple', price: 2, stock: 25 }] }, quest: 'tide_crabs' },
  { id: 'tide old_sal', name: 'Old Sal', role: 'Retired Pirate', x: 0, y: 0, color: '#525252', dialog: 'Aye, I sailed with the worst of them. Slay fifteen murlocs and I will tell you where the treasure is buried.', shop: null, quest: 'tide_murlocs' },
  { id: 'tide sister_mira', name: 'Sister Mira', role: 'Nun', x: 0, y: 0, color: '#f472b6', dialog: 'The sea claims many souls. Slay five sea serpents to avenge the lost fishermen.', shop: { name: "Sea Chapel", items: [{ id: 'health_potion', price: 25, stock: 15 }, { id: 'mana_potion', price: 30, stock: 15 }, { id: 'blessed_mace', price: 90, stock: 2 }] }, quest: 'tide_serpents' },
  { id: 'tide bryn', name: 'Bryn the Blacksmith', role: 'Blacksmith', x: 0, y: 0, color: '#9ca3af', dialog: 'Salt rusts the iron, but pearls pay well. Bring me five pearls and I will forge you a tower shield.', shop: { name: "Bryn's Forge", items: [{ id: 'chainmail', price: 90, stock: 3 }, { id: 'iron_shield', price: 60, stock: 4 }, { id: 'iron_helm', price: 40, stock: 5 }] }, quest: 'tide_pearls' },
  { id: 'tide marcus', name: 'Marcus the Merchant', role: 'Merchant', x: 0, y: 0, color: '#f59e0b', dialog: 'Pearls are worth a fortune in the inland cities. Bring me ten and I will make you rich.', shop: { name: "Marcus's Goods", items: [{ id: 'greater_health_potion', price: 70, stock: 8 }, { id: 'greater_mana_potion', price: 80, stock: 8 }, { id: 'leather_boots', price: 5, stock: 6 }] }, quest: 'tide_pearl_trade' },
  { id: 'tide lighthouse_keeper', name: 'Lighthouse Keeper', role: 'Keeper', x: 0, y: 0, color: '#fbbf24', dialog: 'The Kraken smashed my light. Slay eight murlocs and the villagers will help me rebuild.', shop: null, quest: 'tide_light' },
  { id: 'tide captain_wave', name: 'Captain Wave', role: 'Sailor', x: 0, y: 0, color: '#0284c7', dialog: 'My ship can take you to Shadowfen Isle to the east, or back to Sunscar.', shop: null, travel: { options: [{ to: 'shadowfen', reqLevel: 12 }, { to: 'sunscar', reqLevel: 8 }] } },
  { id: 'tide dockmaster', name: 'Dockmaster Rurik', role: 'Dockmaster', x: 0, y: 0, color: '#1e40af', dialog: 'Cargo has gone missing. Slay twelve crabs that infest the warehouse docks.', shop: null, quest: 'tide_warehouse' },
  { id: 'tide selina', name: 'Selina the Seamstress', role: 'Seamstress', x: 0, y: 0, color: '#f472b6', dialog: 'Sea silk is the strongest fabric. Bring me ten spider silks and I will craft you a sorcerer\'s robe.', shop: { name: "Selina's Threads", items: [{ id: 'leather_armor', price: 15, stock: 5 }, { id: 'apprentice_robe', price: 10, stock: 4 }] }, quest: 'tide_silk' },
  { id: 'tide rum', name: 'Rum Roger', role: 'Bartender', x: 0, y: 0, color: '#a16207', dialog: 'Rum for the soul, fish for the belly. Welcome to the Salty Siren.', shop: { name: "Salty Siren", items: [{ id: 'bread', price: 3, stock: 25 }, { id: 'roasted_meat', price: 12, stock: 20 }, { id: 'health_potion', price: 25, stock: 10 }] } },
  { id: 'tide historian', name: 'Maritime Historian', role: 'Historian', x: 0, y: 0, color: '#92400e', dialog: 'The Kraken was sealed for a thousand years. Now it wakes. Slay six sea serpents and we may learn why.', shop: null, quest: 'tide_history' },
]

// ============================================================
// ISLAND 7: SHADOWFEN ISLE (Swamp/undead, level 10-18)
// ============================================================
const shadowfenNpcs = [
  { id: 'sf witch_morgana', name: 'Witch Morgana', role: 'Swamp Witch', x: 0, y: 0, color: '#7c3aed', dialog: 'The Lich Queen Mortis stirs in the fetid depths. Slay her, or all of Mythral drowns in shadow.', shop: null, quest: 'sf_lich_queen' },
  { id: 'sf kael', name: 'Kael the Exile', role: 'Exiled Knight', x: 0, y: 0, color: '#525252', dialog: 'I was once a Death Knight, slave to Mortis. Slay five Death Knights and free their souls, as you would free me.', shop: null, quest: 'sf_death_knights' },
  { id: 'sf mother_hag', name: 'Mother Hag', role: 'Crone', x: 0, y: 0, color: '#65a30d', dialog: 'Bring me twenty bone fragments, and I will brew you an elixir that staves off death itself.', shop: { name: "Hag's Cauldron", items: [{ id: 'super_health_potion', price: 200, stock: 3 }, { id: 'greater_mana_potion', price: 80, stock: 8 }, { id: 'elixir_of_might', price: 100, stock: 2 }] }, quest: 'sf_bones' },
  { id: 'sf brother_cole', name: 'Brother Cole', role: 'Monk', x: 0, y: 0, color: '#fde047', dialog: 'I came to cleanse this fen. I have failed. Slay ten skeletons and continue my work.', shop: { name: "Cole's Reliquary", items: [{ id: 'blessed_mace', price: 90, stock: 2 }, { id: 'priest_vestments', price: 100, stock: 2 }, { id: 'health_potion', price: 25, stock: 15 }] }, quest: 'sf_skeletons' },
  { id: 'sf vera', name: 'Vera the Apothecary', role: 'Apothecary', x: 0, y: 0, color: '#84cc16', dialog: 'Bog spirits yield rare essences. Slay twelve and bring me their essence.', shop: { name: "Vera's Remedies", items: [{ id: 'greater_health_potion', price: 70, stock: 10 }, { id: 'greater_mana_potion', price: 80, stock: 10 }, { id: 'super_health_potion', price: 200, stock: 2 }] }, quest: 'sf_spirits' },
  { id: 'sf gravekeeper', name: 'Gravekeeper Tomas', role: 'Gravekeeper', x: 0, y: 0, color: '#1e293b', dialog: 'The dead do not rest. Slay fifteen skeletons, and the graveyard may sleep again.', shop: null, quest: 'sf_grave' },
  { id: 'sf lady_mortis', name: 'Lady Mortis', role: 'Mysterious Noble', x: 0, y: 0, color: '#16a34a', dialog: 'The Lich Queen was my sister, before the shadow took her. Slay three plague liches and you will weaken her grip.', shop: null, quest: 'sf_liches' },
  { id: 'sf smuggler_jack', name: 'Smuggler Jack', role: 'Smuggler', x: 0, y: 0, color: '#a16207', dialog: 'I deal in rare goods. Bring me ten void crystals and I will sell you anything you desire.', shop: { name: "Jack's Contraband", items: [{ id: 'amulet_of_warding', price: 200, stock: 1 }, { id: 'ring_of_vigor', price: 150, stock: 1 }, { id: 'ring_of_wisdom', price: 150, stock: 1 }] }, quest: 'sf_void' },
  { id: 'sf captain_rot', name: 'Captain Rot', role: 'Ferryman', x: 0, y: 0, color: '#365314', dialog: 'My skiff can ferry you to Skyreach Isle above, or back to Tidehaven.', shop: null, travel: { options: [{ to: 'skyreach', reqLevel: 14 }, { to: 'tidehaven', reqLevel: 9 }] } },
  { id: 'sf scholar', name: 'Necromancer Scholar', role: 'Scholar', x: 0, y: 0, color: '#1e1b4b', dialog: 'I study the dark arts to combat them. Slay twenty bog spirits and I will teach you a secret of undeath.', shop: null, quest: 'sf_study' },
  { id: 'sf innkeeper', name: 'Innkeeper Bess', role: 'Innkeeper', x: 0, y: 0, color: '#fde047', dialog: 'The Drowned Frog Inn. Try not to think about the name. Or the smell.', shop: { name: "Drowned Frog", items: [{ id: 'bread', price: 3, stock: 20 }, { id: 'roasted_meat', price: 12, stock: 15 }, { id: 'greater_health_potion', price: 70, stock: 5 }] } },
  { id: 'sf hunter', name: 'Swamp Hunter', role: 'Hunter', x: 0, y: 0, color: '#4d7c0f', dialog: 'The plague liches spread disease. Slay eight and the air will clear.', shop: null, quest: 'sf_plague' },
  { id: 'sf widow', name: 'The Weeping Widow', role: 'Widow', x: 0, y: 0, color: '#94a3b8', dialog: 'The Death Knight took my husband. Slay two death knights and avenge him, I beg you.', shop: null, quest: 'sf_widow' },
  { id: 'sf gravedigger', name: 'Gravedigger Sam', role: 'Gravedigger', x: 0, y: 0, color: '#78716c', dialog: 'Digging graves is hard when they keep climbing out. Slay six plague liches and I will share my employer\'s gold.', shop: null, quest: 'sf_gravedigger' },
  { id: 'sf alchemist', name: 'Alchemist Vex', role: 'Alchemist', x: 0, y: 0, color: '#a3e635', dialog: 'Void crystals are the key to great power. Bring me five and I will show you.', shop: null, quest: 'sf_alchemist' },
]

// ============================================================
// ISLAND 8: SKYREACH ISLE (Floating island, level 12-20)
// ============================================================
const skyreachNpcs = [
  { id: 'sky archmage_solara', name: 'Archmage Solara', role: 'Archmage', x: 0, y: 0, color: '#fde047', dialog: 'The Thunder Drake nests atop Skyreach. It must be slain before it lays its eggs, or Mythral will face a storm of wyrms.', shop: null, quest: 'sky_drake' },
  { id: 'sky captain_aerie', name: 'Captain Aerie', role: 'Sky Knight', x: 0, y: 0, color: '#0ea5e9', dialog: 'The harpies have taken the eastern aeries. Slay twelve and my knights can reclaim them.', shop: { name: "Aerie's Armory", items: [{ id: 'steel_longsword', price: 180, stock: 3 }, { id: 'crossbow', price: 260, stock: 2 }, { id: 'tower_shield', price: 200, stock: 1 }, { id: 'swift_boots', price: 80, stock: 3 }] }, quest: 'sky_harpies' },
  { id: 'sky mistress_luna', name: 'Mistress Luna', role: 'Cloud Weaver', x: 0, y: 0, color: '#a78bfa', dialog: 'Cloud sprites are mischievous, not evil. But they have stolen my spellbook. Slay ten and you may find it.', shop: { name: "Luna's Atelier", items: [{ id: 'arcane_focus', price: 240, stock: 2 }, { id: 'archmage_robe', price: 350, stock: 1 }, { id: 'arcane_circlet', price: 120, stock: 2 }] }, quest: 'sky_sprites' },
  { id: 'sky stormrider', name: 'Stormrider Thane', role: 'Stormrider', x: 0, y: 0, color: '#facc15', dialog: 'Storm elementals guard the drake\'s nest. Slay eight and the path will be clear.', shop: null, quest: 'sky_elementals' },
  { id: 'sky brother_wind', name: 'Brother Wind', role: 'Monk', x: 0, y: 0, color: '#e0e7ff', dialog: 'The wind speaks of darkness in Voidheart. Slay fifteen harpies and the winds will whisper to you.', shop: null, quest: 'sky_whispers' },
  { id: 'sky sky_merchant', name: 'Sky Merchant', role: 'Merchant', x: 0, y: 0, color: '#f59e0b', dialog: 'Bring me five wyrm scales and I will sell you anything in my cart.', shop: { name: "Sky Cart", items: [{ id: 'super_health_potion', price: 200, stock: 5 }, { id: 'super_mana_potion', price: 200, stock: 5 }, { id: 'elixir_of_might', price: 100, stock: 5 }] }, quest: 'sky_scales' },
  { id: 'sky oracle', name: 'The Sky Oracle', role: 'Oracle', x: 0, y: 0, color: '#c084fc', dialog: 'I see a great void opening. The Voidlord Acheron stirs. Slay the Thunder Drake and you will be ready.', shop: { name: "Oracle's Skyhold", items: [{ id: 'archmage_robe', price: 350, stock: 1 }, { id: 'hierophant_robe', price: 320, stock: 1 }, { id: 'crown_of_flames', price: 450, stock: 1 }] } },
  { id: 'sky captain_gale', name: 'Captain Gale', role: 'Airsailor', x: 0, y: 0, color: '#0284c7', dialog: 'My airship can carry you to Voidheart Isle - the final isle. Or back to Shadowfen.', shop: null, travel: { options: [{ to: 'voidheart', reqLevel: 18 }, { to: 'shadowfen', reqLevel: 10 }] } },
  { id: 'sky watcher', name: 'Star Watcher', role: 'Astronomer', x: 0, y: 0, color: '#1e40af', dialog: 'The stars have shifted. Slay twenty storm elementals and the heavens will realign.', shop: null, quest: 'sky_stars' },
  { id: 'sky herbalist', name: 'Cloud Herbalist', role: 'Herbalist', x: 0, y: 0, color: '#84cc16', dialog: 'Bring me ten cloud sprite feathers and I will craft you a crown of flames.', shop: null, quest: 'sky_feathers' },
  { id: 'sky templar', name: 'Sky Templar', role: 'Templar', x: 0, y: 0, color: '#fbbf24', dialog: 'The Thunder Drake has slain three of my brothers. Slay it, and you will be one of us.', shop: { name: "Templar's Vault", items: [{ id: 'plate_armor', price: 280, stock: 2 }, { id: 'tower_shield', price: 200, stock: 1 }, { id: 'dragonscale', price: 900, stock: 0 }] } },
  { id: 'sky keeper', name: 'Skyreach Keeper', role: 'Keeper', x: 0, y: 0, color: '#0284c7', dialog: 'I guard the bridge to Voidheart. None may pass who have not slain the Thunder Drake. Prove your worth.', shop: null },
]

// ============================================================
// ISLAND 9: VOIDHEART ISLE (End-game, level 18-25)
// ============================================================
const voidheartNpcs = [
  { id: 'void watcher_aza', name: 'Watcher Aza', role: 'Void Watcher', x: 0, y: 0, color: '#7c3aed', dialog: 'You have come at last. The Voidlord Acheron tears reality itself. Slay him, and Mythral will be saved.', shop: null, quest: 'void_acheron' },
  { id: 'void hero_kael', name: 'Fallen Hero Kael', role: 'Fallen Hero', x: 0, y: 0, color: '#dc2626', dialog: 'I tried to face Acheron alone. I failed. Slay ten void spawns and my spirit may rest.', shop: null, quest: 'void_spawns' },
  { id: 'void merchant', name: 'Void Merchant', role: 'Merchant', x: 0, y: 0, color: '#fbbf24', dialog: 'I deal in the currency of despair. Bring me twenty void crystals and I will sell you the weapons of gods.', shop: { name: "Void Bazaar", items: [{ id: 'flamebrand', price: 600, stock: 1 }, { id: 'staff_of_storms', price: 720, stock: 1 }, { id: 'phoenix_bow', price: 780, stock: 1 }, { id: 'dawnbringer', price: 800, stock: 1 }, { id: 'dragonscale', price: 900, stock: 1 }] }, quest: 'void_crystals' },
  { id: 'void priestess', name: 'Priestess of the Void', role: 'Priestess', x: 0, y: 0, color: '#c084fc', dialog: 'I am the last of my order. Slay fifteen demon brutes and the way to Acheron\'s throne will open.', shop: { name: "Void Reliquary", items: [{ id: 'super_health_potion', price: 200, stock: 10 }, { id: 'super_mana_potion', price: 200, stock: 10 }, { id: 'hierophant_robe', price: 320, stock: 1 }] }, quest: 'void_brutes' },
  { id: 'void blacksmith', name: 'Void Smith', role: 'Blacksmith', x: 0, y: 0, color: '#525252', dialog: 'I forge with starlight and despair. Bring me ten wyrm scales and I will reforge any weapon you possess.', shop: { name: "Void Forge", items: [{ id: 'dragonscale', price: 900, stock: 1 }, { id: 'plate_armor', price: 280, stock: 2 }, { id: 'crown_of_flames', price: 450, stock: 1 }] }, quest: 'void_scales' },
  { id: 'void sage', name: 'Void Sage', role: 'Sage', x: 0, y: 0, color: '#a78bfa', dialog: 'The Voidlord was once a god, you know. Acheron, the jealous one. He sought to unmake creation.', shop: null, quest: 'void_history' },
  { id: 'void shade', name: 'Wandering Shade', role: 'Lost Soul', x: 0, y: 0, color: '#1e1b4b', dialog: 'I am lost between worlds. Slay twenty shadow demons and the void will release me.', shop: null, quest: 'void_shadows' },
  { id: 'void knight', name: 'Void Knight', role: 'Cursed Knight', x: 0, y: 0, color: '#1f2937', dialog: 'I am bound to this isle until Acheron falls. Slay five demon brutes and I will lend you my strength.', shop: null, quest: 'void_knight' },
  { id: 'void alchemist', name: 'Void Alchemist', role: 'Alchemist', x: 0, y: 0, color: '#7c3aed', dialog: 'Void crystals hold the secret of immortality. And mortality. Bring me fifteen, and I will share both.', shop: { name: "Alchemist's Void", items: [{ id: 'elixir_of_might', price: 100, stock: 5 }, { id: 'super_health_potion', price: 200, stock: 5 }] }, quest: 'void_alchemist' },
  { id: 'void captain', name: 'Void Captain', role: 'Ferryman', x: 0, y: 0, color: '#0284c7', dialog: 'When your task is done, I can return you to Skyreach. The void cannot hold you if you do not will it.', shop: null, travel: { options: [{ to: 'skyreach', reqLevel: 12 }] } },
  { id: 'void mystic', name: 'Void Mystic', role: 'Mystic', x: 0, y: 0, color: '#fde047', dialog: 'The Voidlord feeds on fear. Be fearless, hero. Slay twelve shadow demons and your courage will be absolute.', shop: null, quest: 'void_fearless' },
  { id: 'void merchant2', name: 'Frozen Merchant', role: 'Merchant', x: 0, y: 0, color: '#bae6fd', dialog: 'I bring goods from across the void. The journey has cost me much. Buy, and help me return home.', shop: { name: "Frozen Goods", items: [{ id: 'super_health_potion', price: 200, stock: 5 }, { id: 'greater_mana_potion', price: 80, stock: 5 }, { id: 'amulet_of_warding', price: 200, stock: 1 }] } },
  { id: 'void oracle', name: 'Final Oracle', role: 'Oracle', x: 0, y: 0, color: '#fbbf24', dialog: 'I see the end of all things, or the beginning. Slay the Voidlord, and a new age dawns for Mythral.', shop: null },
  { id: 'void mourner', name: 'Mourner', role: 'Mourner', x: 0, y: 0, color: '#94a3b8', dialog: 'I mourn for those who came before you and failed. Do not become another name on my list.', shop: null },
  { id: 'void armorer', name: 'Void Armorer', role: 'Armorer', x: 0, y: 0, color: '#525252', dialog: 'The final battle needs final armor. Bring me five wyrm scales and I will give you dragonscale plate.', shop: { name: "Final Armory", items: [{ id: 'plate_armor', price: 280, stock: 2 }, { id: 'tower_shield', price: 200, stock: 1 }] }, quest: 'void_plate' },
  { id: 'void chronicler', name: 'Chronicler', role: 'Chronicler', x: 0, y: 0, color: '#a855f7', dialog: 'I record the deeds of heroes. Slay the Voidlord, and your name shall be the last in my book - or the first of a new one.', shop: null },
  { id: 'void watcher2', name: 'Silent Watcher', role: 'Watcher', x: 0, y: 0, color: '#1e1b4b', dialog: '...', shop: null },
  { id: 'void keeper', name: 'Last Keeper', role: 'Keeper', x: 0, y: 0, color: '#fde047', dialog: 'I am the last keeper of Mythral\'s hope. You are that hope. Go now, and unmake the void.', shop: null },
]

// ============================================================
// ISLAND DEFINITIONS
// ============================================================
export const ISLAND_DEFS = {
  lumina: {
    id: 'lumina',
    name: 'Lumina Isle',
    subtitle: 'The First Spark',
    biome: 'lumina',
    levelRange: [1, 5],
    description: 'A gentle, sunlit isle of rolling meadows and quiet woodlands. New heroes begin their journey here, learning the ways of combat and questing under the kind guidance of Lumina\'s villagers.',
    width: 60, height: 50, seed: 1337,
    backgroundColor: '#87ceeb',
    spawnConfig: [
      { monster: 'rat', count: 8 },
      { monster: 'wild_dog', count: 6 },
      { monster: 'forest_goblin', count: 5 },
      { monster: 'giant_spider', count: 4 },
      { monster: 'dire_wolf', count: 3 },
    ],
    npcs: luminaNpcs,
    portalTo: 'emberfall',
    portalLevel: 5,
    portalPos: { x: 4, y: 25 },
  },
  emberfall: {
    id: 'emberfall',
    name: 'Emberfall Isle',
    subtitle: 'Where Fire Walks',
    biome: 'emberfall',
    levelRange: [5, 10],
    description: 'A volcanic island of black rock and rivers of lava. Emberfall is home to fire-resistant folk who forge legendary weapons in the caldera\'s heat, but the Emberlord Pyros now threatens all.',
    width: 65, height: 55, seed: 4242,
    backgroundColor: '#450a0a',
    spawnConfig: [
      { monster: 'fire_beetle', count: 8 },
      { monster: 'lava_imp', count: 6 },
      { monster: 'magma_hound', count: 5 },
      { monster: 'volcanic_golem', count: 3 },
      { monster: 'emberlord_pyros', count: 1 },
    ],
    npcs: emberfallNpcs,
    portalTo: 'frostpeak',
    portalLevel: 8,
    portalPos: { x: 32, y: 4 },
  },
  frostpeak: {
    id: 'frostpeak',
    name: 'Frostpeak Isle',
    subtitle: 'The Frozen Crown',
    biome: 'frostpeak',
    levelRange: [6, 12],
    description: 'A windswept isle of eternal winter, where clans of ice-folk hunt mammoth and duel yetis. The Frost Dragon sleeps beneath the highest peak, and its dreams freeze the world.',
    width: 65, height: 55, seed: 9090,
    backgroundColor: '#cffafe',
    spawnConfig: [
      { monster: 'frost_wisp', count: 7 },
      { monster: 'ice_wolf', count: 6 },
      { monster: 'yeti', count: 4 },
      { monster: 'frost_dragon', count: 1 },
    ],
    npcs: frostpeakNpcs,
    portalTo: 'mistwood',
    portalLevel: 9,
    portalPos: { x: 60, y: 25 },
  },
  mistwood: {
    id: 'mistwood',
    name: 'Mistwood Isle',
    subtitle: 'The Whispering Forest',
    biome: 'mistwood',
    levelRange: [7, 13],
    description: 'A dense, magical forest where ancient trees walk and dryads dance in the mist. The Whispering Wraiths corrupt the glades, and the Archdruid Thorne seeks heroes to cleanse the corruption.',
    width: 70, height: 60, seed: 7070,
    backgroundColor: '#166534',
    spawnConfig: [
      { monster: 'moss_snake', count: 8 },
      { monster: 'dryad_guardian', count: 6 },
      { monster: 'treant', count: 4 },
      { monster: 'whispering_wraith', count: 5 },
      { monster: 'wraith_queen_sylvana', count: 1 },
    ],
    npcs: mistwoodNpcs,
    portalTo: 'sunscar',
    portalLevel: 10,
    portalPos: { x: 60, y: 30 },
  },
  sunscar: {
    id: 'sunscar',
    name: 'Sunscar Isle',
    subtitle: 'The Burning Sands',
    biome: 'sunscar',
    levelRange: [8, 14],
    description: 'A vast desert isle dotted with oases and ancient pyramids. The Sun Titan has awakened in the great pyramid, burning the land with his wrath. Princess Leyla and her people suffer under his reign.',
    width: 65, height: 55, seed: 5555,
    backgroundColor: '#fbbf24',
    spawnConfig: [
      { monster: 'sand_scorpion', count: 8 },
      { monster: 'desert_raider', count: 6 },
      { monster: 'mummy_lord', count: 4 },
      { monster: 'sun_titan', count: 1 },
    ],
    npcs: sunscarNpcs,
    portalTo: 'tidehaven',
    portalLevel: 11,
    portalPos: { x: 32, y: 50 },
  },
  tidehaven: {
    id: 'tidehaven',
    name: 'Tidehaven Isle',
    subtitle: 'The Saltborn Port',
    biome: 'tidehaven',
    levelRange: [9, 15],
    description: 'A bustling port isle of smugglers, fishermen, and pirates. The Kraken has risen from the deep, smashing ships and dragging sailors to a watery grave. The harbor master offers bounties for heroes.',
    width: 70, height: 55, seed: 3030,
    backgroundColor: '#0c4a6e',
    spawnConfig: [
      { monster: 'crab', count: 8 },
      { monster: 'murloc', count: 7 },
      { monster: 'sea_serpent', count: 5 },
      { monster: 'kraken', count: 1 },
    ],
    npcs: tidehavenNpcs,
    portalTo: 'shadowfen',
    portalLevel: 12,
    portalPos: { x: 4, y: 30 },
  },
  shadowfen: {
    id: 'shadowfen',
    name: 'Shadowfen Isle',
    subtitle: 'The Drowned Marsh',
    biome: 'shadowfen',
    levelRange: [10, 18],
    description: 'A pestilent swamp isle where the dead refuse to rest. The Lich Queen Mortis rules from a tower of bone, and her undead legions crawl from the mire. Only the desperate or the doomed come here.',
    width: 70, height: 60, seed: 8080,
    backgroundColor: '#1a2e05',
    spawnConfig: [
      { monster: 'bog_spirit', count: 8 },
      { monster: 'skeleton', count: 7 },
      { monster: 'plague_lich', count: 5 },
      { monster: 'death_knight', count: 4 },
      { monster: 'lich_queen_mortis', count: 1 },
    ],
    npcs: shadowfenNpcs,
    portalTo: 'skyreach',
    portalLevel: 14,
    portalPos: { x: 35, y: 4 },
  },
  skyreach: {
    id: 'skyreach',
    name: 'Skyreach Isle',
    subtitle: 'The Floating Peak',
    biome: 'skyreach',
    levelRange: [12, 20],
    description: 'A miraculous isle suspended in the clouds by ancient magic. Sky Knights ride the winds, harpies nest in the aeries, and the Thunder Drake sleeps atop the highest peak, ready to scour the world with lightning.',
    width: 60, height: 50, seed: 6060,
    backgroundColor: '#e0e7ff',
    spawnConfig: [
      { monster: 'cloud_sprite', count: 8 },
      { monster: 'harpy', count: 7 },
      { monster: 'storm_elemental', count: 5 },
      { monster: 'thunder_drake', count: 1 },
    ],
    npcs: skyreachNpcs,
    portalTo: 'voidheart',
    portalLevel: 18,
    portalPos: { x: 30, y: 4 },
  },
  voidheart: {
    id: 'voidheart',
    name: 'Voidheart Isle',
    subtitle: 'The End of All Things',
    biome: 'voidheart',
    levelRange: [18, 25],
    description: 'A realm of pure darkness where reality itself unravels. The Voidlord Acheron tears at the fabric of existence, and only the mightiest heroes of Mythral may challenge him. The fate of all worlds rests here.',
    width: 60, height: 50, seed: 9999,
    backgroundColor: '#0a0a0a',
    spawnConfig: [
      { monster: 'void_spawn', count: 8 },
      { monster: 'demon_brute', count: 6 },
      { monster: 'shadow_demon', count: 5 },
      { monster: 'voidlord_acheron', count: 1 },
    ],
    npcs: voidheartNpcs,
    portalTo: null,
    portalLevel: 99,
    portalPos: null,
  },
}

// ============================================================
// Generate & cache island maps on-demand
// ============================================================
const mapCache = {}

export function getIslandMap(islandId) {
  if (mapCache[islandId]) return mapCache[islandId]
  const def = ISLAND_DEFS[islandId]
  if (!def) return null
  const map = generateIslandMap(def)
  mapCache[islandId] = map
  return map
}

export function getIslandSpawnPoints(islandId) {
  const def = ISLAND_DEFS[islandId]
  const map = getIslandMap(islandId)
  const total = def.spawnConfig.reduce((s, c) => s + c.count, 0)
  return findSpawnPoints(map, total, def.seed * 7, 14)
}

export function getIslandStart(islandId) {
  const map = getIslandMap(islandId)
  return getVillageCenter(map)
}

export function getIslandDef(islandId) {
  return ISLAND_DEFS[islandId]
}

export function getAllIslands() {
  return Object.values(ISLAND_DEFS)
}

// Assign NPC positions to building interiors / village square
export function placeNpcs(islandId) {
  const def = ISLAND_DEFS[islandId]
  const map = getIslandMap(islandId)
  const h = map.length, w = map[0].length
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2)
  // building positions (matching placeVillage in islandGenerator)
  const buildings = [
    { x: cx - 7, y: cy - 5, w: 5, h: 4, buildingType: 'shop' },
    { x: cx + 2, y: cy - 5, w: 5, h: 4, buildingType: 'forge' },
    { x: cx - 7, y: cy + 1, w: 6, h: 4, buildingType: 'inn' },
    { x: cx + 2, y: cy + 1, w: 5, h: 4, buildingType: 'hut' },
  ]
  // also use village square positions
  const squarePositions = [
    { x: cx - 2, y: cy },
    { x: cx + 2, y: cy },
    { x: cx, y: cy - 2 },
    { x: cx, y: cy + 2 },
    { x: cx - 4, y: cy - 2 },
    { x: cx + 4, y: cy - 2 },
    { x: cx - 4, y: cy + 2 },
    { x: cx + 4, y: cy + 2 },
    { x: cx - 1, y: cy + 3 },
    { x: cx + 1, y: cy + 3 },
    { x: cx - 1, y: cy - 3 },
    { x: cx + 1, y: cy - 3 },
    { x: cx - 5, y: cy },
    { x: cx + 5, y: cy },
    { x: cx - 3, y: cy + 3 },
    { x: cx + 3, y: cy + 3 },
    { x: cx - 3, y: cy - 3 },
    { x: cx + 3, y: cy - 3 },
  ]
  const positions = []
  // place inside buildings first
  for (const b of buildings) {
    positions.push({ x: b.x + 2, y: b.y + 2 })
  }
  positions.push(...squarePositions)
  // Walkable check & assign
  const npcs = def.npcs.map((npc, i) => {
    let pos = positions[i] || squarePositions[i % squarePositions.length]
    // ensure walkable; nudge if needed
    if (pos && !isWalkableCheck(map, pos.x, pos.y)) {
      for (let r = 1; r <= 5; r++) {
        let found = false
        for (let dy = -r; dy <= r && !found; dy++) {
          for (let dx = -r; dx <= r && !found; dx++) {
            const nx = pos.x + dx, ny = pos.y + dy
            if (isWalkableCheck(map, nx, ny)) { pos = { x: nx, y: ny }; found = true }
          }
        }
        if (found) break
      }
    }
    return { ...npc, x: pos.x, y: pos.y }
  })
  return npcs
}

// Return building positions for an island (used by server + client for rendering)
export function getIslandBuildings(islandId) {
  const def = ISLAND_DEFS[islandId]
  if (!def) return []
  const map = getIslandMap(islandId)
  const h = map.length, w = map[0].length
  const cx = Math.floor(w / 2), cy = Math.floor(h / 2)
  // Biome-specific building types
  const biome = def.biome || 'lumina'
  const biomeBuildings = {
    lumina: ['shop', 'forge', 'inn', 'hut'],
    emberfall: ['forge', 'tower', 'inn', 'shop'],
    frostpeak: ['hut', 'forge', 'inn', 'shop'],
    mistwood: ['apothecary', 'shop', 'hut', 'tower'],
    sunscar: ['shop', 'tower', 'inn', 'apothecary'],
    tidehaven: ['dock', 'shop', 'inn', 'fishShack'],
    shadowfen: ['apothecary', 'hut', 'tower', 'shop'],
    skyreach: ['tower', 'inn', 'shop', 'apothecary'],
    voidheart: ['tower', 'forge', 'temple', 'shop'],
  }
  const types = biomeBuildings[biome] || biomeBuildings.lumina
  return [
    { x: cx - 7, y: cy - 5, w: 5, h: 4, buildingType: types[0] },
    { x: cx + 2, y: cy - 5, w: 5, h: 4, buildingType: types[1] },
    { x: cx - 7, y: cy + 1, w: 6, h: 4, buildingType: types[2] },
    { x: cx + 2, y: cy + 1, w: 5, h: 4, buildingType: types[3] },
  ]
}

function isWalkableCheck(map, x, y) {
  if (y < 0 || y >= map.length || x < 0 || x >= map[0].length) return false
  const info = TILE_INFO[map[y][x]] || { walkable: false }
  return info.walkable
}

// ============================================================
// Aetheria: Nine Isles - Quests
// 60+ quests organized by island
// Quest types: kill, collect, talk, travel, boss
// ============================================================

export const QUESTS = {
  // ============================================================
  // LUMINA ISLE QUESTS
  // ============================================================
  lumina_rats: {
    id: 'lumina_rats',
    island: 'lumina',
    title: 'Rats in the Cellar',
    giver: 'lumina mira',
    minLevel: 1,
    type: 'kill',
    target: { monster: 'rat', count: 5 },
    reward: { xp: 30, gold: 15, items: [{ id: 'bread', qty: 3 }] },
    description: 'Mira the Baker cannot sleep for the rats in her cellar. Slay 5 cave rats to put her mind at ease.',
    completion: 'Mira is overjoyed. "Bless you, dear! Take these loaves - fresh from the oven."',
  },
  lumina_dog: {
    id: 'lumina_dog',
    island: 'lumina',
    title: 'Old Pip\'s Lost Hound',
    giver: 'lumina old_pip',
    minLevel: 1,
    type: 'kill',
    target: { monster: 'wild_dog', count: 3 },
    reward: { xp: 35, gold: 20, items: [{ id: 'health_potion', qty: 2 }] },
    description: 'Old Pip\'s favorite hound was slain by wild dogs. Avenge the hound by slaying 3 wild dogs.',
    completion: 'Old Pip wipes a tear. "Thank you, young one. The sea remembers your kindness."',
  },
  lumina_ore: {
    id: 'lumina_ore',
    island: 'lumina',
    title: 'Ore for the Forge',
    giver: 'lumina thom',
    minLevel: 2,
    type: 'collect',
    target: { item: 'iron_ore', count: 5 },
    reward: { xp: 50, gold: 40, items: [{ id: 'iron_sword', qty: 1 }] },
    description: 'Thom needs iron ore to practice his craft. Bring him 5 iron ores and he will forge you a sword.',
    completion: 'Thom strikes the anvil with renewed vigor. "Aye, this\'ll do. Here - your very own iron blade!"',
  },
  lumina_herbs: {
    id: 'lumina_herbs',
    island: 'lumina',
    title: 'Healing Herbs',
    giver: 'lumina sister_lyra',
    minLevel: 2,
    type: 'collect',
    target: { item: 'wolf_pelt', count: 4 },
    reward: { xp: 45, gold: 30, items: [{ id: 'health_potion', qty: 3 }] },
    description: 'Sister Lyra needs wolf pelts to line her hospital beds. Bring her 4 wolf pelts.',
    completion: 'Sister Lyra accepts the pelts with grace. "May the Light shine upon you, child."',
  },
  lumina_wolves: {
    id: 'lumina_wolves',
    island: 'lumina',
    title: 'The Wolf Pack',
    giver: 'lumina finn',
    minLevel: 3,
    type: 'kill',
    target: { monster: 'dire_wolf', count: 5 },
    reward: { xp: 80, gold: 60, items: [{ id: 'short_bow', qty: 1 }] },
    description: 'Finn the Hunter will teach you the way of the bow if you slay 5 dire wolves threatening the village.',
    completion: 'Finn claps you on the shoulder. "You\'ve got a hunter\'s eye! Take this bow - it served me well."',
  },
  lumina_silk: {
    id: 'lumina_silk',
    island: 'lumina',
    title: 'A Collector\'s Fancy',
    giver: 'lumina collector',
    minLevel: 3,
    type: 'collect',
    target: { item: 'spider_silk', count: 3 },
    reward: { xp: 60, gold: 50, items: [{ id: 'copper_ring', qty: 1 }] },
    description: 'The Antique Collector desires 3 spider silks. Bring them and receive a copper ring.',
    completion: 'The collector examines each strand with glee. "Exquisite! Take this ring as payment."',
  },
  lumina_goblins: {
    id: 'lumina_goblins',
    island: 'lumina',
    title: 'Goblin Trouble',
    giver: 'lumina elder_ravenna',
    minLevel: 3,
    type: 'kill',
    target: { monster: 'forest_goblin', count: 8 },
    reward: { xp: 100, gold: 75, items: [{ id: 'leather_armor', qty: 1 }] },
    description: 'Elder Ravenna is troubled by goblin raids. Slay 8 forest goblins to secure the village.',
    completion: 'Elder Ravenna nods solemnly. "You have proven yourself a true defender of Lumina. Take this armor."',
  },

  // ============================================================
  // EMBERFALL ISLE QUESTS
  // ============================================================
  ember_beetles: {
    id: 'ember_beetles',
    island: 'emberfall',
    title: 'The Beetle Plague',
    giver: 'ember warden_kael',
    minLevel: 5,
    type: 'kill',
    target: { monster: 'fire_beetle', count: 10 },
    reward: { xp: 200, gold: 80, items: [{ id: 'greater_health_potion', qty: 2 }] },
    description: 'Warden Kael reports fire beetles overrunning the volcanic slopes. Slay 10 of them.',
    completion: 'Warden Kael grunts in approval. "Not bad. The mountain thanks you."',
  },
  ember_essence: {
    id: 'ember_essence',
    island: 'emberfall',
    title: 'Essence of Fire',
    giver: 'ember smitty',
    minLevel: 5,
    type: 'collect',
    target: { item: 'ember_essence', count: 6 },
    reward: { xp: 250, gold: 100, items: [{ id: 'steel_longsword', qty: 1 }] },
    description: 'Smitty needs 6 vials of ember essence to forge a steel longsword for you.',
    completion: 'Smitty quenches the glowing blade. "She\'s a beauty. Wield her well, hero!"',
  },
  ember_imps: {
    id: 'ember_imps',
    island: 'emberfall',
    title: 'Stolen Charm',
    giver: 'ember cinder',
    minLevel: 6,
    type: 'kill',
    target: { monster: 'lava_imp', count: 8 },
    reward: { xp: 280, gold: 120, items: [{ id: 'ring_of_vigor', qty: 1 }] },
    description: 'Cinder lost his lucky charm to lava imps. Slay 8 imps and he will share his fortune.',
    completion: 'Cinder grins. "Found me charm in the belly of one of \'em. Here - a ring for your trouble."',
  },
  ember_mining: {
    id: 'ember_mining',
    island: 'emberfall',
    title: 'Pure Ore',
    giver: 'ember torvin',
    minLevel: 5,
    type: 'collect',
    target: { item: 'iron_ore', count: 10 },
    reward: { xp: 220, gold: 240, items: [] },
    description: 'Torvin pays double for raw iron. Bring him 10 iron ores.',
    completion: 'Torvin hands you a heavy pouch. "Pleasure doing business. Come again!"',
  },
  ember_hounds: {
    id: 'ember_hounds',
    island: 'emberfall',
    title: 'The Voice of the Mountain',
    giver: 'ember granny_coal',
    minLevel: 7,
    type: 'kill',
    target: { monster: 'magma_hound', count: 10 },
    reward: { xp: 350, gold: 150, items: [{ id: 'elixir_of_might', qty: 1 }] },
    description: 'Granny Coal says slaying 10 magma hounds will let you hear the mountain speak. Reward: elixir of might.',
    completion: 'Granny Coal cackles. "Hear that? The mountain whispers your name. Drink this, child."',
  },
  ember_pass: {
    id: 'ember_pass',
    island: 'emberfall',
    title: 'Hold the Pass',
    giver: 'ember sergeant_drake',
    minLevel: 6,
    type: 'kill',
    target: { monster: 'fire_beetle', count: 12 },
    reward: { xp: 320, gold: 140, items: [{ id: 'chainmail', qty: 1 }] },
    description: 'Sergeant Drake needs 12 fire beetles slain to relieve his eastern garrison.',
    completion: 'Drake salutes. "The pass holds. Take this chainmail - it saved my life twice."',
  },
  ember_pyros: {
    id: 'ember_pyros',
    island: 'emberfall',
    title: 'The Emberlord',
    giver: 'ember priestess_ember',
    minLevel: 9,
    type: 'boss',
    target: { monster: 'emberlord_pyros', count: 1 },
    reward: { xp: 1500, gold: 500, items: [{ id: 'flamebrand', qty: 1 }] },
    description: 'Emberlord Pyros must be slain in the caldera. He is level 18 - prepare well, hero.',
    completion: 'Priestess Ember kneels. "The Emberlord falls. Aetheria owes you a debt. Take his blade - Flamebrand."',
  },
  ember_essence_trade: {
    id: 'ember_essence_trade',
    island: 'emberfall',
    title: 'Ember Brokerage',
    giver: 'ember broker',
    minLevel: 5,
    type: 'collect',
    target: { item: 'ember_essence', count: 8 },
    reward: { xp: 240, gold: 320, items: [] },
    description: 'The Ember Broker will buy 8 ember essences at premium price.',
    completion: 'The broker grins and counts coins. "Pleasure. Come back any time."',
  },
  ember_history: {
    id: 'ember_history',
    island: 'emberfall',
    title: 'The Sorcerer-King',
    giver: 'ember historian',
    minLevel: 5,
    type: 'collect',
    target: { item: 'ember_essence', count: 5 },
    reward: { xp: 200, gold: 80, items: [{ id: 'arcane_focus', qty: 1 }] },
    description: 'The Historian seeks 5 ember essences to study the legend of Pyros.',
    completion: 'The historian bows. "Your contribution to history is noted. Take this focus."',
  },

  // ============================================================
  // FROSTPEAK ISLE QUESTS
  // ============================================================
  frost_wisps: {
    id: 'frost_wisps',
    island: 'frostpeak',
    title: 'Wisps of Frost',
    giver: 'frost chieftain_borin',
    minLevel: 6,
    type: 'kill',
    target: { monster: 'frost_wisp', count: 8 },
    reward: { xp: 280, gold: 120, items: [{ id: 'greater_health_potion', qty: 3 }] },
    description: 'Chieftain Borin demands you prove your worth. Slay 8 frost wisps.',
    completion: 'Borin grunts. "You have the heart of a northman. Welcome to Frostpeak."',
  },
  frost_shards: {
    id: 'frost_shards',
    island: 'frostpeak',
    title: 'The Brewmistress\'s Request',
    giver: 'frost helga',
    minLevel: 6,
    type: 'collect',
    target: { item: 'frost_shard', count: 10 },
    reward: { xp: 320, gold: 150, items: [{ id: 'elixir_of_might', qty: 1 }] },
    description: 'Helga needs 10 frost shards to brew you an elixir of might.',
    completion: 'Helga hands you a steaming mug. "Drink up. \'Twill put fire in your veins, even here."',
  },
  frost_dragon: {
    id: 'frost_dragon',
    island: 'frostpeak',
    title: 'The Frost Dragon',
    giver: 'frost runa',
    minLevel: 10,
    type: 'boss',
    target: { monster: 'frost_dragon', count: 1 },
    reward: { xp: 2000, gold: 700, items: [{ id: 'crown_of_flames', qty: 1 }] },
    description: 'The Frost Dragon stirs beneath the highest peak. Slay it before its dreams freeze Aetheria.',
    completion: 'Runa\'s eyes shine. "The vision is fulfilled. Take this crown - it shall burn away any frost."',
  },
  frost_yetis: {
    id: 'frost_yetis',
    island: 'frostpeak',
    title: 'Vengeance for Bjorn',
    giver: 'frost bjorn',
    minLevel: 8,
    type: 'kill',
    target: { monster: 'yeti', count: 6 },
    reward: { xp: 500, gold: 200, items: [{ id: 'iron_shield', qty: 1 }] },
    description: 'Bjorn\'s brother was slain by yetis. Slay 6 yetis and Bjorn will give you his father\'s shield.',
    completion: 'Bjorn clasps your arm. "My brother rests easy now. Take this shield - it has guarded my family for generations."',
  },
  frost_pelts: {
    id: 'frost_pelts',
    island: 'frostpeak',
    title: 'Cloak of the North',
    giver: 'frost sigrid',
    minLevel: 6,
    type: 'collect',
    target: { item: 'wolf_pelt', count: 8 },
    reward: { xp: 300, gold: 180, items: [{ id: 'swift_boots', qty: 1 }] },
    description: 'Sigrid wants 8 ice wolf pelts. She will craft you swift boots in return.',
    completion: 'Sigrid presents the boots. "Walk light as the snowfall, hero."',
  },
  frost_mead: {
    id: 'frost_mead',
    island: 'frostpeak',
    title: 'A Bottle for Olaf',
    giver: 'frost olaf',
    minLevel: 6,
    type: 'collect',
    target: { item: 'bread', count: 3 },
    reward: { xp: 200, gold: 60, items: [{ id: 'health_potion', qty: 3 }] },
    description: 'Olaf wants 3 breads (he says they\'re for his hangover, not mead). Bring them.',
    completion: 'Olaf burps. "Ah, that hits the spot. Here, take these potions."',
  },
  frost_cure: {
    id: 'frost_cure',
    island: 'frostpeak',
    title: 'The Fever Spreads',
    giver: 'frost theresa',
    minLevel: 7,
    type: 'collect',
    target: { item: 'frost_shard', count: 5 },
    reward: { xp: 280, gold: 130, items: [{ id: 'greater_health_potion', qty: 2 }] },
    description: 'Theresa needs 5 frost shards to cure the fever spreading through the village.',
    completion: 'Theresa sighs in relief. "The fever breaks. Thank you, hero."',
  },
  frost_thralls: {
    id: 'frost_thralls',
    island: 'frostpeak',
    title: 'The Dragon\'s Thralls',
    giver: 'frost rune_keeper',
    minLevel: 8,
    type: 'kill',
    target: { monster: 'ice_wolf', count: 15 },
    reward: { xp: 600, gold: 250, items: [{ id: 'arcane_circlet', qty: 1 }] },
    description: 'Slay 15 ice wolves to weaken the Frost Dragon\'s hold on the isle.',
    completion: 'The Rune Keeper nods. "The thralls fall. The dragon grows weaker. Take this circlet."',
  },

  // ============================================================
  // MISTWOOD ISLE QUESTS
  // ============================================================
  mist_wraiths: {
    id: 'mist_wraiths',
    island: 'mistwood',
    title: 'The Corrupted Grove',
    giver: 'mist archdruid_thorne',
    minLevel: 7,
    type: 'kill',
    target: { monster: 'whispering_wraith', count: 6 },
    reward: { xp: 380, gold: 150, items: [{ id: 'arcane_focus', qty: 1 }] },
    description: 'Archdruid Thorne asks you to slay 6 Whispering Wraiths corrupting the groves.',
    completion: 'Thorne\'s voice softens. "The grove breathes easier. Take this focus - it pulses with the forest\'s gratitude."',
  },
  mist_petals: {
    id: 'mist_petals',
    island: 'mistwood',
    title: 'Petals of Mist',
    giver: 'mist sylva',
    minLevel: 7,
    type: 'collect',
    target: { item: 'mist_petal', count: 10 },
    reward: { xp: 350, gold: 180, items: [{ id: 'greater_mana_potion', qty: 3 }] },
    description: 'Sylva wants 10 mist petals to brew an elixir of vitality.',
    completion: 'Sylva hands you vials. "These will restore your spirit when the forest darkens."',
  },
  mist_treants: {
    id: 'mist_treants',
    island: 'mistwood',
    title: 'Restless Treants',
    giver: 'mist king_aldric',
    minLevel: 9,
    type: 'kill',
    target: { monster: 'treant', count: 5 },
    reward: { xp: 700, gold: 300, items: [{ id: 'boots_of_striding', qty: 1 }] },
    description: 'King Aldric asks you to slay 5 corrupted treants - by force, if necessary.',
    completion: 'Aldric bows. "The forest mourns them, but thanks you. Take these boots - they will speed your steps."',
  },
  mist_enchant: {
    id: 'mist_enchant',
    island: 'mistwood',
    title: 'Boots of Speed',
    giver: 'mist elara',
    minLevel: 8,
    type: 'collect',
    target: { item: 'mist_petal', count: 8 },
    reward: { xp: 380, gold: 200, items: [{ id: 'swift_boots', qty: 1 }] },
    description: 'Elara will enchant your boots with speed if you bring her 8 mist petals.',
    completion: 'Elara weaves the enchantment. "Run like the wind, hero."',
  },
  mist_snakes: {
    id: 'mist_snakes',
    island: 'mistwood',
    title: 'The Snake Infestation',
    giver: 'mist pip',
    minLevel: 7,
    type: 'kill',
    target: { monster: 'moss_snake', count: 10 },
    reward: { xp: 320, gold: 140, items: [{ id: 'health_potion', qty: 4 }] },
    description: 'Pip cannot work for the moss snakes. Slay 10 of them.',
    completion: 'Pip grins. "I can hear myself think again! Take these."',
  },
  mist_wraith_hunt: {
    id: 'mist_wraith_hunt',
    island: 'mistwood',
    title: 'Fear No Evil',
    giver: 'mist brother_oak',
    minLevel: 8,
    type: 'kill',
    target: { monster: 'whispering_wraith', count: 12 },
    reward: { xp: 600, gold: 280, items: [{ id: 'amulet_of_warding', qty: 1 }] },
    description: 'Brother Oak bids you slay 12 Whispering Wraiths to demonstrate fearlessness.',
    completion: 'Brother Oak rustles approvingly. "You are fearless indeed. Take this amulet."',
  },
  mist_dryads: {
    id: 'mist_dryads',
    island: 'mistwood',
    title: 'The Witch\'s Bargain',
    giver: 'mist morrigan',
    minLevel: 8,
    type: 'kill',
    target: { monster: 'dryad_guardian', count: 6 },
    reward: { xp: 500, gold: 220, items: [{ id: 'ring_of_wisdom', qty: 1 }] },
    description: 'Morrigan wants 6 dryad guardians slain. Questionable, but well-paid.',
    completion: 'Morrigan smirks. "You do not question. I like that. Here - a ring for the wise."',
  },
  mist_secret: {
    id: 'mist_secret',
    island: 'mistwood',
    title: 'A Traveler\'s Tale',
    giver: 'mist traveler',
    minLevel: 7,
    type: 'kill',
    target: { monster: 'moss_snake', count: 15 },
    reward: { xp: 400, gold: 200, items: [{ id: 'copper_ring', qty: 1 }] },
    description: 'The traveler asks you to slay 15 moss snakes. He says he will share a secret.',
    completion: 'The traveler leans in. "The secret is this: nothing in Mistwood is truly dead. Remember that."',
  },
  mist_wraith_count: {
    id: 'mist_wraith_count',
    island: 'mistwood',
    title: 'The Wraith Queen',
    giver: 'mist lyra',
    minLevel: 9,
    type: 'kill',
    target: { monster: 'whispering_wraith', count: 20 },
    reward: { xp: 900, gold: 400, items: [{ id: 'arcane_circlet', qty: 1 }] },
    description: 'Lyra the Bard sings of a Wraith Queen. Slay 20 wraiths and she may appear.',
    completion: 'Lyra strums her lute. "A new verse for the ballad of you! Take this circlet."',
  },
  mist_wraith_queen: {
    id: 'mist_wraith_queen',
    island: 'mistwood',
    title: 'Slay the Wraith Queen',
    giver: 'mist archdruid_thorne',
    minLevel: 13,
    type: 'boss',
    target: { monster: 'wraith_queen_sylvana', count: 1 },
    reward: { xp: 2200, gold: 800, items: [{ id: 'archmage_robe', qty: 1 }] },
    description: 'Wraith Queen Sylvana rules the corrupted heart of Mistwood. Slay her and the forest shall heal.',
    completion: 'Archdruid Thorne weeps with joy. "The grove is free. Take this robe - woven by the dryads themselves."',
  },
  mist_petals_trade: {
    id: 'mist_petals_trade',
    island: 'mistwood',
    title: 'Petal Trader',
    giver: 'mist collector',
    minLevel: 7,
    type: 'collect',
    target: { item: 'mist_petal', count: 15 },
    reward: { xp: 350, gold: 350, items: [] },
    description: 'The collector pays well for 15 mist petals.',
    completion: 'The collector bows. "A pleasure. Come again."',
  },
  mist_silk: {
    id: 'mist_silk',
    island: 'mistwood',
    title: 'Unseen Steps',
    giver: 'mist robin',
    minLevel: 7,
    type: 'collect',
    target: { item: 'spider_silk', count: 5 },
    reward: { xp: 280, gold: 150, items: [{ id: 'swift_boots', qty: 1 }] },
    description: 'Robin Hoodlum will teach you to move unseen for 5 spider silks.',
    completion: 'Robin winks. "Step light, friend. The boots are a start."',
  },
  mist_scout: {
    id: 'mist_scout',
    island: 'mistwood',
    title: 'Heartwood',
    giver: 'mist scout',
    minLevel: 9,
    type: 'kill',
    target: { monster: 'treant', count: 3 },
    reward: { xp: 500, gold: 220, items: [{ id: 'iron_ore', qty: 5 }] },
    description: 'The scout wants 3 treants slain to study their heartwood.',
    completion: 'The scout nods. "The corruption runs deep. But so does your skill."',
  },

  // ============================================================
  // SUNSCAR ISLE QUESTS
  // ============================================================
  sun_titan: {
    id: 'sun_titan',
    island: 'sunscar',
    title: 'The Sun Titan',
    giver: 'sun vizier_khalid',
    minLevel: 12,
    type: 'boss',
    target: { monster: 'sun_titan', count: 1 },
    reward: { xp: 2500, gold: 900, items: [{ id: 'dawnbringer', qty: 1 }] },
    description: 'The Sun Titan burns the land. Slay him in the great pyramid.',
    completion: 'Vizier Khalid kneels. "The oases flow again. Aetheria thanks you. Take the Dawnbringer."',
  },
  sun_scorpions: {
    id: 'sun_scorpions',
    island: 'sunscar',
    title: 'Clear the Roads',
    giver: 'sun merchant_zara',
    minLevel: 8,
    type: 'kill',
    target: { monster: 'sand_scorpion', count: 12 },
    reward: { xp: 450, gold: 200, items: [{ id: 'greater_health_potion', qty: 3 }] },
    description: 'Merchant Zara\'s caravans are blocked by scorpions. Slay 12.',
    completion: 'Zara smiles. "Trade resumes. Take these potions for the road."',
  },
  sun_talismans: {
    id: 'sun_talismans',
    island: 'sunscar',
    title: 'Talismans of the First Kings',
    giver: 'sun scholar_omar',
    minLevel: 9,
    type: 'collect',
    target: { item: 'ancient_talisman', count: 3 },
    reward: { xp: 500, gold: 240, items: [{ id: 'arcane_circlet', qty: 1 }] },
    description: 'Scholar Omar seeks 3 ancient talismans from the mummy lords.',
    completion: 'Omar\'s eyes widen. "I will tell you the Titan\'s true name: Rahotep. Use it, and he will fear you."',
  },
  sun_raiders: {
    id: 'sun_raiders',
    island: 'sunscar',
    title: 'Save the King',
    giver: 'sun princess_leyla',
    minLevel: 8,
    type: 'kill',
    target: { monster: 'desert_raider', count: 8 },
    reward: { xp: 450, gold: 280, items: [{ id: 'iron_shield', qty: 1 }] },
    description: 'Princess Leyla\'s father is held by desert raiders. Slay 8 of them.',
    completion: 'Leyla curtsies. "My father is free. Take this shield - it bears our royal crest."',
  },
  sun_iron: {
    id: 'sun_iron',
    island: 'sunscar',
    title: 'Sunscorched Steel',
    giver: 'sun ahmed',
    minLevel: 8,
    type: 'collect',
    target: { item: 'iron_ore', count: 10 },
    reward: { xp: 400, gold: 150, items: [{ id: 'steel_longsword', qty: 1 }] },
    description: 'Ahmed will forge you a steel longsword for 10 iron ores.',
    completion: 'Ahmed quenches the blade in oil. "Sunscorched steel - finest in Aetheria."',
  },
  sun_mummies: {
    id: 'sun_mummies',
    island: 'sunscar',
    title: 'The Walking Dead',
    giver: 'sun fatima',
    minLevel: 10,
    type: 'kill',
    target: { monster: 'mummy_lord', count: 5 },
    reward: { xp: 700, gold: 320, items: [{ id: 'arcane_focus', qty: 1 }] },
    description: 'Fatima sees mummy lords walking. Slay 5 to weaken the Sun Titan.',
    completion: 'Fatima intones. "The shadow recedes. Take this focus - it pulses with prophecy."',
  },
  sun_tomb: {
    id: 'sun_tomb',
    island: 'sunscar',
    title: 'The Lost Tomb',
    giver: 'sun carter',
    minLevel: 8,
    type: 'kill',
    target: { monster: 'desert_raider', count: 15 },
    reward: { xp: 600, gold: 280, items: [{ id: 'crown_of_flames', qty: 1 }] },
    description: 'Carter will share his map of Rahotep\'s tomb if you slay 15 raiders.',
    completion: 'Carter hands you a parchment. "The tomb is yours. And take this crown - I found it in the dunes."',
  },
  sun_phoenix: {
    id: 'sun_phoenix',
    island: 'sunscar',
    title: 'The Phoenix Bow',
    giver: 'sun yusuf',
    minLevel: 11,
    type: 'collect',
    target: { item: 'sunstone', count: 5 },
    reward: { xp: 700, gold: 300, items: [{ id: 'phoenix_bow', qty: 1 }] },
    description: 'Yusuf will trade a phoenix bow for 5 sunstones.',
    completion: 'Yusuf bows. "May your arrows fly true, hero."',
  },
  sun_patrol: {
    id: 'sun_patrol',
    island: 'sunscar',
    title: 'City Patrol',
    giver: 'sun guard_captain',
    minLevel: 8,
    type: 'kill',
    target: { monster: 'desert_raider', count: 10 },
    reward: { xp: 450, gold: 200, items: [{ id: 'chainmail', qty: 1 }] },
    description: 'Captain Tariq asks you to slay 10 desert raiders.',
    completion: 'Tariq nods. "The city rests easy. Take this chainmail."',
  },

  // ============================================================
  // TIDEHAVEN ISLE QUESTS
  // ============================================================
  tide_smugglers: {
    id: 'tide_smugglers',
    island: 'tidehaven',
    title: 'The Smuggler\'s Ledger',
    giver: 'tide harbor_master',
    minLevel: 10,
    type: 'collect',
    target: { item: 'captain_ledger', count: 1 },
    reward: { xp: 600, gold: 300, items: [{ id: 'tower_shield', qty: 1 }] },
    description: 'Harbor Master Jorah wants the Captain\'s Ledger from the murlocs.',
    completion: 'Jorah pages through the ledger. "These names will hang. Take this shield."',
  },
  tide_kraken: {
    id: 'tide_kraken',
    island: 'tidehaven',
    title: 'The Kraken',
    giver: 'tide captain_neri',
    minLevel: 14,
    type: 'boss',
    target: { monster: 'kraken', count: 1 },
    reward: { xp: 2500, gold: 900, items: [{ id: 'staff_of_storms', qty: 1 }] },
    description: 'Captain Neri wants the Kraken slain. It has taken three of her ships.',
    completion: 'Neri stands at the helm. "The seas are safe. Take this staff - it commands storms."',
  },
  tide_crabs: {
    id: 'tide_crabs',
    island: 'tidehaven',
    title: 'The Infested Cove',
    giver: 'tide mira',
    minLevel: 9,
    type: 'kill',
    target: { monster: 'crab', count: 10 },
    reward: { xp: 450, gold: 200, items: [{ id: 'pearl', qty: 1 }] },
    description: 'Mira wants 10 giant crabs slain in her cove.',
    completion: 'Mira hands you a lustrous pearl. "My lucky one. \'Tis yours now."',
  },
  tide_murlocs: {
    id: 'tide_murlocs',
    island: 'tidehaven',
    title: 'Old Sal\'s Treasure',
    giver: 'tide old_sal',
    minLevel: 9,
    type: 'kill',
    target: { monster: 'murloc', count: 15 },
    reward: { xp: 700, gold: 320, items: [{ id: 'crown_of_flames', qty: 1 }] },
    description: 'Old Sal says slay 15 murlocs and he\'ll share his treasure map.',
    completion: 'Sal whispers. "The treasure was a friend\'s smile all along. But take this crown - I found it underwater."',
  },
  tide_serpents: {
    id: 'tide_serpents',
    island: 'tidehaven',
    title: 'Avenging the Lost',
    giver: 'tide sister_mira',
    minLevel: 10,
    type: 'kill',
    target: { monster: 'sea_serpent', count: 5 },
    reward: { xp: 600, gold: 280, items: [{ id: 'blessed_mace', qty: 1 }] },
    description: 'Sister Mira asks you to slay 5 sea serpents for the lost fishermen.',
    completion: 'Mira intones a prayer. "Their souls are at peace. Take this blessed mace."',
  },
  tide_pearls: {
    id: 'tide_pearls',
    island: 'tidehaven',
    title: 'Pearls for a Shield',
    giver: 'tide bryn',
    minLevel: 9,
    type: 'collect',
    target: { item: 'pearl', count: 5 },
    reward: { xp: 500, gold: 200, items: [{ id: 'tower_shield', qty: 1 }] },
    description: 'Bryn will forge you a tower shield for 5 pearls.',
    completion: 'Bryn hefts the shield. "Iron-bone and pearl-dust. Unbreakable."',
  },
  tide_pearl_trade: {
    id: 'tide_pearl_trade',
    island: 'tidehaven',
    title: 'The Pearl Trade',
    giver: 'tide marcus',
    minLevel: 9,
    type: 'collect',
    target: { item: 'pearl', count: 10 },
    reward: { xp: 550, gold: 500, items: [] },
    description: 'Marcus will pay a fortune for 10 pearls.',
    completion: 'Marcus grins. "Rich! We\'re both rich!"',
  },
  tide_light: {
    id: 'tide_light',
    island: 'tidehaven',
    title: 'Rebuild the Light',
    giver: 'tide lighthouse_keeper',
    minLevel: 9,
    type: 'kill',
    target: { monster: 'murloc', count: 8 },
    reward: { xp: 450, gold: 220, items: [{ id: 'greater_health_potion', qty: 3 }] },
    description: 'Slay 8 murlocs so villagers can rebuild the lighthouse.',
    completion: 'The keeper beams. "The light will shine again. Take these."',
  },
  tide_warehouse: {
    id: 'tide_warehouse',
    island: 'tidehaven',
    title: 'Warehouse Crabs',
    giver: 'tide dockmaster',
    minLevel: 9,
    type: 'kill',
    target: { monster: 'crab', count: 12 },
    reward: { xp: 500, gold: 240, items: [{ id: 'leather_boots', qty: 1 }] },
    description: 'Dockmaster Rurik wants 12 crabs cleared from the warehouse docks.',
    completion: 'Rurik nods. "Cargo flows again. Take these boots."',
  },
  tide_silk: {
    id: 'tide_silk',
    island: 'tidehaven',
    title: 'Sea Silk',
    giver: 'tide selina',
    minLevel: 9,
    type: 'collect',
    target: { item: 'spider_silk', count: 10 },
    reward: { xp: 450, gold: 200, items: [{ id: 'sorcerer_robe', qty: 1 }] },
    description: 'Selina will craft you a sorcerer\'s robe for 10 spider silks.',
    completion: 'Selina presents the robe. "Woven with sea-magic. May it serve you well."',
  },
  tide_history: {
    id: 'tide_history',
    island: 'tidehaven',
    title: 'Why the Kraken Wakes',
    giver: 'tide historian',
    minLevel: 10,
    type: 'kill',
    target: { monster: 'sea_serpent', count: 6 },
    reward: { xp: 700, gold: 300, items: [{ id: 'arcane_circlet', qty: 1 }] },
    description: 'The historian seeks 6 sea serpents slain to learn why the Kraken wakes.',
    completion: 'The historian pores over scrolls. "It is the Voidlord\'s influence. The seas feel it. Take this circlet."',
  },

  // ============================================================
  // SHADOWFEN ISLE QUESTS
  // ============================================================
  sf_lich_queen: {
    id: 'sf_lich_queen',
    island: 'shadowfen',
    title: 'The Lich Queen',
    giver: 'sf witch_morgana',
    minLevel: 16,
    type: 'boss',
    target: { monster: 'lich_queen_mortis', count: 1 },
    reward: { xp: 3500, gold: 1200, items: [{ id: 'hierophant_robe', qty: 1 }] },
    description: 'The Lich Queen Mortis must be slain in her tower of bone.',
    completion: 'Morgana\'s eyes blaze. "The shadow lifts. Take this robe - it was mine, long ago."',
  },
  sf_death_knights: {
    id: 'sf_death_knights',
    island: 'shadowfen',
    title: 'Free the Slaves',
    giver: 'sf kael',
    minLevel: 13,
    type: 'kill',
    target: { monster: 'death_knight', count: 5 },
    reward: { xp: 1200, gold: 500, items: [{ id: 'plate_armor', qty: 1 }] },
    description: 'Kael asks you to slay 5 Death Knights to free their souls.',
    completion: 'Kael\'s spirit shimmers. "I am free. Take this plate - it was mine in life."',
  },
  sf_bones: {
    id: 'sf_bones',
    island: 'shadowfen',
    title: 'Bone Collector',
    giver: 'sf mother_hag',
    minLevel: 11,
    type: 'collect',
    target: { item: 'bone_fragment', count: 20 },
    reward: { xp: 800, gold: 400, items: [{ id: 'elixir_of_might', qty: 1 }] },
    description: 'Mother Hag will brew an elixir of might for 20 bone fragments.',
    completion: 'The hag cackles. "Drink up, pretty. The dead made you stronger."',
  },
  sf_skeletons: {
    id: 'sf_skeletons',
    island: 'shadowfen',
    title: 'Continue Brother Cole\'s Work',
    giver: 'sf brother_cole',
    minLevel: 10,
    type: 'kill',
    target: { monster: 'skeleton', count: 10 },
    reward: { xp: 600, gold: 280, items: [{ id: 'blessed_mace', qty: 1 }] },
    description: 'Brother Cole asks you to slay 10 skeletons in his stead.',
    completion: 'Cole clasps his hands. "The Light thanks you. Take this mace."',
  },
  sf_spirits: {
    id: 'sf_spirits',
    island: 'shadowfen',
    title: 'Bog Spirit Essence',
    giver: 'sf vera',
    minLevel: 11,
    type: 'kill',
    target: { monster: 'bog_spirit', count: 12 },
    reward: { xp: 750, gold: 350, items: [{ id: 'greater_mana_potion', qty: 4 }] },
    description: 'Vera wants 12 bog spirits slain for their essence.',
    completion: 'Vera bottles the essences. "Valuable stuff. Take these potions."',
  },
  sf_grave: {
    id: 'sf_grave',
    island: 'shadowfen',
    title: 'The Sleepless Graveyard',
    giver: 'sf gravekeeper',
    minLevel: 10,
    type: 'kill',
    target: { monster: 'skeleton', count: 15 },
    reward: { xp: 800, gold: 350, items: [{ id: 'iron_helm', qty: 1 }] },
    description: 'Gravekeeper Tomas wants 15 skeletons slain so the graveyard may rest.',
    completion: 'Tomas sighs in relief. "Quiet at last. Take this helm."',
  },
  sf_liches: {
    id: 'sf_liches',
    island: 'shadowfen',
    title: 'Weaken the Queen',
    giver: 'sf lady_mortis',
    minLevel: 12,
    type: 'kill',
    target: { monster: 'plague_lich', count: 3 },
    reward: { xp: 900, gold: 400, items: [{ id: 'arcane_circlet', qty: 1 }] },
    description: 'Lady Mortis asks you to slay 3 plague liches to weaken the Lich Queen.',
    completion: 'Mortis\'s eyes shimmer. "My sister will fall. Take this circlet."',
  },
  sf_void: {
    id: 'sf_void',
    island: 'shadowfen',
    title: 'Void Crystals',
    giver: 'sf smuggler_jack',
    minLevel: 12,
    type: 'collect',
    target: { item: 'void_crystal', count: 10 },
    reward: { xp: 1000, gold: 500, items: [{ id: 'amulet_of_warding', qty: 1 }] },
    description: 'Jack will trade you an amulet of warding for 10 void crystals.',
    completion: 'Jack pockets the crystals. "Pleasure. Take the amulet - it\'ll save your life."',
  },
  sf_study: {
    id: 'sf_study',
    island: 'shadowfen',
    title: 'A Scholar\'s Request',
    giver: 'sf scholar',
    minLevel: 11,
    type: 'kill',
    target: { monster: 'bog_spirit', count: 20 },
    reward: { xp: 1100, gold: 480, items: [{ id: 'arcane_focus', qty: 1 }] },
    description: 'The scholar wants 20 bog spirits slain for study.',
    completion: 'The scholar nods. "Fascinating. Take this focus for your trouble."',
  },
  sf_plague: {
    id: 'sf_plague',
    island: 'shadowfen',
    title: 'Clear the Air',
    giver: 'sf hunter',
    minLevel: 12,
    type: 'kill',
    target: { monster: 'plague_lich', count: 8 },
    reward: { xp: 1200, gold: 500, items: [{ id: 'plate_armor', qty: 1 }] },
    description: 'The hunter wants 8 plague liches slain to clear the diseased air.',
    completion: 'The hunter inhales deeply. "Breathable. Take this plate."',
  },
  sf_widow: {
    id: 'sf_widow',
    island: 'shadowfen',
    title: 'The Widow\'s Vengeance',
    giver: 'sf widow',
    minLevel: 13,
    type: 'kill',
    target: { monster: 'death_knight', count: 2 },
    reward: { xp: 700, gold: 350, items: [{ id: 'ring_of_vigor', qty: 1 }] },
    description: 'The widow begs you to slay 2 death knights to avenge her husband.',
    completion: 'The widow weeps. "He is avenged. Take his ring."',
  },
  sf_gravedigger: {
    id: 'sf_gravedigger',
    island: 'shadowfen',
    title: 'Climbing Out',
    giver: 'sf gravedigger',
    minLevel: 12,
    type: 'kill',
    target: { monster: 'plague_lich', count: 6 },
    reward: { xp: 1000, gold: 450, items: [{ id: 'ring_of_wisdom', qty: 1 }] },
    description: 'Sam wants 6 plague liches slain. His employer pays well.',
    completion: 'Sam hands you a ring. "From the boss. Said you earned it."',
  },
  sf_alchemist: {
    id: 'sf_alchemist',
    island: 'shadowfen',
    title: 'The Alchemist\'s Secret',
    giver: 'sf alchemist',
    minLevel: 12,
    type: 'collect',
    target: { item: 'void_crystal', count: 5 },
    reward: { xp: 800, gold: 400, items: [{ id: 'elixir_of_might', qty: 2 }] },
    description: 'Alchemist Vex wants 5 void crystals to show you a secret.',
    completion: 'Vex grins. "The secret is power. Take these elixirs."',
  },

  // ============================================================
  // SKYREACH ISLE QUESTS
  // ============================================================
  sky_drake: {
    id: 'sky_drake',
    island: 'skyreach',
    title: 'The Thunder Drake',
    giver: 'sky archmage_solara',
    minLevel: 18,
    type: 'boss',
    target: { monster: 'thunder_drake', count: 1 },
    reward: { xp: 4000, gold: 1400, items: [{ id: 'staff_of_storms', qty: 1 }] },
    description: 'The Thunder Drake must be slain atop Skyreach before it lays its eggs.',
    completion: 'Solara beams. "Aetheria is spared a storm of wyrms. Take this staff."',
  },
  sky_harpies: {
    id: 'sky_harpies',
    island: 'skyreach',
    title: 'Reclaim the Aeries',
    giver: 'sky captain_aerie',
    minLevel: 13,
    type: 'kill',
    target: { monster: 'harpy', count: 12 },
    reward: { xp: 1400, gold: 600, items: [{ id: 'crossbow', qty: 1 }] },
    description: 'Captain Aerie wants 12 harpies slain to reclaim the eastern aeries.',
    completion: 'Aerie salutes. "The aeries are ours. Take this crossbow."',
  },
  sky_sprites: {
    id: 'sky_sprites',
    island: 'skyreach',
    title: 'The Stolen Spellbook',
    giver: 'sky mistress_luna',
    minLevel: 12,
    type: 'kill',
    target: { monster: 'cloud_sprite', count: 10 },
    reward: { xp: 1000, gold: 480, items: [{ id: 'archmage_robe', qty: 1 }] },
    description: 'Luna\'s spellbook was stolen by cloud sprites. Slay 10.',
    completion: 'Luna hugs her recovered book. "Take this robe - it was woven with cloud-magic."',
  },
  sky_elementals: {
    id: 'sky_elementals',
    island: 'skyreach',
    title: 'Clear the Path',
    giver: 'sky stormrider',
    minLevel: 14,
    type: 'kill',
    target: { monster: 'storm_elemental', count: 8 },
    reward: { xp: 1300, gold: 550, items: [{ id: 'arcane_focus', qty: 1 }] },
    description: 'Slay 8 storm elementals to clear the path to the drake\'s nest.',
    completion: 'Thane nods. "The path is clear. Take this focus."',
  },
  sky_whispers: {
    id: 'sky_whispers',
    island: 'skyreach',
    title: 'Whispers of the Wind',
    giver: 'sky brother_wind',
    minLevel: 13,
    type: 'kill',
    target: { monster: 'harpy', count: 15 },
    reward: { xp: 1500, gold: 600, items: [{ id: 'boots_of_striding', qty: 1 }] },
    description: 'Brother Wind says slay 15 harpies and the winds will whisper to you.',
    completion: 'Wind smiles. "The winds speak your name now. Take these boots."',
  },
  sky_scales: {
    id: 'sky_scales',
    island: 'skyreach',
    title: 'Scales of the Wyrm',
    giver: 'sky sky_merchant',
    minLevel: 14,
    type: 'collect',
    target: { item: 'wyrm_scale', count: 5 },
    reward: { xp: 1200, gold: 600, items: [{ id: 'dragonscale', qty: 1 }] },
    description: 'The Sky Merchant will sell anything for 5 wyrm scales.',
    completion: 'The merchant bows. "Dragonscale armor, as promised."',
  },
  sky_stars: {
    id: 'sky_stars',
    island: 'skyreach',
    title: 'The Shifted Stars',
    giver: 'sky watcher',
    minLevel: 14,
    type: 'kill',
    target: { monster: 'storm_elemental', count: 20 },
    reward: { xp: 2000, gold: 800, items: [{ id: 'crown_of_flames', qty: 1 }] },
    description: 'The Star Watcher wants 20 storm elementals slain to realign the heavens.',
    completion: 'The watcher gazes upward. "The stars return. Take this crown."',
  },
  sky_feathers: {
    id: 'sky_feathers',
    island: 'skyreach',
    title: 'Cloud Feathers',
    giver: 'sky herbalist',
    minLevel: 12,
    type: 'collect',
    target: { item: 'mist_petal', count: 10 },
    reward: { xp: 1000, gold: 500, items: [{ id: 'crown_of_flames', qty: 1 }] },
    description: 'The Cloud Herbalist will craft you a crown of flames for 10 mist petals.',
    completion: 'The herbalist weaves the crown. "Wear it proudly, hero."',
  },

  // ============================================================
  // VOIDHEART ISLE QUESTS
  // ============================================================
  void_acheron: {
    id: 'void_acheron',
    island: 'voidheart',
    title: 'The Voidlord',
    giver: 'void watcher_aza',
    minLevel: 22,
    type: 'boss',
    target: { monster: 'voidlord_acheron', count: 1 },
    reward: { xp: 8000, gold: 3000, items: [{ id: 'dragonscale', qty: 1 }, { id: 'crown_of_flames', qty: 1 }] },
    description: 'The final battle. Voidlord Acheron must be slain to save Aetheria.',
    completion: 'Watcher Aza kneels. "Aetheria is saved. Your name shall be sung forever. Take these - the spoils of salvation."',
  },
  void_spawns: {
    id: 'void_spawns',
    island: 'voidheart',
    title: 'Free the Fallen Hero',
    giver: 'void hero_kael',
    minLevel: 18,
    type: 'kill',
    target: { monster: 'void_spawn', count: 10 },
    reward: { xp: 2500, gold: 1000, items: [{ id: 'super_health_potion', qty: 3 }] },
    description: 'Fallen Hero Kael asks you to slay 10 void spawns so his spirit may rest.',
    completion: 'Kael\'s spirit shimmers and fades. "Free at last. Take these potions."',
  },
  void_crystals: {
    id: 'void_crystals',
    island: 'voidheart',
    title: 'Crystals of the Void',
    giver: 'void merchant',
    minLevel: 18,
    type: 'collect',
    target: { item: 'void_crystal', count: 20 },
    reward: { xp: 3000, gold: 1500, items: [{ id: 'flamebrand', qty: 1 }] },
    description: 'The Void Merchant will sell you legendary weapons for 20 void crystals.',
    completion: 'The merchant bows. "Flamebrand - the blade of the Emberlord. Wield it against Acheron."',
  },
  void_brutes: {
    id: 'void_brutes',
    island: 'voidheart',
    title: 'Open the Path',
    giver: 'void priestess',
    minLevel: 19,
    type: 'kill',
    target: { monster: 'demon_brute', count: 15 },
    reward: { xp: 3500, gold: 1200, items: [{ id: 'hierophant_robe', qty: 1 }] },
    description: 'Slay 15 demon brutes to open the path to Acheron\'s throne.',
    completion: 'The priestess intones. "The path opens. Take this robe - may it shield you in the final battle."',
  },
  void_scales: {
    id: 'void_scales',
    island: 'voidheart',
    title: 'Reforge a Legend',
    giver: 'void blacksmith',
    minLevel: 18,
    type: 'collect',
    target: { item: 'wyrm_scale', count: 10 },
    reward: { xp: 2500, gold: 1000, items: [{ id: 'dragonscale', qty: 1 }] },
    description: 'The Void Smith will reforge your armor with 10 wyrm scales.',
    completion: 'The smith hammers the scales into dragonscale plate. "Wear it. It will turn aside even Acheron\'s blows."',
  },
  void_history: {
    id: 'void_history',
    island: 'voidheart',
    title: 'The Jealous God',
    giver: 'void sage',
    minLevel: 18,
    type: 'collect',
    target: { item: 'void_crystal', count: 5 },
    reward: { xp: 2000, gold: 800, items: [{ id: 'arcane_focus', qty: 1 }] },
    description: 'The sage wants 5 void crystals to study the legend of Acheron.',
    completion: 'The sage intones. "Acheron was a god of creation. His jealousy made him the void. Take this focus."',
  },
  void_shadows: {
    id: 'void_shadows',
    island: 'voidheart',
    title: 'Release the Shade',
    giver: 'void shade',
    minLevel: 19,
    type: 'kill',
    target: { monster: 'shadow_demon', count: 20 },
    reward: { xp: 4000, gold: 1500, items: [{ id: 'amulet_of_warding', qty: 1 }] },
    description: 'Slay 20 shadow demons so the Wandering Shade may be released.',
    completion: 'The shade dissolves into light. "Free... take this... amulet..."',
  },
  void_knight: {
    id: 'void_knight',
    island: 'voidheart',
    title: 'The Cursed Knight',
    giver: 'void knight',
    minLevel: 18,
    type: 'kill',
    target: { monster: 'demon_brute', count: 5 },
    reward: { xp: 2000, gold: 900, items: [{ id: 'plate_armor', qty: 1 }] },
    description: 'The Void Knight will aid you if you slay 5 demon brutes.',
    completion: 'The knight salutes. "My strength is yours. Take this plate."',
  },
  void_alchemist: {
    id: 'void_alchemist',
    island: 'voidheart',
    title: 'The Secret of Immortality',
    giver: 'void alchemist',
    minLevel: 19,
    type: 'collect',
    target: { item: 'void_crystal', count: 15 },
    reward: { xp: 3500, gold: 1400, items: [{ id: 'elixir_of_might', qty: 3 }] },
    description: 'The Void Alchemist will share the secret of immortality for 15 void crystals.',
    completion: 'The alchemist smiles. "The secret is this: there is no immortality, only delayed death. Take these elixirs."',
  },
  void_fearless: {
    id: 'void_fearless',
    island: 'voidheart',
    title: 'Fear No Evil',
    giver: 'void mystic',
    minLevel: 19,
    type: 'kill',
    target: { monster: 'shadow_demon', count: 12 },
    reward: { xp: 3000, gold: 1200, items: [{ id: 'crown_of_flames', qty: 1 }] },
    description: 'Slay 12 shadow demons to make your courage absolute.',
    completion: 'The mystic intones. "You fear nothing now. Take this crown - it burns away fear."',
  },
  void_plate: {
    id: 'void_plate',
    island: 'voidheart',
    title: 'The Final Armor',
    giver: 'void armorer',
    minLevel: 18,
    type: 'collect',
    target: { item: 'wyrm_scale', count: 5 },
    reward: { xp: 2500, gold: 1000, items: [{ id: 'dragonscale', qty: 1 }] },
    description: 'The Void Armorer will give you dragonscale plate for 5 wyrm scales.',
    completion: 'The armorer hefts the plate. "Acheron cannot pierce this. Wear it with honor."',
  },
}

// ============================================================
// Quest helpers
// ============================================================
export function getQuest(id) {
  return QUESTS[id]
}

export function getQuestsForIsland(islandId) {
  return Object.values(QUESTS).filter(q => q.island === islandId)
}

export function getQuestsByGiver(npcId) {
  return Object.values(QUESTS).filter(q => q.giver === npcId)
}

// ============================================================
// Quest system logic (formerly systems/quests.js)
// ============================================================

export const QUEST_STATUS = {
  AVAILABLE: 'available',
  ACTIVE: 'active',
  COMPLETE: 'complete',
  TURNED_IN: 'turned_in',
}

export function getQuestState(questProgress, questId) {
  return questProgress[questId] || QUEST_STATUS.AVAILABLE
}

export function canAcceptQuest(player, questProgress, questId) {
  const quest = getQuest(questId)
  if (!quest) return false
  const state = getQuestState(questProgress, questId)
  if (state !== QUEST_STATUS.AVAILABLE) return false
  if (player.level < quest.minLevel) return false
  return true
}

export function acceptQuest(questProgress, questId) {
  return { ...questProgress, [questId]: QUEST_STATUS.ACTIVE }
}

// Called when player kills a monster - update kill quests
export function onMonsterKilled(questProgress, monsterId) {
  const updated = { ...questProgress }
  for (const quest of Object.values(QUESTS)) {
    const state = updated[quest.id]
    if (state !== QUEST_STATUS.ACTIVE) continue
    if (quest.type !== 'kill' && quest.type !== 'boss') continue
    if (quest.target.monster !== monsterId) continue
    // we track count in a separate field; mark complete when count met (handled in Game)
  }
  return updated
}

// Check quest completion based on player state
export function checkQuestCompletion(player, inventory, questProgress, killCounts = {}) {
  const updated = { ...questProgress }
  const newlyCompleted = []
  for (const quest of Object.values(QUESTS)) {
    if (updated[quest.id] !== QUEST_STATUS.ACTIVE) continue
    let done = false
    if (quest.type === 'kill' || quest.type === 'boss') {
      done = (killCounts[quest.target.monster] || 0) >= quest.target.count
    } else if (quest.type === 'collect') {
      const have = inventory.filter(i => i.id === quest.target.item).reduce((s, i) => s + i.qty, 0)
      done = have >= quest.target.count
    }
    if (done) {
      updated[quest.id] = QUEST_STATUS.COMPLETE
      newlyCompleted.push(quest.id)
    }
  }
  return { questProgress: updated, newlyCompleted }
}

// Turn in a quest: give rewards, mark turned_in
export function turnInQuest(player, inventory, questProgress, questId) {
  const quest = getQuest(questId)
  if (!quest) return { player, inventory, questProgress }
  if (questProgress[questId] !== QUEST_STATUS.COMPLETE) {
    return { player, inventory, questProgress }
  }
  const updated = { ...questProgress, [questId]: QUEST_STATUS.TURNED_IN }
  // remove collected items
  let newInv = inventory
  if (quest.type === 'collect') {
    let remaining = quest.target.count
    const filtered = []
    for (const inv of inventory) {
      if (inv.id === quest.target.item && remaining > 0) {
        if (inv.qty > remaining) {
          filtered.push({ ...inv, qty: inv.qty - remaining })
          remaining = 0
        } else {
          remaining -= inv.qty
        }
      } else {
        filtered.push(inv)
      }
    }
    newInv = filtered
  }
  // apply rewards
  const newPlayer = { ...player }
  newPlayer.gold = (newPlayer.gold || 0) + (quest.reward.gold || 0)
  if (quest.reward.items) {
    for (const item of quest.reward.items) {
      newInv = addItemToInventoryHelper(newInv, item.id, item.qty)
    }
  }
  // XP handled separately to show level-up animation
  newPlayer.pendingXp = (newPlayer.pendingXp || 0) + (quest.reward.xp || 0)
  return { player: newPlayer, inventory: newInv, questProgress: updated }
}

function addItemToInventoryHelper(inventory, itemId, qty) {
  // mirror of inventory.js
  const existing = inventory.find(i => i.id === itemId)
  if (existing) {
    return inventory.map(i => i.id === itemId ? { ...i, qty: i.qty + qty } : i)
  }
  return [...inventory, { id: itemId, qty }]
}

// Get progress text for a quest
export function getQuestProgressText(quest, inventory, killCounts) {
  if (quest.type === 'kill' || quest.type === 'boss') {
    const cur = killCounts[quest.target.monster] || 0
    return `${Math.min(cur, quest.target.count)} / ${quest.target.count} ${quest.target.monster.replace(/_/g, ' ')} slain`
  }
  if (quest.type === 'collect') {
    const cur = inventory.filter(i => i.id === quest.target.item).reduce((s, i) => s + i.qty, 0)
    return `${Math.min(cur, quest.target.count)} / ${quest.target.count} collected`
  }
  return ''
}

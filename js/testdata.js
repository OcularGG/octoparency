/**
 * Test data for BattleTab
 * Contains sample deaths/kills for demo purposes
 */

// Sample equipment for different roles
const SAMPLE_EQUIPMENT = {
  mage: {
    MainHand: { Type: "T8_MAIN_ARCANESTAFF", Quality: 4 },
    OffHand: { Type: "T7_OFF_BOOK", Quality: 3 },
    Head: { Type: "T8_HEAD_CLOTH_SET3", Quality: 4 },
    Armor: { Type: "T8_ARMOR_CLOTH_SET3", Quality: 3 },
    Shoes: { Type: "T7_SHOES_CLOTH_SET3", Quality: 4 },
    Cape: { Type: "T6_CAPEITEM_FW_MARTLOCK", Quality: 3 },
    Mount: { Type: "T8_MOUNT_ARMORED_HORSE", Quality: 1 }
  },
  healer: {
    MainHand: { Type: "T8_MAIN_HOLYSTAFF", Quality: 4 },
    OffHand: null,
    Head: { Type: "T7_HEAD_CLOTH_SET2", Quality: 3 },
    Armor: { Type: "T8_ARMOR_CLOTH_SET2", Quality: 4 },
    Shoes: { Type: "T7_SHOES_CLOTH_SET2", Quality: 3 },
    Cape: { Type: "T6_CAPEITEM_FW_LYMHURST", Quality: 4 },
    Mount: { Type: "T8_MOUNT_SWAMPDRAGON", Quality: 1 }
  },
  tank: {
    MainHand: { Type: "T8_MAIN_MACE", Quality: 5 },
    OffHand: { Type: "T8_OFF_SHIELD", Quality: 4 },
    Head: { Type: "T8_HEAD_PLATE_SET1", Quality: 4 },
    Armor: { Type: "T8_ARMOR_PLATE_SET1", Quality: 4 },
    Shoes: { Type: "T8_SHOES_PLATE_SET1", Quality: 4 },
    Cape: { Type: "T6_CAPEITEM_FW_FORTSTERLING", Quality: 3 },
    Mount: { Type: "T7_MOUNT_MAMMOTH", Quality: 2 }
  },
  dps: {
    MainHand: { Type: "T8_2H_CLAYMORE", Quality: 5 },
    OffHand: null,
    Head: { Type: "T8_HEAD_LEATHER_SET3", Quality: 4 },
    Armor: { Type: "T8_ARMOR_LEATHER_SET3", Quality: 4 },
    Shoes: { Type: "T8_SHOES_LEATHER_SET3", Quality: 4 },
    Cape: { Type: "T7_CAPEITEM_FW_BRIDGEWATCH", Quality: 3 },
    Mount: { Type: "T8_MOUNT_DIREWOLF", Quality: 3 }
  },
  support: {
    MainHand: { Type: "T8_MAIN_FROSTSTAFF", Quality: 4 },
    OffHand: { Type: "T7_OFF_CENSER", Quality: 3 },
    Head: { Type: "T7_HEAD_CLOTH_SET1", Quality: 3 },
    Armor: { Type: "T7_ARMOR_CLOTH_SET1", Quality: 3 },
    Shoes: { Type: "T7_SHOES_CLOTH_SET1", Quality: 3 },
    Cape: { Type: "T7_CAPEITEM_FW_THETFORD", Quality: 3 },
    Mount: { Type: "T6_MOUNT_DIREBEAR", Quality: 2 }
  }
};

// Test death events data
const TEST_DEATHS = [
  {
    EventId: "test-death-12345",
    TimeStamp: new Date().toISOString(),
    TotalVictimKillFame: 750000,
    Victim: {
      Name: "BattleTab Developer Alpha",
      GuildName: "BattleTab",
      AllianceName: "BattleTab Alliance",
      AllianceId: "TH8JjVwVRiuFnalrzESkRQ", // Using Double Overcharge ID
      AverageItemPower: 1350,
      Equipment: SAMPLE_EQUIPMENT.mage
    },
    Killer: {
      Name: "ZvZ Commander",
      GuildName: "Victory or Death",
      AllianceName: "The Federation",
      AllianceId: "some-alliance-id"
    },
    Participants: [
      { Name: "ZvZ Commander", DamageDone: 2500 },
      { Name: "Arcane DPS", DamageDone: 1800 },
      { Name: "Bloodletter Finisher", DamageDone: 1500 },
      { Name: "Fire Mage", DamageDone: 1200 },
      { Name: "Frost Support", DamageDone: 800 }
    ],
    Location: "Black Zone - Siluria",
    eventType: "death"
  },
  {
    EventId: "test-death-67890",
    TimeStamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    TotalVictimKillFame: 1250000,
    Victim: {
      Name: "BattleTab Developer Beta",
      GuildName: "BattleTab",
      AllianceName: "BattleTab Alliance",
      AllianceId: "TH8JjVwVRiuFnalrzESkRQ", // Using Double Overcharge ID
      AverageItemPower: 1475,
      Equipment: SAMPLE_EQUIPMENT.healer
    },
    Killer: {
      Name: "Ganker Prime",
      GuildName: "Gank Squad",
      AllianceName: "The Shadows"
    },
    Participants: [
      { Name: "Ganker Prime", DamageDone: 3200 },
      { Name: "Ganker Two", DamageDone: 2800 },
      { Name: "Ganker Three", DamageDone: 2500 },
      { Name: "Scout", DamageDone: 1200 }
    ],
    Location: "Roads of Avalon",
    eventType: "death"
  },
  {
    EventId: "test-death-24680",
    TimeStamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    TotalVictimKillFame: 980000,
    Victim: {
      Name: "BattleTab Developer Delta",
      GuildName: "BattleTab",
      AllianceName: "BattleTab Alliance",
      AllianceId: "TH8JjVwVRiuFnalrzESkRQ",
      AverageItemPower: 1510,
      Equipment: SAMPLE_EQUIPMENT.tank
    },
    Killer: {
      Name: "Avalonian Champion",
      GuildName: "Avalon's Chosen",
      AllianceName: "Avalonian Order"
    },
    Participants: [
      { Name: "Avalonian Champion", DamageDone: 4200 },
      { Name: "Master Archer", DamageDone: 3100 },
      { Name: "Battle Cleric", DamageDone: 800 }
    ],
    Location: "Avalonian Road - Hideout Territory",
    eventType: "death"
  }
];

// Test kill events data
const TEST_KILLS = [
  {
    EventId: "test-kill-13579",
    TimeStamp: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    TotalVictimKillFame: 820000,
    Victim: {
      Name: "Enemy Gatherer",
      GuildName: "Resource Masters",
      AllianceName: "Gathering Collective",
      AverageItemPower: 1150,
      Equipment: SAMPLE_EQUIPMENT.dps
    },
    Killer: {
      Name: "BattleTab Developer Gamma",
      GuildName: "BattleTab",
      AllianceName: "BattleTab Alliance",
      AllianceId: "TH8JjVwVRiuFnalrzESkRQ" // Using Double Overcharge ID
    },
    Participants: [
      { Name: "BattleTab Developer Gamma", DamageDone: 3500 },
      { Name: "BattleTab Developer Epsilon", DamageDone: 2800 },
      { Name: "BattleTab Scout", DamageDone: 1200 }
    ],
    Location: "Redtree Enclave",
    eventType: "kill"
  },
  {
    EventId: "test-kill-97531",
    TimeStamp: new Date(Date.now() - 5400000).toISOString(), // 90 min ago
    TotalVictimKillFame: 1150000,
    Victim: {
      Name: "Solo Dungeon Diver",
      GuildName: "PvE Heroes",
      AllianceName: null,
      AverageItemPower: 1300,
      Equipment: SAMPLE_EQUIPMENT.support
    },
    Killer: {
      Name: "BattleTab Developer Theta",
      GuildName: "BattleTab",
      AllianceName: "BattleTab Alliance",
      AllianceId: "TH8JjVwVRiuFnalrzESkRQ" // Using Double Overcharge ID
    },
    Participants: [
      { Name: "BattleTab Developer Theta", DamageDone: 4500 }
    ],
    Location: "T8 Solo Dungeon",
    eventType: "kill"
  }
];

// Combined test events
const TEST_EVENTS = [...TEST_DEATHS, ...TEST_KILLS].sort((a, b) => 
  new Date(b.TimeStamp) - new Date(a.TimeStamp)
);

/**
 * Get test events for display
 * @param {number} limit - Maximum number of events to return
 * @returns {Array} Array of test events
 */
function getTestEvents(limit = 10) {
  return TEST_EVENTS.slice(0, limit);
}

/**
 * Get test deaths for display
 * @param {number} limit - Maximum number of deaths to return
 * @returns {Array} Array of test death events
 */
function getTestDeaths(limit = 10) {
  return TEST_DEATHS.slice(0, limit);
}

/**
 * Get test kills for display
 * @param {number} limit - Maximum number of kills to return
 * @returns {Array} Array of test kill events
 */
function getTestKills(limit = 10) {
  return TEST_KILLS.slice(0, limit);
}

/**
 * Get a single test event by ID
 * @param {string} eventId - Event ID to look up
 * @returns {Object|null} Event object or null if not found
 */
function getTestEventById(eventId) {
  return TEST_EVENTS.find(event => event.EventId === eventId) || null;
}

window.testData = {
  getTestEvents,
  getTestDeaths,
  getTestKills,
  getTestEventById
};

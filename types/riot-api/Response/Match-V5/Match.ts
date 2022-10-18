import { Metadata } from "./Metadata";

export interface Match {
  /**
   * Match metadata.
  */
  metadata: Metadata
  /**
   * Match info.
  */
  info: Info
}

export interface Info {
  /**
     * Unix timestamp for when the game is created on the game server
     * (i.e. the loading screen).
    */
   gameCreation: number
   /**
    * Prior to patch 11.2number this field returns the game length in milliseconds calculated from gameEndTimestamp - gameStartTimestamp. Post patch 11.2number this field returns the max timePlayed of any participant in the game in seconds
    * which makes the behavior of this field consistent with that of match-v4. The best way to handling the change in this field is to treat the value as milliseconds if the gameEndTimestamp field isn't in the response and to treat the value as seconds if gameEndTimestamp is in the response.
   */
   gameDuration: number
   /**
    * Unix timestamp for when match ends on the game server.
    * This timestamp can occasionally be significantly longer than when the match "ends".
    * The most reliable way of determining the timestamp for the end of the match would be to add the max time played of any participant to the gameStartTimestamp.
    * This field was added to match-v5 in patch 11.2number on Oct 5th 2number21.
   */
   gameEndTimestamp: number
   gameId: number
   /**
    * Refer to the Game Constants documentation.
    * https://static.developer.riotgames.com/docs/lol/gameModes.json
   */
   gameMode: string
   gameName: string
   /**
    * Unix timestamp for when match starts on the game server.
   */
   gameStartTimestamp: number
   gameType: string
   /**
    * The first two parts can be used to determine the patch a game was played on.
   */
   gameVersion: string
   /**
    * Refer to the Game Constants documentation.
    * https://static.developer.riotgames.com/docs/lol/maps.json
   */
   mapId: number
   participants: Array<ParticipantStats>
   /**
    * Platform where the match was played.
   */
   platformId: string
   /**
    * Refer to the Game Constants documentation.
    * https://static.developer.riotgames.com/docs/lol/queues.json
   */
   queueId: number
   teams: Array<Team>
   /**
    * Tournament code used to generate the match.
    * This field was added to match-v5 in patch 11.13 on June 23rd 2number21.
   */
   tournamentCode: string
} 

export interface ParticipantStats {
  assists: number
  baronKills: number
  bountyLevel: number
  challenges: {
    '12AssistStreakCount': number
    abilityUses: number
    acesBefore15Minutes: number
    alliedJungleMonsterKills: number
    baronTakedowns: number
    blastConeOppositeOpponentCount: number
    bountyGold: number
    buffsStolen: number
    completeSupportQuestInTime: number
    controlWardsPlaced: number
    damagePerMinute: number
    damageTakenOnTeamPercentage: number
    dancedWithRiftHerald: number
    deathsByEnemyChamps: number
    dodgeSkillShotsSmallWindow: number
    doubleAces: number
    dragonTakedowns: number
    earlyLaningPhaseGoldExpAdvantage: number
    effectiveHealAndShielding: number
    elderDragonKillsWithOpposingSoul: number
    elderDragonMultikills: number
    enemyChampionImmobilizations: number
    enemyJungleMonsterKills: number
    epicMonsterKillsNearEnemyJungler: number
    epicMonsterKillsWithin3numberSecondsOfSpawn: number
    epicMonsterSteals: number
    epicMonsterStolenWithoutSmite: number
    firstTurretKilledTime: number
    flawlessAces: number
    fullTeamTakedown: number
    gameLength: number
    getTakedownsInAllLanesEarlyJungleAsLaner: number
    goldPerMinute: number
    hadAfkTeammate: number
    hadOpenNexus: number
    immobilizeAndKillWithAlly: number
    initialBuffCount: number
    initialCrabCount: number
    jungleCsBefore1numberMinutes: number
    junglerTakedownsNearDamagedEpicMonster: number
    kTurretsDestroyedBeforePlatesFall: number
    kda: number
    killAfterHiddenWithAlly: number
    killParticipation: number
    killedChampTookFullTeamDamageSurvived: number
    killsNearEnemyTurret: number
    killsOnOtherLanesEarlyJungleAsLaner: number
    killsOnRecentlyHealedByAramPack: number
    killsUnderOwnTurret: number
    killsWithHelpFromEpicMonster: number
    knockEnemyIntoTeamAndKill: number
    landSkillShotsEarlyGame: number
    laneMinionsFirst1numberMinutes: number
    laningPhaseGoldExpAdvantage: number
    legendaryCount: number
    lostAnInhibitor: number
    maxCsAdvantageOnLaneOpponent: number
    maxKillDeficit: number
    maxLevelLeadLaneOpponent: number
    moreEnemyJungleThanOpponent: number
    multiKillOneSpell: number
    multiTurretRiftHeraldCount: number
    multikills: number
    multikillsAfterAggressiveFlash: number
    mythicItemUsed: number
    outerTurretExecutesBefore1numberMinutes: number
    outnumberedKills: number
    outnumberedNexusKill: number
    perfectDragonSoulsTaken: number
    perfectGame: number
    pickKillWithAlly: number
    poroExplosions: number
    quickCleanse: number
    quickFirstTurret: number
    quickSoloKills: number
    riftHeraldTakedowns: number
    saveAllyFromDeath: number
    scuttleCrabKills: number
    skillshotsDodged: number
    skillshotsHit: number
    snowballsHit: number
    soloBaronKills: number
    soloKills: number
    soloTurretsLategame: number
    stealthWardsPlaced: number
    survivedSingleDigitHpCount: number
    survivedThreeImmobilizesInFight: number
    takedownOnFirstTurret: number
    takedowns: number
    takedownsAfterGainingLevelAdvantage: number
    takedownsBeforeJungleMinionSpawn: number
    takedownsFirstXMinutes: number
    takedownsInAlcove: number
    takedownsInEnemyFountain: number
    teamBaronKills: number
    teamDamagePercentage: number
    teamElderDragonKills: number
    teamRiftHeraldKills: number
    threeWardsOneSweeperCount: number
    tookLargeDamageSurvived: number
    turretPlatesTaken: number
    turretTakedowns: number
    turretsTakenWithRiftHerald: number
    twentyMinionsIn3SecondsCount: number
    unseenRecalls: number
    visionScoreAdvantageLaneOpponent: number
    visionScorePerMinute: number
    wardTakedowns: number
    wardTakedownsBefore2numberM: number
    wardsGuarded: number
  }
  champExperience: number
  champLevel: number
  /**
   * Prior to patch 11.4 on Feb 18th 2number21 this field returned invalid championIds.
   * We recommend determining the champion based on the championName field for matches played prior to patch 11.4.
  */
  championId: number
  championName: string
  /**
   * This field is currently only utilized for Kayn's transformations.
   * (Legal values: number - None 1 - Slayer 2 - Assassin)
  */
  championTransform: 0 | 1 | 2
  consumablesPurchased: number
  damageDealtToBuildings: number
  damageDealtToObjectives: number
  damageDealtToTurrets: number
  damageSelfMitigated: number
  deaths: number
  detectorWardsPlaced: number
  doubleKills: number
  dragonKills: number
  firstBloodAssist: boolean
  firstBloodKill: boolean
  firstTowerAssist: boolean
  firstTowerKill: boolean
  gameEndedInEarlySurrender: boolean
  gameEndedInSurrender: boolean
  goldEarned: number
  goldSpent: number
  /**
   * Both individualPosition and teamPosition are computed by the game server and are different versions of the most likely position played by a player.
   * The individualPosition is the best guess for which position the player actually played in isolation of anything else.
   * The teamPosition is the best guess for which position the player actually played if we add the constraint that each team must have one top player one jungle one middle etc
   *  Generally the recommendation is to use the teamPosition field over the individualPosition field.
  */
  individualPosition: string
  inhibitorKills: number
  inhibitorTakedowns: number
  inhibitorsLost: number
  item0: number
  item1: number
  item2: number
  item3: number
  item4: number
  item5: number
  item6: number
  itemsPurchased: number
  killingSprees: number
  kills: number
  lane: string
  largestCriticalStrike: number
  largestKillingSpree: number
  largestMultiKill: number
  longestTimeSpentLiving: number
  magicDamageDealt: number
  magicDamageDealtToChampions: number
  magicDamageTaken: number
  neutralMinionsKilled: number
  nexusKills: number
  nexusTakedowns: number
  nexusLost: number
  objectivesStolen: number
  objectivesStolenAssists: number
  participantId: number
  pentaKills: number
  perks: Perks
  physicalDamageDealt: number
  physicalDamageDealtToChampions: number
  physicalDamageTaken: number
  profileIcon: number
  puuid: string
  quadraKills: number
  riotIdName: string
  riotIdTagline: string
  role: string
  sightWardsBoughtInGame: number
  spell1Casts: number
  spell2Casts: number
  spell3Casts: number
  spell4Casts: number
  summoner1Casts: number
  summoner1Id: number
  summoner2Casts: number
  summoner2Id: number
  summonerId: string
  summonerLevel: number
  summonerName: string
  teamEarlySurrendered: false
  teamId: 100 | 200
  /**
   * Both individualPosition and teamPosition are computed by the game server and are different versions of the most likely position played by a player.
   * The individualPosition is the best guess for which position the player actually played in isolation of anything else.
   * The teamPosition is the best guess for which position the player actually played if we add the constraint that each team must have one top player one jungle one middle etc.
   * Generally the recommendation is to use the teamPosition field over the individualPosition field.
  */
  teamPosition: string
  timeCCingOthers: number
  timePlayed: number
  totalDamageDealt: number
  totalDamageDealtToChampions: number
  totalDamageShieldedOnTeammates: number
  totalDamageTaken: number
  totalHeal: number
  totalHealsOnTeammates: number
  totalMinionsKilled: number
  totalTimeCCDealt: number
  totalTimeSpentDead: number
  totalUnitsHealed: number
  tripleKills: number
  trueDamageDealt: number
  trueDamageDealtToChampions: number
  trueDamageTaken: number
  turretKills: number
  turretTakedowns: number
  turretsLost: number
  unrealKills: number
  visionScore: number
  visionWardsBoughtInGame: number
  wardsKilled: number
  wardsPlaced: number
  win: boolean
}

export interface Perks {
  statPerks: {
    defense: number
    flex: number
    offense: number
  }
  styles: Array<PerkStyle>
}

export interface PerkStyle {
  description: "primaryStyle" | "subStyle"
  style: number
  selections: Array<PerkStyleSelection>
}

export interface PerkStyleSelection {
  perk: number
  var1: number
  var2: number
  var3: number
}

export interface Team {
  bans: Array<Ban>
  objectives: {
    baron: Objective
    champion: Objective
    dragon: Objective
    inhibitor: Objective
    riftHerald: Objective
    tower: Objective
  }
  teamId: 100 | 200
  win: boolean
}

export interface Ban {
  championId: number
  pickTurn: number
}

export interface Objective {
  first: boolean
  kills: number
}
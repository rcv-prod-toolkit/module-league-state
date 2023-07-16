import type { PluginContext } from '@rcv-prod-toolkit/types'
import { AllGameData, Player, Event } from '../types/AllGameData'
import { InGameState as InGameStateType, showInhibitors, showLeaderBoard } from '../types/InGameState'
import { EventType, InGameEvent, MobType, TeamType } from '../types/InGameEvent'
import { randomUUID } from 'crypto'
import { FarsightData } from '../types/FarsightData'
import { Player as PlayerClass } from '../entities/Player'
import { LeagueState } from '../LeagueState'
import { Team } from '../entities/Team'

export class InGameState {
  public gameState: InGameStateType = {
    gameTime: 0,
    showPlatings: false,
    showLeaderBoard: showLeaderBoard.NONE,
    showInhibitors: showInhibitors.NONE,
    teams: {
      blue: new Team(),
      red: new Team()
    },
    player: [],
    goldGraph: {},
  }

  public lastGameData?: AllGameData
  public lastFarsightData?: FarsightData

  public actions: Map<string, (allGameData: AllGameData, id: string) => void> =
    new Map()

  constructor(
    private namespace: string,
    private ctx: PluginContext,
    private state: LeagueState,
    private statics: any
  ) {
    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'update',
        version: 1
      },
      state: this.convertGameState()
    })

    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'pp-update',
        version: 1
      },
      type: 'Baron',
      ongoing: false,
      percent: 0,
      respawnIn: 0
    })

    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'pp-update',
        version: 1
      },
      type: 'Dragon',
      ongoing: false,
      percent: 0,
      respawnIn: 0
    })
  }

  private convertGameState() {
    return {
      ...this.gameState,
      gameTime: this.gameState.gameTime,
      player: Object.values(this.gameState.player).map((p) => {
        return {
          ...p,
          items: [...p.items.values()]
        }
      })
    }
  }

  public handelData(allGameData: AllGameData): void {
    if (this.lastGameData !== undefined) {
      let previousGameData = this.lastGameData

      if (allGameData.gameData.gameTime < previousGameData.gameData.gameTime) {
        this.lastGameData = allGameData
        return
      }

      this.gameState.gameTime = allGameData.gameData.gameTime

      this.checkPlayerUpdate(allGameData)
      this.checkEventUpdate(allGameData, previousGameData)

      for (const [id, func] of this.actions.entries()) {
        func(allGameData, id)
      }
    } else {
      allGameData.allPlayers.forEach((p) => {
        const champ = this.statics.champions.find((c: any) => c.name === p.championName)

        const player = new PlayerClass(
          p.summonerName,
          p.team,
          p.championName,
          champ.id,
          champ.key
        )

        const member = this.state.lcu.lobby.find(
          (m: any) => m.summonerName === p.summonerName
        )
        if (member !== undefined) {
          player.nickname = member.nickname
        }

        this.gameState.player.push(player)
      })
    }

    this.lastGameData = allGameData
  }

  public handelFarsightData(farsightData: FarsightData): void {
    if (farsightData.champions === undefined || !Array.isArray(farsightData.champions) || farsightData.champions.length <= 0) return

    if (this.lastFarsightData !== undefined) {
      let previousFarsightData = this.lastFarsightData

      if (farsightData.gameTime < previousFarsightData?.gameTime) {
        this.lastFarsightData = farsightData
        return
      }
    }

    this.lastFarsightData = farsightData

    let gold100 = 0
    let gold200 = 0

    const champions = farsightData.champions.filter((c, i, a) => {
      return a.findIndex(ci => ci.displayName === c.displayName) === i
    })

    for (const champion of champions) {
      const playerIndex = this.gameState.player.findIndex(p => {
        p.summonerName === champion.displayName
      })

      if (playerIndex === -1) continue

      this.gameState.player[playerIndex].level = champion.level
      this.gameState.player[playerIndex].experience = champion.experience
      this.gameState.player[playerIndex].currentGold = champion.currentGold
      this.gameState.player[playerIndex].totalGold = champion.totalGold

      if (champion.team === 100) {
        gold100 += champion.totalGold
      } else if (champion.team === 200) {
        gold200 += champion.totalGold
      }
    }

    this.gameState.goldGraph[Math.round(farsightData.gameTime)] = gold100 - gold200
    this.gameState.teams.blue.gold = gold100
    this.gameState.teams.red.gold = gold200

    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'update',
        version: 1
      },
      state: this.convertGameState()
    })
  }

  public handelEvent(event: InGameEvent): void {
    if (!Object.values(EventType).includes(event.eventname)) return
    if (event.eventname === EventType.StructureKill) return

    const team = event.sourceTeam === TeamType.Order ? 'blue' : 'red'
    const time = this.lastGameData?.gameData.gameTime ?? 0

    this.gameState.teams[team].objectives.push({
      type: event.eventname,
      mob: event.other as MobType,
      time
    })

    if (event.eventname === EventType.TurretPlateDestroyed) {
      const split = event.other.split('_') as string[]
      const lane = split[2] as 'L' | 'C' | 'R'
      this.gameState.teams[team].platings[lane] += 1

      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'platings-update',
          version: 1
        },
        platings: {
          100: this.gameState.teams.blue.platings,
          200: this.gameState.teams.red.platings
        }
      })

      return
    } else if (
      event.eventname === EventType.DragonKill
    ) {
      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'event',
          version: 1
        },
        name: 'Dragon',
        type: this.convertDragon(event.other),
        team,
        time
      })
    } else if (
      event.eventname === EventType.BaronKill
    ) {
      this.baronKill(event)
    } else if (
      event.eventname === EventType.HeraldKill
    ) {
      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'event',
          version: 1
        },
        name: 'Herald',
        type: 'Herald',
        team,
        time
      })
    }
  }

  private convertDragon(dragon: MobType): string {
    switch (dragon) {
      case MobType.HextechDragon:
        return 'Hextech'
      case MobType.ChemtechDragon:
        return 'Chemtech'
      case MobType.CloudDragon:
        return 'Cloud'
      case MobType.ElderDragon:
        return 'Elder'
      case MobType.InfernalDragon:
        return 'Infernal'
      case MobType.MountainDragon:
        return 'Mountain'
      case MobType.OceanDragon:
        return 'Ocean'
      default:
        return 'Air'
    }
  }

  private baronKill(event: InGameEvent): void {
    if (this.lastGameData === undefined) return

    const previousGameData = this.lastGameData

    const team = event.sourceTeam === TeamType.Order ? 100 : 200
    const time = Math.round(previousGameData.gameData.gameTime || 0)
    const type = 'Baron'

    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'event',
        version: 1
      },
      name: 'Baron',
      type,
      team,
      time
    })

    const respawnAt = time + 60 * 3

    const data = {
      time,
      ongoing: true,
      goldDiff: 1500,
      goldBaseBlue: this.gameState.teams.blue.gold,
      goldBaseRed: this.gameState.teams.red.gold,
      alive: previousGameData.allPlayers
        .filter(
          (p) =>
            !p.isDead &&
            (team === 100 ? p.team === 'ORDER' : p.team === 'CHAOS')
        )
        .map((p) => p.summonerName),
      dead: previousGameData.allPlayers
        .filter(
          (p) =>
            p.isDead && (team === 100 ? p.team === 'ORDER' : p.team === 'CHAOS')
        )
        .map((p) => p.summonerName),
      team,
      respawnAt: respawnAt,
      respawnIn: 60 * 3,
      percent: 100
    }

    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'pp-update',
        version: 1
      },
      type,
      team,
      alive: data.alive,
      goldDiff: data.goldDiff,
      ongoing: data.ongoing,
      percent: data.percent,
      respawnIn: data.respawnIn,
      respawnAt: data.respawnAt
    })

    this.actions.set(type + '-' + randomUUID(), (allGameData, i) => {
      const gameState = allGameData.gameData
      const diff = respawnAt - Math.round(gameState.gameTime)
      const percent = Math.round((diff * 100) / (60 * 3))

      const goldDifBlue = this.gameState.teams.blue.gold - data.goldBaseBlue
      const goldDifRed = this.gameState.teams.red.gold - data.goldBaseRed

      const goldDiff = team === 100 ? 1500 + goldDifBlue - goldDifRed : 1500 + goldDifRed - goldDifBlue

      data.alive = allGameData.allPlayers
        .filter(
          (p) =>
            !p.isDead &&
            (team === 100 ? p.team === 'ORDER' : p.team === 'CHAOS') &&
            !data.dead.includes(p.summonerName)
        )
        .map((p) => p.summonerName)
      data.dead = [
        ...data.dead,
        ...allGameData.allPlayers
          .filter(
            (p) =>
              p.isDead &&
              (team === 100 ? p.team === 'ORDER' : p.team === 'CHAOS')
          )
          .map((p) => p.summonerName)
      ]

      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'pp-update',
          version: 1
        },
        type,
        team,
        alive: data.alive,
        goldDiff,
        ongoing: data.ongoing,
        percent,
        respawnIn: diff
      })

      if (
        diff <= 0 ||
        data.alive.length <= 0 ||
        time > gameState.gameTime
      ) {
        data.ongoing = false
        this.ctx.LPTE.emit({
          meta: {
            namespace: this.namespace,
            type: 'pp-update',
            version: 1
          },
          type,
          team,
          alive: data.alive,
          goldDiff,
          ongoing: data.ongoing,
          percent: 100,
          respawnIn: 60 * 3
        })

        this.actions.delete(i)
      }
    })
  }

  private checkPlayerUpdate(allGameData: AllGameData) {
    if (this.lastGameData === undefined) return

    this.gameState.teams.blue.kills = allGameData.allPlayers.filter(p => p.team === "ORDER").reduce((v, c) => v + c.scores.kills, 0)
    this.gameState.teams.red.kills = allGameData.allPlayers.filter(p => p.team === "CHAOS").reduce((v, c) => v + c.scores.kills, 0)

    allGameData.allPlayers.forEach((player, i) => {
      this.checkNameUpdate(player, i)
      this.checkLevelUpdate(player, i)
      this.checkItemUpdate(player, i)
    })
  }

  private checkNameUpdate(currentPlayerState: Player, id: number) {
    if (this.gameState.player[id] === undefined) return

    const member = this.state.lcu.lobby?.members?.find(
      (m: any) => m.summonerName === currentPlayerState.summonerName
    )

    if (member === undefined) return

    this.gameState.player[id].nickname = member.nickname

    this.ctx.LPTE.emit({
      meta: {
        type: 'name-update',
        namespace: this.namespace,
        version: 1
      },
      team: currentPlayerState.team === 'ORDER' ? 100 : 200,
      player: id,
      nickname: member.nickname
    })
  }

  private checkLevelUpdate(currentPlayerState: Player, id: number) {
    if (this.gameState.player[id] === undefined || currentPlayerState.level <= this.gameState.player[id]?.level) return

    this.gameState.player[id].level = currentPlayerState.level

    this.ctx.LPTE.emit({
      meta: {
        type: 'level-update',
        namespace: this.namespace,
        version: 1
      },
      team: currentPlayerState.team === 'ORDER' ? 100 : 200,
      player: id,
      level: currentPlayerState.level
    })
  }

  private checkItemUpdate(currentPlayerState: Player, id: number) {
    if (this.gameState.player[id] === undefined) return

    const previousItems = this.gameState.player[id].items

    for (const item of previousItems.keys()) {
      const found = currentPlayerState.items.find(i => {
        i.itemID === item
      })

      if (found !== undefined) continue

      this.gameState.player[id].items.delete(item)
    }

    for (const item of currentPlayerState.items) {
      const itemID = item.itemID
      if (previousItems.has(itemID)) continue

      const itemBinFind = this.statics.itemBin.find(
        (i: any) => i.itemID === itemID
      )
      if (itemBinFind === undefined) continue

      this.gameState.player[id].items.set(itemID, item.count)

      if (itemID === 3513) {
        this.handelEvent({
          eventname: EventType.HeraldKill,
          other: MobType.Herald,
          otherTeam: TeamType.Neutral,
          source: currentPlayerState.summonerName,
          sourceID: id,
          sourceTeam:
            currentPlayerState.team === 'CHAOS'
              ? TeamType.Chaos
              : TeamType.Order
        })
        return
      }

      this.ctx.LPTE.emit({
        meta: {
          type: 'item-update',
          namespace: this.namespace,
          version: 1
        },
        team: currentPlayerState.team === 'ORDER' ? 100 : 200,
        player: id,
        item: itemID
      })
    }
  }

  private checkEventUpdate(
    allGameData: AllGameData,
    previousGameData: AllGameData
  ) {
    if (allGameData.events.Events.length === 0) return

    const newEvents = allGameData.events.Events.slice(
      previousGameData.events.Events.length || 0
    )

    newEvents.forEach((event) => {
      if (event.EventName === 'InhibKilled') {
        this.handleInhibEvent(event, allGameData)
      } else if (event.EventName === 'TurretKilled') {
        this.handleTowerEvent(event, allGameData)
      } else if (event.EventName === 'ChampionKill') {
        this.handleKillEvent(event, allGameData)
      }
    })
  }

  private handleInhibEvent(event: Event, allGameData: AllGameData) {
    const split = event.InhibKilled.split('_') as string[]
    const team = split[1] === 'T1' ? 'red' : 'blue'
    const lane = split[2] as 'L1' | 'C1' | 'R1'
    const respawnAt = Math.round(event.EventTime) + 60 * 5
    const time = event.EventTime

    if (!this.gameState.teams[team].inhibitors[lane].alive) return

    this.gameState.teams[team].inhibitors[lane] = {
      alive: false,
      respawnAt: respawnAt,
      respawnIn: 60 * 5,
      percent: 100,
      time
    }

    this.actions.set(event.InhibKilled, (allGameData, i) => {
      const gameState = allGameData.gameData
      const diff = respawnAt - Math.round(gameState.gameTime)
      const percent = Math.round((diff * 100) / (60 * 5))

      this.gameState.teams[team].inhibitors[lane] = {
        alive: false,
        respawnAt: respawnAt,
        respawnIn: diff,
        percent: 100,
        time: this.gameState.teams[team].inhibitors[lane].time
      }

      this.ctx.LPTE.emit({
        meta: {
          namespace: this.namespace,
          type: 'inhib-update',
          version: 1
        },
        team,
        lane,
        percent,
        respawnIn: diff
      })

      if (diff <= 0 || time > gameState.gameTime) {
        this.gameState.teams[team].inhibitors[lane] = {
          alive: true,
          respawnAt: 0,
          respawnIn: 0,
          percent: 0,
          time: 0
        }

        this.actions.delete(i)
      }
    })

    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'kill-update',
        version: 1
      },
      assists: event.Assisters.map((a: string) => {
        return allGameData.allPlayers
          .find((p) => {
            return p.summonerName === a
          })
          ?.rawChampionName.split('_')[3]
      }),
      other: 'Inhib',
      source: event.KillerName.startsWith('Minion')
        ? 'Minion'
        : event.KillerName.startsWith('SRU_Herald')
          ? 'Herald'
          : // TODO Thats for all other creeps for now until we have some better icons for them
          event.KillerName.startsWith('SRU')
            ? 'Minion'
            : allGameData.allPlayers
              .find((p) => {
                return p.summonerName === event.KillerName
              })
              ?.rawChampionName.split('_')[3],
      team: team === 'blue' ? 200 : 100
    })
  }

  private handleTowerEvent(event: Event, allGameData: AllGameData) {
    if (event.TurretKilled === 'Obelisk') return

    const split = event.TurretKilled.split('_') as string[]
    const team = split[1] === 'T1' ? 'blue' : 'red'
    const lane = split[2] as 'L' | 'C' | 'R'
    const turret = split[3]

    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'kill-update',
        version: 1
      },
      assists: event.Assisters.map((a: string) => {
        return allGameData.allPlayers
          .find((p) => {
            return p.summonerName === a
          })
          ?.rawChampionName.split('_')[3]
      }),
      other: 'Turret',
      source: event.KillerName.startsWith('Minion')
        ? 'Minion'
        : event.KillerName.startsWith('SRU_Herald')
          ? 'Herald'
          : // TODO Thats for all other creeps for now until we have some better icons for them
          event.KillerName.startsWith('SRU')
            ? 'Minion'
            : allGameData.allPlayers
              .find((p) => {
                return p.summonerName === event.KillerName
              })
              ?.rawChampionName.split('_')[3],
      team: team === 'blue' ? 200 : 100
    })

    if (this.gameState.teams[team].towers[lane][turret] === false) return

    this.gameState.teams[team].towers[lane][turret] = false

    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'tower-update',
        version: 1
      },
      team,
      lane,
      turret
    })
  }

  private handleKillEvent(event: Event, allGameData: AllGameData) {
    this.ctx.LPTE.emit({
      meta: {
        namespace: this.namespace,
        type: 'kill-update',
        version: 1
      },
      assists: event.Assisters.map((a: string) => {
        return allGameData.allPlayers
          .find((p) => {
            return p.summonerName === a
          })
          ?.rawChampionName.split('_')[3]
      }),
      other: allGameData.allPlayers
        .find((p) => {
          return p.summonerName === event.VictimName
        })
        ?.rawChampionName.split('_')[3],
      source: event.KillerName.startsWith('Minion')
        ? 'Minion'
        : event.KillerName.startsWith('Turret')
          ? 'Turret'
          : event.KillerName.startsWith('SRU_Baron')
            ? 'Baron'
            : event.KillerName.startsWith('SRU_Herald')
              ? 'Herald'
              : event.KillerName.startsWith('SRU_Dragon')
                ? 'Dragon'
                : // TODO Thats for all other creeps for now until we have some better icons for them
                event.KillerName.startsWith('SRU')
                  ? 'Minion'
                  : allGameData.allPlayers
                    .find((p) => {
                      return p.summonerName === event.KillerName
                    })
                    ?.rawChampionName.split('_')[3],
      team:
        allGameData.allPlayers.find((p) => {
          return p.summonerName === event.VictimName
        })?.team === 'CHAOS'
          ? 100
          : 200
    })
  }
}

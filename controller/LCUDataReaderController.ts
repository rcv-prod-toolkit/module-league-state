import { LPTEvent, PluginContext } from '@rcv-prod-toolkit/types'
import { Controller } from './Controller'
import { state } from '../LeagueState'
import { ConvertedState, convertState } from '../champselect/convertState'
import { leagueStatic } from '../plugin'
import { EOG } from '../types/lcu-post-game-stats'

export enum PickBanPhase {
  GAME_STARTING = 'GAME_STARTING',
  FINALIZATION = 'FINALIZATION'
}

export class LCUDataReaderController extends Controller {
  leagueStatic: any
  refreshTask?: NodeJS.Timeout
  replayIsPlaying = false
  replayPlayer: NodeJS.Timeout[] = []

  recording: ConvertedState[] = []

  constructor(pluginContext: PluginContext, public recordChampselect: boolean) {
    super(pluginContext)

    this.emitChampSelectUpdate = this.emitChampSelectUpdate.bind(this)
  }

  emitChampSelectUpdate(): void {
    this.pluginContext.LPTE.emit({
      meta: {
        namespace: this.pluginContext.plugin.module.getName(),
        type: 'champselect-update',
        version: 1
      },
      data: {
        ...convertState(state, state.lcu.champselect as any, leagueStatic),
        showSummoners: state.lcu.champselect.showSummoners
      },
      order:
        state.lcu.champselect.order !== undefined
          ? {
            ...convertState(
              state,
              state.lcu.champselect.order as any,
              leagueStatic
            )
          }
          : undefined,
      isActive: state.lcu.champselect._available
    })
  }

  emitLobbyUpdate(): void {
    this.pluginContext.LPTE.emit({
      meta: {
        namespace: this.pluginContext.plugin.module.getName(),
        type: 'lobby-update',
        version: 1
      },
      data: state.lcu.lobby
    })
  }

  replayChampselect(): void {
    if (this.recording.length <= 0) return

    this.replayIsPlaying = true
    for (let i = 0; i < this.recording.length; i++) {
      const event = this.recording[i]

      this.replayPlayer.push(
        setTimeout(() => {
          this.pluginContext.LPTE.emit({
            meta: {
              namespace: this.pluginContext.plugin.module.getName(),
              type: 'champselect-update',
              version: 1
            },
            data: {
              ...event,
              showSummoners:
                event.phase !== PickBanPhase.GAME_STARTING &&
                event.phase === PickBanPhase.GAME_STARTING
            },
            isActive: i >= this.recording.length
          })

          if (this.refreshTask) {
            clearInterval(this.refreshTask)
            this.refreshTask = undefined
          }
          this.refreshTask = setInterval(() => {
            if (event.timer > 0) {
              event.timer -= 1
            }

            this.pluginContext.LPTE.emit({
              meta: {
                namespace: this.pluginContext.plugin.module.getName(),
                type: 'champselect-update',
                version: 1
              },
              data: {
                ...event
              },
              isActive: i >= this.recording.length
            })
          }, 1000)

          if (i >= this.recording.length - 1) {
            this.replayIsPlaying = false
            if (this.refreshTask) {
              clearInterval(this.refreshTask)
              this.refreshTask = undefined
            }
          }
        }, event.timeAfterStart)
      )
    }
  }

  stopReplay(): void {
    this.replayIsPlaying = false
    if (this.refreshTask) clearInterval(this.refreshTask)
    this.refreshTask = undefined

    this.replayPlayer.forEach((r) => {
      clearTimeout(r)
    })
  }

  addOrUpdatePlayer(player: any): any {
    if (player.isSpectator) return

    const teamId = state.lcu.lobby.gameConfig.customTeam100.findIndex((p: any) => p.puuid === player.puuid) >= 0 ? 100 : 200
    const team = teamId === 100 ? state.lcu.lobby.gameConfig.customTeam100 : state.lcu.lobby.gameConfig.customTeam200
    const i = team.findIndex((p: any) => p.puuid === player.puuid)

    const member = state.lcu.lobby.members.find((m: any) =>
      m && m.puuid === player.puuid
    )

    const lcuPosition =
      teamId === 100
        ? i
        : i + state.lcu.lobby.gameConfig.customTeam100.length

    if (state.lcu.lobby.playerOrder.has(player.summonerName)) {
      if (i !== state.lcu.lobby.playerOrder.get(player.summonerName)[2]) {
        state.lcu.lobby.playerOrder.get(player.summonerName)[1] = i
        state.lcu.lobby.playerOrder.get(player.summonerName)[2] = i

        return {
          nickname: member?.nickname ?? player.summonerName,
          ...player,
          lcuPosition,
          sortedPosition: i,
          elo: team[i].elo,
          teamId
        }
      } else {
        return {
          nickname: member?.nickname ?? player.summonerName,
          ...player,
          lcuPosition,
          sortedPosition: state.lcu.lobby.playerOrder.get(
            player.summonerName
          )[2],
          elo: team[i].elo,
          teamId
        }
      }
    } else {
      state.lcu.lobby.playerOrder.set(player.summonerName, [
        teamId,
        lcuPosition,
        lcuPosition
      ])

      return {
        nickname: player.summonerName,
        ...player,
        lcuPosition,
        sortedPosition: lcuPosition,
        elo: team[i].elo,
        teamId
      }
    }
  }

  async handle(event: LPTEvent): Promise<void> {
    // Lobby
    if (event.meta.type === 'lcu-lobby-create') {
      state.lcu.lobby = { ...state.lcu.lobby, ...event.data }
      state.lcu.lobby._available = true
      state.lcu.lobby._created = new Date()
      state.lcu.lobby._updated = new Date()

      state.lcu.lobby.playerOrder = new Map() as Map<
        string,
        [100 | 200, number, number]
      >

      state.lcu.lobby.members = (event.data.members as Array<any>)
        .map((player: any) => {
          return this.addOrUpdatePlayer(player)
        })
        .sort((a, b) => {
          return a.sortedPosition < b.sortedPosition
            ? -1
            : a.sortedPosition > b.sortedPosition
              ? 1
              : 0
        })

      this.pluginContext.log.info('Flow: lobby - active')
      this.emitLobbyUpdate()
    }
    if (event.meta.type === 'lcu-lobby-update') {
      state.lcu.lobby = Object.assign(state.lcu.lobby, event.data, { members: state.lcu.lobby.members })
      state.lcu.lobby._available = true
      state.lcu.lobby._updated = new Date()

      if (state.lcu.lobby.playerOrder === undefined) {
        state.lcu.lobby.playerOrder = new Map() as Map<
          string,
          [100 | 200, number, number]
        >
      }

      const members = (event.data.members as any[])
        .map((player: any) => {
          return this.addOrUpdatePlayer(player)
        })
        .sort((a, b) => {
          return a.sortedPosition < b.sortedPosition
            ? -1
            : a.sortedPosition > b.sortedPosition
              ? 1
              : 0
        })

      state.lcu.lobby.members = members

      this.emitLobbyUpdate()
    }
    if (event.meta.type === 'lcu-lobby-delete') {
      state.lcu.lobby._available = false
      state.lcu.lobby._deleted = new Date()
      state.lcu.lobby.playerOrder = new Map() as Map<
        string,
        [100 | 200, number, number]
      >

      this.pluginContext.log.info('Flow: lobby - inactive')
      this.emitLobbyUpdate()
    }

    // Champ select
    if (event.meta.type === 'lcu-champ-select-create') {
      state.lcu.champselect = { ...state.lcu.champselect, ...event.data }
      state.lcu.champselect._available = true
      state.lcu.champselect._created = new Date()
      state.lcu.champselect._updated = new Date()
      this.recording = []

      if (!this.refreshTask) {
        this.refreshTask = setInterval(this.emitChampSelectUpdate, 500)
      }

      if (this.recordChampselect) {
        this.recording.push(
          convertState(state, state.lcu.champselect as any, leagueStatic)
        )
      }

      if (!this.replayIsPlaying) {
        this.emitChampSelectUpdate()
      }

      this.pluginContext.log.info('Flow: champselect - active')
    }
    if (event.meta.type === 'lcu-champ-select-update') {
      if (
        event.data.timer.phase !== PickBanPhase.GAME_STARTING &&
        state.lcu.champselect.showSummoners
      ) {
        state.lcu.champselect.showSummoners = false
        this.pluginContext.log.info(
          'Flow: champselect - reset summoners to not show'
        )
      }

      if (!state.lcu.champselect._available) {
        state.lcu.champselect._available = true
        state.lcu.champselect._created = new Date()
        state.lcu.champselect._updated = new Date()
        this.recording = []
      }

      // Only trigger if event changes, to only load game once
      if (
        state.lcu.champselect &&
        state.lcu.champselect.timer &&
        state.lcu.champselect.timer.phase !== PickBanPhase.GAME_STARTING &&
        event.data.timer.phase === PickBanPhase.GAME_STARTING
      ) {
        this.pluginContext.log.info(
          'Flow: champselect - game started (spectator delay)'
        )
        state.lcu.champselect.showSummoners = true

        // Continue in flow
        this.pluginContext.LPTE.emit({
          meta: {
            namespace: this.pluginContext.plugin.module.getName(),
            type: 'set-game',
            version: 1
          },
          by: 'summonerName',
          summonerName: state.lcu.lobby.members?.[0].summonerName
        })
      }

      // Only trigger if we're now in finalization, save order
      if (
        state.lcu.champselect &&
        state.lcu.champselect.timer &&
        state.lcu.champselect.timer.phase !== PickBanPhase.FINALIZATION &&
        event.data.timer.phase === PickBanPhase.FINALIZATION
      ) {
        state.lcu.champselect.order = event.data
      }

      let summonerState = state.lcu.champselect.showSummoners
      state.lcu.champselect = { ...state.lcu.champselect, ...event.data }
      state.lcu.champselect.showSummoners = summonerState
      state.lcu.champselect._available = true
      state.lcu.champselect._updated = new Date()

      if (!this.refreshTask) {
        this.refreshTask = setInterval(this.emitChampSelectUpdate, 500)
      }

      if (this.recordChampselect) {
        this.recording.push(
          convertState(state, state.lcu.champselect as any, leagueStatic)
        )
      }

      if (!this.replayIsPlaying) {
        this.emitChampSelectUpdate()
      }
    }
    if (event.meta.type === 'lcu-champ-select-delete') {
      state.lcu.champselect._available = false
      state.lcu.champselect._deleted = new Date()

      if (this.refreshTask) {
        clearInterval(this.refreshTask)
        this.refreshTask = undefined
      }

      if (this.recordChampselect) {
        this.recording.push(
          convertState(state, state.lcu.champselect as any, leagueStatic)
        )
      }

      if (!this.replayIsPlaying) {
        this.emitChampSelectUpdate()
      }

      this.pluginContext.log.info('Flow: champselect - inactive')
    }

    // End of game
    if (event.meta.type === 'lcu-end-of-game-create') {
      state.lcu.eog = event.data
      state.lcu.eog._available = true

      // Also make sure post game is loaded
      this.pluginContext.LPTE.emit({
        meta: {
          namespace: this.pluginContext.plugin.module.getName(),
          type: 'set-game',
          version: 1
        },
        by: 'gameId',
        gameId: (event.data as EOG).gameId
      })
    }
    if (event.meta.type === 'lcu-end-of-game-update') {
      state.lcu.eog = event.data
      state.lcu.eog._available = true

      this.pluginContext.log.info('Flow: end of game - active')
      // Also make sure post game is loaded
      this.pluginContext.LPTE.emit({
        meta: {
          namespace: this.pluginContext.plugin.module.getName(),
          type: 'set-game',
          version: 1
        },
        by: 'gameId',
        gameId: (event.data as EOG).gameId
      })
    }
    if (event.meta.type === 'lcu-end-of-game-delete') {
      state.lcu.eog._available = false
    }
  }
}

import { LPTEvent, PluginContext } from '@rcv-prod-toolkit/types'
import { Controller } from './Controller'
import { state } from '../LeagueState'
import { ConvertedState, convertState } from '../champselect/convertState'
import { leagueStatic } from '../plugin'

export enum PickBanPhase {
  GAME_STARTING = 'GAME_STARTING',
  FINALIZATION = 'FINALIZATION'
}

export class LCUDataReaderController extends Controller {
  leagueStatic: any
  refreshTask?: NodeJS.Timeout
  recordChampselect = true
  replayIsPlaying = false

  recording: ConvertedState[] = []

  constructor(pluginContext: PluginContext) {
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
      data: [...(state.lcu.lobby.player as Map<string, any>).values()]
    })
  }

  replayChampselect(): void {
    if (this.recording.length <= 0) return

    this.replayIsPlaying = true
    for (let i = 0; i < this.recording.length; i++) {
      const event = this.recording[i]

      setTimeout(() => {
        if (!this.replayIsPlaying) return

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
    }
  }

  stopReplay(): void {
    this.replayIsPlaying = false
    if (this.refreshTask) clearInterval(this.refreshTask)
    this.refreshTask = undefined
  }

  async addOrUpdatePlayer(player: any, i: number): Promise<void> {
    if (state.lcu.lobby.player === undefined) {
      state.lcu.lobby.player = new Map<string, any>()
    }

    const server = 'euw1'.replace(/\d/g, '')

    ;(state.lcu.lobby.player as Map<string, any>).set(player.summonerName, {
      name: player.summonerName,
      elo: player.elo,
      level: player.summonerLevel,
      icon: player.summonerIconId,
      team: player.teamId,
      position: i,
      opgg: server
        ? `https://euw.op.gg/summoners/${server?.toLowerCase()}/${encodeURIComponent(
            player.summonerName
          )}`
        : ''
    })

    this.emitLobbyUpdate()
  }

  async handle(event: LPTEvent): Promise<void> {
    // Lobby
    if (event.meta.type === 'lcu-lobby-create') {
      state.lcu.lobby = { ...state.lcu.lobby, ...event.data }
      state.lcu.lobby._available = true
      state.lcu.lobby._created = new Date()
      state.lcu.lobby._updated = new Date()

      state.lcu.lobby.player = new Map<string, any>()

      if (event.data.gameConfig.customTeam100.length <= 0) {
        state.lcu.lobby.player?.forEach((v: any, k: string) => {
          if (v.team === 100) {
            state.lcu.lobby.player.delete(k)
          }
        })
      } else {
        ;(event.data.gameConfig.customTeam100 as Array<any>).forEach(
          (player: any, i) => {
            this.addOrUpdatePlayer(player, i)
          }
        )
      }

      if (event.data.gameConfig.customTeam200.length <= 0) {
        state.lcu.lobby.player?.forEach((v: any, k: string) => {
          if (v.team === 200) {
            state.lcu.lobby.player.delete(k)
          }
        })
      } else {
        ;(event.data.gameConfig.customTeam200 as Array<any>).forEach(
          (player: any, i) => {
            this.addOrUpdatePlayer(player, i)
          }
        )
      }

      this.pluginContext.log.info('Flow: lobby - active')
    }
    if (event.meta.type === 'lcu-lobby-update') {
      state.lcu.lobby = { ...state.lcu.lobby, ...event.data }
      state.lcu.lobby._available = true
      state.lcu.lobby._updated = new Date()

      if (event.data.gameConfig.customTeam100.length <= 0) {
        state.lcu.lobby.player?.forEach((v: any, k: string) => {
          if (v.team === 100) {
            state.lcu.lobby.player.delete(k)
          }
        })
      } else {
        ;(event.data.gameConfig.customTeam100 as Array<any>).forEach(
          (player: any, i) => {
            this.addOrUpdatePlayer(player, i)
          }
        )
      }
      if (event.data.gameConfig.customTeam200.length <= 0) {
        state.lcu.lobby.player?.forEach((v: any, k: string) => {
          if (v.team === 200) {
            state.lcu.lobby.player.delete(k)
          }
        })
      } else {
        ;(event.data.gameConfig.customTeam200 as Array<any>).forEach(
          (player: any, i) => {
            this.addOrUpdatePlayer(player, i)
          }
        )
      }
    }
    if (event.meta.type === 'lcu-lobby-delete') {
      state.lcu.lobby._available = false
      state.lcu.lobby._deleted = new Date()
      state.lcu.lobby.player = new Map<string, any>()

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
          summonerName: state.lcu.lobby.members[0].summonerName
        })
      } else {
        // this.pluginContext.log.info('Flow: champselect - reset summoners to now show')
        // state.lcu.champselect.showSummoners = false;
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

      this.pluginContext.log.info('Flow: end of game - active')
      // Also make sure post game is loaded
      this.pluginContext.LPTE.emit({
        meta: {
          namespace: this.pluginContext.plugin.module.getName(),
          type: 'set-game',
          version: 1
        },
        by: 'gameId'
      })
    }
    if (event.meta.type === 'lcu-end-of-game-delete') {
      state.lcu.eog._available = false
    }
  }
}

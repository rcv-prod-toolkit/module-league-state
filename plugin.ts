import type { PluginContext } from '@rcv-prod-toolkit/types'
import { RequestController } from './controller/RequestController'
import { SetGameController } from './controller/SetGameController'
import { UnsetGameController } from './controller/UnsetGameController'
import { LCUDataReaderController } from './controller/LCUDataReaderController'

export let leagueStatic: any

module.exports = async (ctx: PluginContext) => {
  const namespace = ctx.plugin.module.getName()
  // Register new UI page
  ctx.LPTE.emit({
    meta: {
      type: 'add-pages',
      namespace: 'ui',
      version: 1
    },
    pages: [
      {
        name: 'LoL: Game State',
        frontend: 'frontend',
        id: `op-${namespace}`
      }
    ]
  })

  const requestController = new RequestController(ctx)
  const setGameController = new SetGameController(ctx)
  const unsetGameController = new UnsetGameController(ctx)
  let lcuDataReaderController: LCUDataReaderController

  // Answer requests to get state
  ctx.LPTE.on(namespace, 'request', (e) => {
    requestController.handle(e)
  })

  // Set and unset game
  ctx.LPTE.on(namespace, 'set-game', async (e) => {
    setGameController.handle(e)
  })
  ctx.LPTE.on(namespace, 'unset-game', (e) => {
    unsetGameController.handle(e)
  })

  ctx.LPTE.on(namespace, 'record-champselect', (e) => {
    lcuDataReaderController.recordChampselect = e.recordingEnabled
  })
  ctx.LPTE.on(namespace, 'reload-recording', (e) => {
    lcuDataReaderController.recording = e.data
  })
  ctx.LPTE.on(namespace, 'request-recording', (e) => {
    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply as string,
        namespace: 'reply',
        version: 1
      },
      data: lcuDataReaderController.recording
    })
  })
  ctx.LPTE.on(namespace, 'replay-champselect', (e) => {
    if (e.play) {
      lcuDataReaderController.replayChampselect()
    } else {
      lcuDataReaderController.stopReplay()
    }
  })
  ctx.LPTE.on(namespace, 'request-recoding-state', (e) => {
    ctx.LPTE.emit({
      meta: {
        type: e.meta.reply as string,
        namespace: 'reply',
        version: 1
      },
      recordingEnabled: lcuDataReaderController.recordChampselect,
      isPlaying: lcuDataReaderController.replayIsPlaying
    })
  })

  // Listen to external events
  // LCU
  ctx.LPTE.on('lcu', 'lcu-lobby-create', (e) => {
    lcuDataReaderController.handle(e)
  })
  ctx.LPTE.on('lcu', 'lcu-lobby-update', (e) => {
    lcuDataReaderController.handle(e)
  })
  ctx.LPTE.on('lcu', 'lcu-lobby-delete', (e) => {
    lcuDataReaderController.handle(e)
  })
  ctx.LPTE.on('lcu', 'lcu-champ-select-create', (e) => {
    lcuDataReaderController.handle(e)
  })
  ctx.LPTE.on('lcu', 'lcu-champ-select-update', (e) => {
    lcuDataReaderController.handle(e)
  })
  ctx.LPTE.on('lcu', 'lcu-champ-select-delete', (e) => {
    lcuDataReaderController.handle(e)
  })
  ctx.LPTE.on('lcu', 'lcu-end-of-game-create', (e) => {
    lcuDataReaderController.handle(e)
  })
  ctx.LPTE.on('lcu', 'lcu-end-of-game-update', (e) => {
    lcuDataReaderController.handle(e)
  })
  ctx.LPTE.on('lcu', 'lcu-end-of-game-delete', (e) => {
    lcuDataReaderController.handle(e)
  })

  // Emit event that we're ready to operate
  ctx.LPTE.emit({
    meta: {
      type: 'plugin-status-change',
      namespace: 'lpt',
      version: 1
    },
    status: 'RUNNING'
  })

  ctx.LPTE.on('module-league-static', 'static-loaded', async (e) => {
    leagueStatic = e.constants
    lcuDataReaderController = new LCUDataReaderController(ctx)
  })
}

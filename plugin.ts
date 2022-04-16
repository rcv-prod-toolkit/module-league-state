import type { PluginContext } from '@rcv-prod-toolkit/types'
import { RequestController } from './controller/RequestController';
import { SetGameController } from './controller/SetGameController';
import { UnsetGameController } from './controller/UnsetGameController';
import { LCUDataReaderController } from './controller/LCUDataReaderController';

export let leagueStatic: any;

module.exports = async (ctx: PluginContext) => {
  const namespace = ctx.plugin.module.getName();
  // Register new UI page
  ctx.LPTE.emit({
    meta: {
      type: 'add-pages',
      namespace: 'ui',
      version: 1
    },
    pages: [{
      name: 'LoL: Game State',
      frontend: 'frontend',
      id: `op-${namespace}`
    }]
  });

  const requestController = new RequestController(ctx)
  const setGameController = new SetGameController(ctx)
  const unsetGameController = new UnsetGameController(ctx)
  let lcuDataReaderController: LCUDataReaderController

  // Answer requests to get state
  ctx.LPTE.on(namespace, 'request', e => {
    requestController.handle(e)
  });

  // Set and unset game
  ctx.LPTE.on(namespace, 'set-game', async e => {
    setGameController.handle(e)
  });
  ctx.LPTE.on(namespace, 'unset-game', e => {
    unsetGameController.handle(e)
  });

  // Listen to external events
  // LCU
  ctx.LPTE.on('lcu', 'lcu-lobby-create', e => {
    lcuDataReaderController.handle(e)
  });
  ctx.LPTE.on('lcu', 'lcu-lobby-update', e => {
    lcuDataReaderController.handle(e)
  });
  ctx.LPTE.on('lcu', 'lcu-lobby-delete', e => {
    lcuDataReaderController.handle(e)
  });
  ctx.LPTE.on('lcu', 'lcu-champ-select-create', e => {
    lcuDataReaderController.handle(e)
  });
  ctx.LPTE.on('lcu', 'lcu-champ-select-update', e => {
    lcuDataReaderController.handle(e)
  });
  ctx.LPTE.on('lcu', 'lcu-champ-select-delete', e => {
    lcuDataReaderController.handle(e)
  });
  ctx.LPTE.on('lcu', 'lcu-end-of-game-create', e => {
    lcuDataReaderController.handle(e)
  });
  ctx.LPTE.on('lcu', 'lcu-end-of-game-update', e => {
    lcuDataReaderController.handle(e)
  });
  ctx.LPTE.on('lcu', 'lcu-end-of-game-delete', e => {
    lcuDataReaderController.handle(e)
  });

  // Emit event that we're ready to operate
  ctx.LPTE.emit({
    meta: {
      type: 'plugin-status-change',
      namespace: 'lpt',
      version: 1
    },
    status: 'RUNNING'
  });

  ctx.LPTE.on('module-league-static', 'static-loaded', async (e) => {  
    leagueStatic = e.constants
    lcuDataReaderController = new LCUDataReaderController(ctx)
  })
};

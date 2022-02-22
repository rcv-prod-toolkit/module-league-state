import { LPTEvent } from 'rcv-prod-toolkit-types'
import { Controller } from './Controller'

export class UnsetGameController extends Controller {
  async handle (event: LPTEvent): Promise<void> {
    this.pluginContext.LPTE.emit({
      meta: {
        namespace: 'reply',
        type: event.meta.reply as string,
        version: 1
      }
    });
  }
}
import { LPTEvent, PluginContext } from 'rcv-prod-toolkit-types';

export abstract class Controller {
  pluginContext: PluginContext

  constructor (pluginContext: PluginContext) {
    this.pluginContext = pluginContext
  }

  abstract handle (event: LPTEvent): Promise<void>
}
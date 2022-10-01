import { LPTEvent } from '@rcv-prod-toolkit/types'
import { Controller } from './Controller'
import { state } from '../LeagueState'
import { convertState } from '../champselect/convertState'
import { leagueStatic } from '../plugin'

export class RequestController extends Controller {
  async handle(event: LPTEvent): Promise<void> {
    this.pluginContext.LPTE.emit({
      meta: {
        type: event.meta.reply as string,
        namespace: 'reply',
        version: 1
      },
      state: {
        ...state,
        lcu: {
          ...state.lcu,
          lobby: state.lcu.lobby,
          champselect: {
            ...state.lcu.champselect,
            order:
              state.lcu.champselect.order !== undefined
                ? {
                    ...convertState(
                      state,
                      state.lcu.champselect.order as any,
                      leagueStatic
                    )
                  }
                : undefined
          }
        }
      }
    })
  }
}

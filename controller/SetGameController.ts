import { LPTEvent } from 'league-prod-toolkit/core/eventbus/LPTE'
import { Controller } from './Controller'
import { state } from '../LeagueState'
import extendLiveGameWithStatic from '../extendLiveGameWithStatic'

export class SetGameController extends Controller {
  async handle (event: LPTEvent): Promise<void> {
    const replyMeta = {
      namespace: 'reply',
      type: event.meta.reply as string,
      version: 1
    };

    if (event.by === 'summonerName') {
      // Load game using provider-webapi
      this.pluginContext.log.debug(`Loading livegame for summoner=${event.summonerName}`);

      const gameResponse = await this.pluginContext.LPTE.request({
        meta: {
          namespace: 'provider-webapi',
          type: 'fetch-livegame',
          version: 1
        },
        summonerName: event.summonerName,
        retries: 10
      }, 30000);

      if (!gameResponse) return

      if (!gameResponse || gameResponse.failed) {
        this.pluginContext.log.info(`Loading livegame failed for summoner=${event.summonerName}`);
        this.pluginContext.LPTE.emit({
          meta: replyMeta
        });
        return;
      }

      const staticData = await this.pluginContext.LPTE.request({
        meta: {
          namespace: 'static-league',
          type: 'request-constants',
          version: 1
        }
      });

      if (!staticData) return

      state.web.live = extendLiveGameWithStatic(gameResponse.game, staticData.constants);
      state.web.live._available = true
      state.web.live._created = new Date();
      state.web.live._updated = new Date();

      this.pluginContext.LPTE.emit({
        meta: {
          namespace: 'state-league',
          type: 'live-game-loaded',
          version: 1
        },
        state
      });

      this.pluginContext.LPTE.emit({
        meta: replyMeta,
        data: state.web.live
      });
    } else if (event.by === 'gameId') {
      if (!event.gameId) {
        event.gameId = state.web.live.gameId;
      }

      // Load game using provider-webapi
      this.pluginContext.log.debug(`Loading match for gameId=${event.gameId}`);
      const gameResponse = await this.pluginContext.LPTE.request({
        meta: {
          namespace: 'provider-webapi',
          type: 'fetch-match',
          version: 1
        },
        matchId: event.gameId
      });

      if (!gameResponse || gameResponse.failed) {
        this.pluginContext.log.info(`Loading livegame failed for gameId=${event.gameId}`);
        this.pluginContext.LPTE.emit({
          meta: replyMeta
        });
        return;
      }

      state.web.match = gameResponse.match;
      state.web.timeline = gameResponse.timeline;

      state.web.match._available = true
      state.web.match._created = new Date();
      state.web.match._updated = new Date();
      state.web.timeline._available = true
      state.web.timeline._created = new Date();
      state.web.timeline._updated = new Date();

      // Overwrite participants from names (this is because of a custom game limitation)
      /* if (state.web.live.participants !== undefined) {
        state.web.live.participants.forEach((participant: any, index: number) => {
          state.web.match.participants[index].summonerName = participant.summonerName;
        });
      } else {
        state.web.match.participantIdentities.forEach((participant: any, index: number) => {
          state.web.match.participants[index].summonerName = participant.player.summonerName;
        });
      } */

      this.pluginContext.LPTE.emit({
        meta: {
          namespace: 'state-league',
          type: 'match-game-loaded',
          version: 1
        },
        state
      });

      this.pluginContext.LPTE.emit({
        meta: replyMeta,
        data: state.web.match
      })
    }
  }
}
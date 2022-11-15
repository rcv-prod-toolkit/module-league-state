import { Server } from '../../Server'

export interface EntryRequest {
  server: Server
  /**
   * Encrypted summoner ID. Max length 63 characters.
   */
  encryptedSummonerId: string
}

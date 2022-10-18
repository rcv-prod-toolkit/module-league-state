import { Server } from '../../Server'

export interface ByAccount {
  /**
   * Encrypted account ID. Max length 56 characters.
  */
  encryptedAccountId: string
  server: Server
}

export interface ByName {
  /**
   * Summoner name.
  */
  name: string
  server: Server
}

export interface ByPUUID {
  /**
   * Encrypted PUUID. Exact length of 78 characters.
  */
  puuid: string
  server: Server
}

export interface BySummonerId {
  /**
   * Encrypted summoner ID. Max length 63 characters.
  */
  id: string
  server: Server
}

export interface ByMe {
  /**
   * Bearer token
  */
  Authorization: string
  server: Server
}
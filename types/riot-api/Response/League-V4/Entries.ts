import {Rank, Tier} from '../../Ranked'

export type Entries = Set<Entry>

export interface Entry {
  leagueId: string	
  /**
   * Player's encrypted summonerId.
  */
  summonerId: string
  summonerName: string
  queueType: string	
  tier: Tier
  /**
   * The player's division within a tier.
  */
  rank: Rank
  leaguePoints: number	
  /**
   * Winning team on Summoners Rift.
  */
  wins: number
  /**
   * Losing team on Summoners Rift.
  */
  losses: number
  hotStreak: boolean	
  veteran: boolean	
  freshBlood: boolean	
  inactive: boolean	
  miniSeries ? : MiniSeries
}

export interface MiniSeries {
  losses: number	
  progress: string	
  target: number	
  wins: number
}
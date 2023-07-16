import { PlayerType } from "../types/InGameState";

export class Player implements PlayerType {
  summonerName: string
  nickname: string = ''
  level: number = 0
  experience: number = 0
  currentGold: number = 0
  totalGold: number = 0
  items: Map<number, number> = new Map()
  championName: string
  championId: string
  championKey: number
  team: 100 | 200

  constructor(summonerName: string, team: 'ORDER' | 'CHAOS', championName: string, championId: string, championKey: number) {
    this.summonerName = summonerName
    this.championName = championName
    this.championId = championId
    this.championKey = championKey
    this.team = team === 'ORDER' ? 100 : 200
  }
}
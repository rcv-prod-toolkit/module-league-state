import { Inhibitor } from '../entities/Inhibitor'
import { EventType, MobType } from './InGameEvent'

export interface InGameState {
  gameTime: number
  showPlatings: boolean
  showLeaderBoard: showLeaderBoard
  showInhibitors: showInhibitors
  player: PlayerType[]
  teams: {
    blue: TeamState
    red: TeamState
  }
  goldGraph: {
    [t: number]: number
  }
}

export enum showInhibitors {
  NONE = 'none',
  BLUE = 'blue',
  RED = 'red',
  BOTH = 'both'
}

export enum showLeaderBoard {
  NONE = 'none',
  XP = 'xp',
  GOLD = 'gold'
}

export interface TeamState {
  objectives: Objective[]
  kills: number
  gold: number
  inhibitors: InhibitorState
  towers: TowerState
  platings: PlatingState
}

export interface PlayerType {
  summonerName: string
  nickname: string
  level: number
  experience: number
  currentGold: number
  totalGold: number
  items: Map<number, number>
  championName: string
  championId: string
  championKey: number
  team: 100 | 200
}

export interface Objective {
  type: EventType
  mob: MobType
  time: number
}

export interface TowerState {
  L: {
    [turret: string]: boolean
  }
  C: {
    [turret: string]: boolean
  }
  R: {
    [turret: string]: boolean
  }
}

export interface PlatingState {
  L: number
  C: number
  R: number
}

export interface InhibitorState {
  L1: Inhibitor
  C1: Inhibitor
  R1: Inhibitor
}

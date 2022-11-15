export type LeagueStateDataStructure = {
  _available: boolean
  [name: string]: any
}

export class LeagueStateWeb {
  live: LeagueStateDataStructure = {
    _available: false
  }
  match: LeagueStateDataStructure = {
    _available: false
  }
  timeline: LeagueStateDataStructure = {
    _available: false
  }
}

export class LeagueStateLCU {
  lobby: LeagueStateDataStructure = {
    _available: false
  }
  champselect: LeagueStateDataStructure = {
    _available: false
  }
  eog: LeagueStateDataStructure = {
    _available: false
  }
}

export class LeagueStateLive implements LeagueStateDataStructure {
  _available = false
  _created: Date | undefined
  _updated: Date | undefined
  objectives = {
    100: [],
    200: []
  }
}

export class LeagueState {
  web: LeagueStateWeb = new LeagueStateWeb()
  lcu: LeagueStateLCU = new LeagueStateLCU()
  live: LeagueStateLive = new LeagueStateLive()
}

export const state = new LeagueState()

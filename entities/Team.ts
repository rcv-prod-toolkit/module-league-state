import { InhibitorState, Objective, PlatingState, TeamState, TowerState } from "../types/InGameState";
import { Inhibitor } from "./Inhibitor";

export class Team implements TeamState {
  objectives: Objective[] = []
  kills: number = 0
  gold: number = 0
  inhibitors: InhibitorState = {
    L1: new Inhibitor(),
    C1: new Inhibitor(),
    R1: new Inhibitor()
  }
  towers: TowerState = {
    L: {},
    C: {},
    R: {}
  }
  platings: PlatingState = {
    L: 0,
    C: 0,
    R: 0
  }

  
}
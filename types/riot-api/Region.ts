import { Server } from './Server'

export enum Region {
  AMERICAS = "americas",
  ASIA = "asia",
  EUROPE = "europe"
}

export function getRegionByServer (server : Server) : Region {
  switch (server) {
    case Server.NA:
    case Server.BR:
    case Server.LAN:
    case Server.LAS:
    case Server.OCE:
      return Region.AMERICAS
    case Server.KR:
    case Server.JP:
      return Region.ASIA
    case Server.EUNE:
    case Server.EUW:
    case Server.TR:
    case Server.RU:
      return Region.EUROPE
    default:
      return Region.EUROPE
  } 
}

interface positionType {
   0: number;
   1: number;
   2: number;
}

interface championsItemType {
   name: string;
   displayName: string;
   networkId: number;
   objectIndex: number;
   position: positionType;
   team: number;
   isAlive: boolean;
   health: number;
   maxHealth: number;
   mana: number;
   maxMana: number;
   address: number;
   currentGold: number;
   totalGold: number;
   experience: number;
   level: number;
}

interface jungleItemType {
   name: string;
   displayName: string;
   networkId: number;
   objectIndex: number;
   position: positionType;
   team: number;
   isAlive: boolean;
   health: number;
   maxHealth: number;
   mana: number;
   maxMana: number;
   address: number;
}

interface displayNameType {
   type: string;
   data: Array<number>;
}

interface turretsItemType {
   name: string;
   displayName: displayNameType;
   networkId: number;
   objectIndex: number;
   position: positionType;
   team: number;
   isAlive: boolean;
   health: number;
   maxHealth: number;
   mana: number;
   maxMana: number;
   address: number;
}

interface inhibitorsItemType {
   name: string;
   displayName: displayNameType;
   networkId: number;
   objectIndex: number;
   position: positionType;
   team: number;
   isAlive: boolean;
   health: number;
   maxHealth: number;
   mana: number;
   maxMana: number;
   address: number;
}

interface otherItemType {
   name: string;
   displayName: string;
   networkId: number;
   objectIndex: number;
   position: positionType;
   team: number;
   isAlive: boolean;
   health: number;
   maxHealth: number;
   mana: number;
   maxMana: number;
   address: number;
}

interface benchmarkType {
   readObjectsMs: number;
   fullUpdateMs: number;
}

export interface FarsightData {
   champions: Array<championsItemType>;
   jungle: Array<jungleItemType>;
   turrets: Array<turretsItemType>;
   inhibitors: Array<inhibitorsItemType>;
   other: Array<otherItemType>;
   gameTime: number;
   nextDragonType: string;
   benchmark: benchmarkType;
}

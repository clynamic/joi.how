import { type IState } from '../../store'
import { type GameBoardAction } from './store'

export type ArrayElement<A> = A extends ReadonlyArray<infer T> ? T : never

export enum EStroke {
  up,
  down,
}

export enum EGrip {
  left,
  right,
  both,
  none,
}

export interface Credentials {
  login: string
  api_key: string
}

export type PornList = string[]

export type GameEvent<Args extends unknown[] = []> = (
  ...args: Args
) => (state: IState, dispatch: (action: ReturnType<GameBoardAction>) => void) => void | Promise<void>

export interface EventToken {
  id: string
  name: string
  description: string
}

export enum HypnoMode {
  Off,
  JOI,
  Breeding,
  Pet,
  FemDomPet,
}

export enum PlayerGender {
  Female,
  Male,
  Neutral,
}

export enum PlayerParts {
  Cock,
  Pussy,
  Neuter,
}

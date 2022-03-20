import { GameBoardAction } from './store'
import { IState } from '../../store'

export type ArrayElement<A> = A extends readonly (infer T)[] ? T : never

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

export type PornList = string[]

export type GameEvent<Args extends any[] = []> = (
  ...args: Args
) => (state: IState, dispatch: (action: ReturnType<GameBoardAction>) => void) => void | Promise<any>

export interface PropsForConnectedComponent {
  dispatch: (action: ReturnType<GameBoardAction>) => void
}

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

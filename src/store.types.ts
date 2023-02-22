import { IState, store } from './store'
import { Action } from 'redux'
import { ThunkAction } from 'redux-thunk'

export type Thunk<ReturnType = void> = ThunkAction<ReturnType, IState, unknown, Action<string>>

export interface PropsForConnectedComponent {
  dispatch: typeof store.dispatch
}

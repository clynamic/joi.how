import { type Action } from 'redux'
import { type ThunkAction } from 'redux-thunk'
import { type IState, type store } from './store'

export type Thunk<ReturnType = void> = ThunkAction<ReturnType, IState, unknown, Action<string>>

export interface PropsForConnectedComponent {
  dispatch: typeof store.dispatch
}

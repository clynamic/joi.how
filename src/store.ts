import { createStore, combineReducers, applyMiddleware, compose } from 'redux'
import thunk from 'redux-thunk'

import { GameBoardReducer } from './features/gameboard'
import { SettingsReducer, SettingsVibratorReducer } from './features/settings/store'

const reducers = {
  game: GameBoardReducer,
  settings: SettingsReducer,
  vibrator: SettingsVibratorReducer,
}

const reducer = combineReducers(reducers)

export type IState = { [K in keyof typeof reducers]: ReturnType<typeof reducers[K]> }

export const store = createStore(
  reducer,
  compose(applyMiddleware(thunk), (window as any).__REDUX_DEVTOOLS_EXTENSION__ ? (window as any).__REDUX_DEVTOOLS_EXTENSION__() : compose),
)

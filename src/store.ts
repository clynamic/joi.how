import { configureStore, combineReducers } from '@reduxjs/toolkit'

import { GameBoardReducer } from './features/gameboard'
import { SettingsReducer, VibratorReducer } from './features/settings/store'

const reducers = {
  game: GameBoardReducer,
  settings: SettingsReducer,
  vibrators: VibratorReducer,
}

const reducer = combineReducers(reducers)

export type IState = { [K in keyof typeof reducers]: ReturnType<typeof reducers[K]> }

export const store = configureStore({
  reducer: reducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({ serializableCheck: false }),
  // devTools: true,
})

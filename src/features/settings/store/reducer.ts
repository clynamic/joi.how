import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { events } from '../../gameboard/events'

import { HypnoMode, PlayerGender, PlayerParts, type Credentials, type EventToken, type PornList } from '../../gameboard/types'

export interface ISettingsState {
  dialogShown: boolean
  pace: {
    min: number
    max: number
  }
  steepness: number
  duration: number
  credentials: Credentials | null
  pornList: PornList
  eventList: Array<EventToken['id']>
  hypnoMode: HypnoMode
  player: {
    gender: PlayerGender
    parts: PlayerParts
  }
  cum: {
    ejaculateLikelihood: number
    ruinLikelihood: number
  }
  walltakerLink: number | null
}

const settingsSlice = createSlice({
  name: 'settings',
  initialState: {
    dialogShown: false,
    pace: {
      min: 0.75,
      max: 5,
    },
    steepness: 0.05,
    duration: 6000,
    credentials: null,
    pornList: [],
    eventList: events.map((event) => event.id),
    hypnoMode: HypnoMode.JOI,
    player: { gender: PlayerGender.Male, parts: PlayerParts.Cock },
    cum: {
      ejaculateLikelihood: 100,
      ruinLikelihood: 0,
    },
    walltakerLink: null,
  } as ISettingsState,
  reducers: {
    OpenDialog: (state) => {
      state.dialogShown = true
    },
    CloseDialog: (state) => {
      state.dialogShown = false
    },
    SetMinPace: (state, action: PayloadAction<number>) => {
      state.pace.min = action.payload
    },
    SetMaxPace: (state, action: PayloadAction<number>) => {
      state.pace.max = action.payload
    },
    SetSteepness: (state, action: PayloadAction<number>) => {
      state.steepness = action.payload
    },
    SetDuration: (state, action: PayloadAction<number>) => {
      state.duration = action.payload
    },
    SetCredentials: (state, action: PayloadAction<Credentials | null>) => {
      state.credentials = action.payload
    },
    SetPornList: (state, action: PayloadAction<PornList>) => {
      state.pornList = action.payload
      console.log(action.payload)
    },
    SetEventList: (state, action: PayloadAction<Array<EventToken['id']>>) => {
      state.eventList = action.payload
    },
    SetHypnoMode: (state, action: PayloadAction<HypnoMode>) => {
      state.hypnoMode = action.payload
    },
    SetEjaculateLikelihood: (state, action: PayloadAction<number>) => {
      state.cum.ejaculateLikelihood = action.payload
    },
    SetRuinLikelihood: (state, action: PayloadAction<number>) => {
      state.cum.ruinLikelihood = action.payload
    },
    SetWalltakerLink: (state, action: PayloadAction<number | null>) => {
      state.walltakerLink = action.payload
    },
    SetPlayerGender: (state, action: PayloadAction<PlayerGender>) => {
      state.player.gender = action.payload
    },
    SetPlayerParts: (state, action: PayloadAction<PlayerParts>) => {
      state.player.parts = action.payload
    },
  },
})

export const SettingsActions = settingsSlice.actions

export type SettingsAction = (typeof SettingsActions)[keyof typeof SettingsActions]

export const SettingsReducer = settingsSlice.reducer

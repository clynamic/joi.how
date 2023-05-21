import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { ButtplugBrowserWebsocketClientConnector, ButtplugClient, type ButtplugClientDevice } from 'buttplug'
import { Vibrator } from '../../../services/vibrator'

const client = new ButtplugClient('JOI.how Client')

export enum VibrationStyleMode {
  THUMP,
  CONSTANT,
}

export interface ISettingsVibratorState {
  connection: string | null
  devices: Vibrator[]
  mode: VibrationStyleMode
  error: Error | null
}

export class FailedToConnect extends Error {
  inner: unknown | undefined

  constructor(inner: unknown | undefined, message?: string | undefined) {
    super(message)
    this.inner = inner
  }
}

const Connect = createAsyncThunk('vibratorSlice/connect', async (url: string | null, { dispatch }) => {
  dispatch(vibratorSlice.actions.ResetError())
  try {
    url ??= 'ws://127.0.0.1:12345'
    await client.connect(new ButtplugBrowserWebsocketClientConnector(url))
    await client.startScanning()
    client.devices.forEach((e) => dispatch(vibratorSlice.actions.Paired(new Vibrator(e))))
    client.addListener('deviceadded', (device: ButtplugClientDevice) => {
      dispatch(vibratorSlice.actions.Paired(new Vibrator(device)))
    })
    client.addListener('disconnect', () => {
      dispatch(vibratorSlice.actions.Disconnected())
    })
    dispatch(vibratorSlice.actions.Connected(url))
    return url
  } catch (e) {
    dispatch(vibratorSlice.actions.Error(new FailedToConnect(e)))
  }
})

const Disconnect = createAsyncThunk('vibratorSlice/disconnect', async () => {
  await client.disconnect()
  client.removeAllListeners()
})

const vibratorSlice = createSlice({
  name: 'vibrator',
  initialState: {
    connection: null,
    devices: [],
    mode: VibrationStyleMode.CONSTANT,
    error: null,
  } as ISettingsVibratorState,
  reducers: {
    Connected(state, action: PayloadAction<string>) {
      state.connection = action.payload
    },
    Disconnected(state) {
      state.connection = null
      state.devices = []
    },
    SetMode(state, action: PayloadAction<VibrationStyleMode>) {
      state.mode = action.payload
    },
    Paired(state, action: PayloadAction<Vibrator>) {
      state.devices.push(action.payload)
    },
    Unpaired(state, action: PayloadAction<Vibrator>) {
      state.devices = state.devices.filter((e) => e !== action.payload)
    },
    Error(state, action: PayloadAction<Error>) {
      state.error = action.payload
    },
    ResetError(state) {
      state.error = null
    },
  },
})

export const VibratorActions = {
  ...vibratorSlice.actions,
  Connect,
  Disconnect,
}

export type VibratorAction = (typeof VibratorActions)[keyof typeof VibratorActions]

export const VibratorReducer = vibratorSlice.reducer

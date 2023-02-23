import { createAsyncThunk } from '@reduxjs/toolkit'
import { wait } from '../../../../../helpers/helpers'
import { intensityToPaceBounds } from '../../../../../helpers/intensity'
import { round } from '../../../../../helpers/round'
import type { IState } from '../../../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { gameBoardSlice } from '../../reducer'

export const RandomPace = createAsyncThunk(
  'gameBoard/event-randomPace',
  async (messageType: MessageType.EventDescription | MessageType.NewEvent | undefined | null, { getState, dispatch }) => {
    const state = getState() as IState
    const bounds = intensityToPaceBounds(state.game.intensity, state.settings.steepness, state.settings.pace)
    const newPace = round(Math.random() * (bounds.max - bounds.min) + bounds.min)
    dispatch(
      (() => {
        if (messageType != null) {
          return gameBoardSlice.actions.ShowMessage({
            type: messageType,
            text: `Pace changed to ${newPace}!`,
          })
        } else {
          return gameBoardSlice.actions.ShowMessage({
            type: MessageType.NewEvent,
            text: `Pace changed to ${newPace}!`,
          })
        }
      })(),
    )
    dispatch(gameBoardSlice.actions.SetPace(newPace))
    dispatch(gameBoardSlice.actions.SetVibration(newPace / state.settings.pace.max))

    await wait(9000)
  },
)

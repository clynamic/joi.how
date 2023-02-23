import { createAsyncThunk } from '@reduxjs/toolkit'
import { wait } from '../../../../../helpers/helpers'
import { intensityToPaceBounds } from '../../../../../helpers/intensity'
import { round } from '../../../../../helpers/round'
import type { IState } from '../../../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { gameBoardSlice } from '../../reducer'

export const RisingPace = createAsyncThunk('gameBoard/event-risingPace', async (acceleration: number, { getState, dispatch }) => {
  const state = getState() as IState
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Rising pace strokes!`,
    }),
  )

  const bounds = intensityToPaceBounds(state.game.intensity, state.settings.steepness, state.settings.pace)
  const portion = round((bounds.max - state.settings.pace.min) / acceleration)
  let currentPace = state.settings.pace.min
  for (let i = 0; i < acceleration; i++) {
    await wait(10000)
    dispatch(
      gameBoardSlice.actions.ShowMessage({
        type: MessageType.EventDescription,
        text: `Pace set to ${round(currentPace)}`,
      }),
    )
    dispatch(gameBoardSlice.actions.SetVibration(round(currentPace) / state.settings.pace.max))
    dispatch(gameBoardSlice.actions.SetPace(round(currentPace)))
    currentPace += portion
  }
  await wait(10000)
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Stay at this pace for a bit`,
    }),
  )
  await wait(15000)
})

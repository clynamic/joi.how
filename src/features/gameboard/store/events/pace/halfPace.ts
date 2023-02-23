import { createAsyncThunk } from '@reduxjs/toolkit'
import { wait } from '../../../../../helpers/helpers'
import type { IState } from '../../../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { gameBoardSlice } from '../../reducer'
import { RandomPace } from './randomPace'

export const HalfPace = createAsyncThunk('gameBoard/event-halfPace', async (_, { getState, dispatch }) => {
  const state = getState() as IState
  const newPace = Math.max(state.game.pace / 2, state.settings.pace.min)
  const duration = Math.ceil(Math.random() * 20000) + 12000
  const durationPortion = duration / 3
  dispatch(gameBoardSlice.actions.SetVibration(newPace / state.settings.pace.max))
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Half pace!`,
    }),
  )
  dispatch(gameBoardSlice.actions.SetPace(newPace))
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.EventDescription,
      text: `3...`,
    }),
  )

  await wait(durationPortion)
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.EventDescription,
      text: `2...`,
    }),
  )

  await wait(durationPortion)
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.EventDescription,
      text: `1...`,
    }),
  )

  await wait(durationPortion)
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Done! Back to normal pace`,
    }),
  )

  dispatch(RandomPace(MessageType.EventDescription))
})

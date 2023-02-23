import { createAsyncThunk } from '@reduxjs/toolkit'
import { wait } from '../../../../../helpers/helpers'
import type { IState } from '../../../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { gameBoardSlice } from '../../reducer'
import { RandomPace } from './randomPace'

export const DoublePace = createAsyncThunk('gameBoard/event-doublePace', async (_, { getState, dispatch }) => {
  const state = getState() as IState
  const newPace = Math.min(state.game.pace * 2, state.settings.pace.max)
  dispatch(gameBoardSlice.actions.SetVibration(newPace / state.settings.pace.max))
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Double pace!`,
    }),
  )
  dispatch(gameBoardSlice.actions.SetPace(newPace))

  await wait(3000)
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.EventDescription,
      text: `3...`,
    }),
  )

  await wait(3000)
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.EventDescription,
      text: `2...`,
    }),
  )

  await wait(3000)
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.EventDescription,
      text: `1...`,
    }),
  )

  await wait(3000)
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Done! Back to normal pace`,
    }),
  )

  dispatch(RandomPace(MessageType.EventDescription)) // This event resumes afterwards
})

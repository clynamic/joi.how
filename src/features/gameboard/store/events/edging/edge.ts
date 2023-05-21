import { createAsyncThunk } from '@reduxjs/toolkit'
import { wait } from '../../../../../helpers/helpers'
import type { IState } from '../../../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { gameBoardSlice } from '../../reducer'

export const Edge = createAsyncThunk('gameBoard/event-edge', async (_, { getState, dispatch }) => {
  dispatch(gameBoardSlice.actions.Edge())
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `You should getting close to the edge. Don't cum yet.`,
    }),
  )
  dispatch(gameBoardSlice.actions.SetPace((getState() as IState).settings.pace.min))
  await wait(10000)
})

import { createAsyncThunk } from '@reduxjs/toolkit'
import type { IState } from '../../../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { PlayerParts } from '../../../types'
import { gameBoardSlice } from '../../reducer'

export const CleanMess = createAsyncThunk('gameBoard/event-cleanMess', async (_, { getState, dispatch }) => {
  const state = getState() as IState
  let msg
  switch (state.settings.player.parts) {
    case PlayerParts.Cock:
      msg = "pre you've leaked"
      break
    case PlayerParts.Pussy:
      msg = "juices you've made"
      break
    case PlayerParts.Neuter:
    default:
      msg = "mess you've made"
      break
  }
  dispatch(gameBoardSlice.actions.StopEvents())
  dispatch(gameBoardSlice.actions.StopGame())
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.Prompt,
      text: `Lick up any ${msg}`,
      buttons: [
        {
          display: `I'm done $master`,
          method: () => {
            dispatch(gameBoardSlice.actions.StartEvents())
            dispatch(gameBoardSlice.actions.StartGame())
            dispatch(
              gameBoardSlice.actions.ShowMessage({
                type: MessageType.NewEvent,
                text: 'Good $player.',
              }),
            )
          },
        },
      ],
    }),
  )
})

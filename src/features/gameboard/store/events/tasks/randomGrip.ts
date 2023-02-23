import { createAsyncThunk } from '@reduxjs/toolkit'
import type { IState } from '../../../../../store'

import { wait } from '../../../../../helpers/helpers'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { EGrip } from '../../../types'
import { gameBoardSlice } from '../../reducer'

function stringifyGrip(grip: EGrip): string {
  switch (grip) {
    case EGrip.both:
      return 'both $hands'
    case EGrip.left:
      return 'left $hand'
    case EGrip.right:
      return 'right $hand'
    case EGrip.none:
      return '$hands off!'
  }
}

export const RandomGrip = createAsyncThunk('gameBoard/event-randomGrip', async (_, { getState, dispatch }) => {
  const state = getState() as IState
  const seed = Math.random()
  let newGrip: EGrip = EGrip.none
  if (seed < 0.3) newGrip = state.game.grip === EGrip.both ? EGrip.left : EGrip.both
  if (seed >= 0.3 && seed < 0.6) newGrip = state.game.grip === EGrip.left ? EGrip.right : EGrip.left
  if (seed >= 0.6 && seed <= 1) newGrip = state.game.grip === EGrip.right ? EGrip.both : EGrip.right
  dispatch(
    gameBoardSlice.actions.ShowMessage({
      type: MessageType.NewEvent,
      text: `Grip changed to ${stringifyGrip(newGrip)}!`,
    }),
  )
  dispatch(gameBoardSlice.actions.SetGrip(newGrip))
  await wait(10000)
})

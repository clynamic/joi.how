import { MessageType } from '../../../MessageArea/MessageTypes'
import { GameBoardActions } from '../../../store'
import { EGrip, type GameEvent } from '../../../types'
import { wait } from '../../helpers'

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

export const randomGrip: GameEvent = () => {
  return async (state, dispatch) => {
    const seed = Math.random()
    let newGrip: EGrip = EGrip.none
    if (seed < 0.3) newGrip = state.game.grip === EGrip.both ? EGrip.left : EGrip.both
    if (seed >= 0.3 && seed < 0.6) newGrip = state.game.grip === EGrip.left ? EGrip.right : EGrip.left
    if (seed >= 0.6 && seed <= 1) newGrip = state.game.grip === EGrip.right ? EGrip.both : EGrip.right
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Grip changed to ${stringifyGrip(newGrip)}!`,
      }),
    )
    dispatch(GameBoardActions.SetGrip(newGrip))
    await wait(10000)
  }
}

import { MessageType } from '../../../MessageArea/MessageTypes'
import { GameBoardActions } from '../../../store'
import { type GameEvent } from '../../../types'
import { wait } from '../../helpers'

export const pause: GameEvent = () => {
  return async (state, dispatch) => {
    const duration = Math.ceil(-100 * state.game.intensity + 12000)
    dispatch(GameBoardActions.SetVibration(0))
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Stop stroking!`,
      }),
    )
    dispatch(GameBoardActions.PauseGame())

    await wait(duration)

    dispatch(GameBoardActions.SetVibration(state.game.pace / state.settings.pace.max))
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `Start stroking again.`,
      }),
    )
    dispatch(GameBoardActions.ResumeGame())
  }
}

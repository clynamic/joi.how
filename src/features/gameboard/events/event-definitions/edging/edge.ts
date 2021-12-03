import { GameEvent } from '../../../types'
import { GameBoardActions } from '../../../store'
import { MessageType } from '../../../MessageArea/MessageTypes'
import { wait } from '../../helpers'

export const edge: GameEvent = () => {
  return async (state, dispatch) => {
    dispatch(
      GameBoardActions.ShowMessage({
        type: MessageType.NewEvent,
        text: `You should getting close to the edge. Don't cum yet.`,
      }),
    )
    dispatch(GameBoardActions.SetPace(state.settings.pace.min))
    await wait(10000)
  }
}
